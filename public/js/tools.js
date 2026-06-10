/* ================================================================
   TOOLS.JS — Highlight, Erase, Notes, Zoom & Toolbar Controls
   Grammar Strategies — Ayed Academy
   ================================================================ */

// ── TOOLS BINDING ─────────────────────────────────────────────
function bindTools() {
  const pc     = $('page-content');
  const hlBtn  = $('btn-highlight');
  const erBtn  = $('btn-eraser');
  const clrBtn = $('btn-clear-hl');

  // Helper: bind a button id if it exists
  const bindBtn = (id, fn) => { const el = $(id); if (el) el.addEventListener('click', fn); };

  // Zoom (desktop + mobile)
  const doZoomIn  = () => { GS.ui.fontSize = Math.min(22, GS.ui.fontSize + 1); pc.style.fontSize = GS.ui.fontSize + 'px'; };
  const doZoomOut = () => { GS.ui.fontSize = Math.max(12, GS.ui.fontSize - 1); pc.style.fontSize = GS.ui.fontSize + 'px'; };
  bindBtn('btn-zoom-in',      doZoomIn);
  bindBtn('btn-zoom-out',     doZoomOut);
  bindBtn('mob-btn-zoom-in',  doZoomIn);
  bindBtn('mob-btn-zoom-out', doZoomOut);

  // Mobile notes button
  bindBtn('mob-btn-notes', openNotes);

  const doHighlight = () => {
    GS.ui.highlightMode = !GS.ui.highlightMode;
    GS.ui.eraserMode = false;
    updateToolState();
    if (GS.ui.highlightMode) showToast('🖍️', 'حدد أي نص لتظليله');
  };
  const doErase = () => {
    GS.ui.eraserMode = !GS.ui.eraserMode;
    GS.ui.highlightMode = false;
    updateToolState();
    if (GS.ui.eraserMode) showToast('🧽', 'انقر على أي نص مُظلَّل لإزالته');
  };
  const doClearHl = () => {
    if (!confirm('مسح جميع التظليلات في هذا الدرس؟')) return;
    const uid = GS.UNITS[GS.currentUnit].id;
    delete GS.student.highlights[uid];
    localStorage.setItem('gs_highlights', JSON.stringify(GS.student.highlights));
    loadUnit(GS.currentUnit);
    showToast('🗑️', 'تم مسح التظليلات', 't-success');
  };

  hlBtn.addEventListener('click', doHighlight);
  erBtn.addEventListener('click', doErase);
  clrBtn.addEventListener('click', doClearHl);
  bindBtn('mob-btn-highlight', doHighlight);
  bindBtn('mob-btn-eraser',    doErase);
  bindBtn('mob-btn-clear-hl',  doClearHl);

  $('mode-bar-close').addEventListener('click', () => {
    GS.ui.highlightMode = false;
    GS.ui.eraserMode = false;
    updateToolState();
  });

  // ── HIGHLIGHT ──
  pc.addEventListener('mouseup', () => {
    if (!GS.ui.highlightMode) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;

    try {
      const range = sel.getRangeAt(0);
      expandRangeToWordBoundaries(range);
      sel.removeAllRanges();
      sel.addRange(range);
    } catch (e) {
      console.warn("Failed to expand selection to word boundaries:", e);
    }

    pc.contentEditable = 'true';
    document.execCommand('hiliteColor', false, 'rgba(245,166,35,0.35)');
    pc.contentEditable = 'false';
    sel.removeAllRanges();
    saveHighlights();
    erBtn.classList.remove('hidden');
    clrBtn.classList.remove('hidden');
  });

  // ── ERASE ──
  pc.addEventListener('click', e => {
    if (!GS.ui.eraserMode) return;
    let t = e.target;
    while (t && t !== pc) {
      if (t.style && t.style.backgroundColor) {
        t.style.backgroundColor = '';
        if (t.tagName === 'SPAN' && !t.getAttribute('class') && !t.style.cssText.trim()) {
          const p = t.parentNode;
          while (t.firstChild) p.insertBefore(t.firstChild, t);
          p.removeChild(t);
        }
        saveHighlights();
        return;
      }
      t = t.parentNode;
    }
  });
}

// ── TOOL STATE UPDATE ─────────────────────────────────────────
function updateToolState() {
  const hlBtn  = $('btn-highlight');
  const erBtn  = $('btn-eraser');
  const clrBtn = $('btn-clear-hl');
  const modebar = $('mode-bar');
  const modeText = $('mode-bar-text');

  hlBtn.classList.toggle('active', GS.ui.highlightMode);
  erBtn.classList.toggle('active-eraser', GS.ui.eraserMode);

  const mobHl  = $('mob-btn-highlight');
  const mobEr  = $('mob-btn-eraser');
  const mobClr = $('mob-btn-clear-hl');
  if (mobHl)  mobHl.classList.toggle('active', GS.ui.highlightMode);
  if (mobEr)  mobEr.classList.toggle('active-eraser', GS.ui.eraserMode);
  if (mobEr)  mobEr.classList.toggle('hidden', !erBtn || erBtn.classList.contains('hidden'));
  if (mobClr) mobClr.classList.toggle('hidden', !clrBtn || clrBtn.classList.contains('hidden'));

  if (GS.ui.highlightMode) {
    modebar.classList.remove('hidden', 'eraser');
    modeText.textContent = '🖍️  وضع التظليل مفعَّل — حدد أي نص لتظليله بالذهبي';
  } else if (GS.ui.eraserMode) {
    modebar.classList.remove('hidden');
    modebar.classList.add('eraser');
    modeText.textContent = '🧽  الممحاة مفعَّلة — انقر على أي نص مُظلَّل لإزالته';
  } else {
    modebar.classList.add('hidden');
    modebar.classList.remove('eraser');
  }
}

// ── SAVE HIGHLIGHTS ───────────────────────────────────────────
function saveHighlights() {
  const uid = GS.UNITS[GS.currentUnit].id;
  GS.student.highlights[uid] = $('page-content').innerHTML;
  localStorage.setItem('gs_highlights', JSON.stringify(GS.student.highlights));
}

// ── NOTES ─────────────────────────────────────────────────────
function bindNotes() {
  $('btn-notes-top').addEventListener('click', openNotes);
  $('notes-close').addEventListener('click', closeNotes);
  $('notes-overlay').addEventListener('click', closeNotes);

  $('save-notes-btn').addEventListener('click', () => {
    const uid = GS.UNITS[GS.currentUnit].id;
    GS.student.notes[uid] = $('notes-area').value;
    localStorage.setItem('gs_notes', JSON.stringify(GS.student.notes));
    const ind = $('notes-saved');
    ind.classList.remove('hidden');
    setTimeout(() => ind.classList.add('hidden'), 2500);
  });

  $('notes-area').addEventListener('input', () => {
    clearTimeout(GS._notesSaveTimer);
    GS._notesSaveTimer = setTimeout(() => {
      const uid = GS.UNITS[GS.currentUnit].id;
      GS.student.notes[uid] = $('notes-area').value;
      localStorage.setItem('gs_notes', JSON.stringify(GS.student.notes));
    }, 1000);
  });
}

function openNotes() {
  const uid = GS.UNITS[GS.currentUnit].id;
  $('notes-area').value = GS.student.notes[uid] || '';
  $('notes-panel').classList.add('open');
  $('notes-overlay').classList.remove('hidden');
  $('notes-area').focus();
}

function closeNotes() {
  $('notes-panel').classList.remove('open');
  $('notes-overlay').classList.add('hidden');
}

// ── WORD BOUNDARY HELPERS ─────────────────────────────────────
function expandRangeToWordBoundaries(range) {
  if (range.startContainer.nodeType === Node.TEXT_NODE) {
    const text = range.startContainer.textContent;
    let offset = range.startOffset;
    while (offset > 0 && !isWordBoundary(text[offset - 1])) offset--;
    range.setStart(range.startContainer, offset);
  }
  if (range.endContainer.nodeType === Node.TEXT_NODE) {
    const text = range.endContainer.textContent;
    let offset = range.endOffset;
    while (offset < text.length && !isWordBoundary(text[offset])) offset++;
    range.setEnd(range.endContainer, offset);
  }
}

function isWordBoundary(char) {
  return /[\s\.,\/#!$%\^&\*;:{}=\-_`~()\[\]{}«»؟?،؛"']/.test(char);
}
