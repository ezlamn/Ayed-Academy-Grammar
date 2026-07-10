/* ================================================================
   TOOLS.JS — Highlight 2.0, Erase, Notes, Zoom & Toolbar Controls
   Grammar Strategies — Ayed Academy

   Highlighting UX:
   - Select any text → floating bubble with color swatches + eraser
     (no need to enter highlight mode first).
   - Highlight mode → selection is instantly marked in gold.
   - Click an existing mark (no mode) → bubble to recolor / remove it.
   - Eraser mode → click any mark to remove it. Escape exits any mode.
   ================================================================ */

// Palette of mark colors (class suffixes — styled in theme-modern.css)
const HL_PALETTE = [
  { key: 'gold',  label: 'ذهبي' },
  { key: 'green', label: 'أخضر' },
  { key: 'rose',  label: 'وردي' },
  { key: 'blue',  label: 'أزرق' },
];

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
    hideHlPopup();
    updateToolState();
    if (GS.ui.highlightMode) showToast('highlighter', 'اسحب على أي نص ليتظلّل فورًا');
  };
  const doErase = () => {
    GS.ui.eraserMode = !GS.ui.eraserMode;
    GS.ui.highlightMode = false;
    hideHlPopup();
    updateToolState();
    if (GS.ui.eraserMode) showToast('eraser', 'انقر على أي تظليل لإزالته');
  };
  const doClearHl = () => {
    if (!confirm('مسح جميع التظليلات في هذا الدرس؟')) return;
    const uid = GS.UNITS[GS.currentUnit].id;
    delete GS.student.highlights[uid];
    localStorage.setItem('gs_highlights', JSON.stringify(GS.student.highlights));
    loadUnit(GS.currentUnit);
    showToast('trash', 'تم مسح التظليلات', 't-success');
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

  // ── SELECTION END → instant mark (mode) or floating bubble ──
  const onSelectEnd = () => {
    if (GS.ui.eraserMode) return;
    if (GS.ui.highlightMode) { applyHighlight('gold'); return; }
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    if (!pc.contains(range.commonAncestorContainer)) return;
    if (!range.toString().trim()) return;
    GS._hlPopupTarget = null;
    showHlPopup(range.getBoundingClientRect());
  };
  pc.addEventListener('mouseup',  () => setTimeout(onSelectEnd, 10));
  pc.addEventListener('touchend', () => setTimeout(onSelectEnd, 200));

  // Hide the bubble when the selection collapses (unless targeting a mark)
  document.addEventListener('selectionchange', () => {
    clearTimeout(GS._hlSelTimer);
    GS._hlSelTimer = setTimeout(() => {
      const sel = window.getSelection();
      if ((!sel || sel.isCollapsed) && !GS._hlPopupTarget) hideHlPopup();
    }, 120);
  });
  pc.addEventListener('scroll', hideHlPopup, { passive: true });

  // Clicking outside the bubble dismisses a mark-targeted bubble
  document.addEventListener('mousedown', e => {
    const popup = $('hl-popup');
    if (popup && !popup.contains(e.target)) {
      if (GS._hlPopupTarget && !findHlAncestor(e.target, pc)) hideHlPopup();
    }
  });

  // ── CLICK ON AN EXISTING MARK (no mode) → recolor / remove bubble ──
  pc.addEventListener('click', e => {
    if (GS.ui.highlightMode || GS.ui.eraserMode) return;
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed) return; // selection bubble handles this
    const mark = findHlAncestor(e.target, pc);
    if (!mark) return;
    GS._hlPopupTarget = mark;
    showHlPopup(mark.getBoundingClientRect());
  });

  // ── ERASE (eraser mode) ──
  pc.addEventListener('click', e => {
    if (!GS.ui.eraserMode) return;
    const mark = findHlAncestor(e.target, pc);
    if (!mark) return;
    unwrapHl(mark);
    saveHighlights();
    refreshHlButtons();
  });

  // Escape exits highlight/eraser mode and closes the bubble
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    hideHlPopup();
    if (GS.ui.highlightMode || GS.ui.eraserMode) {
      GS.ui.highlightMode = false;
      GS.ui.eraserMode = false;
      updateToolState();
    }
  });
}

// ── APPLY A MARK TO THE CURRENT SELECTION ─────────────────────
function applyHighlight(color) {
  const pc  = $('page-content');
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || !sel.rangeCount) return;
  const range = sel.getRangeAt(0);
  if (!pc.contains(range.commonAncestorContainer)) return;

  try { expandRangeToWordBoundaries(range); } catch (e) {}

  // Split boundary text nodes so only the selected part gets wrapped.
  // End first: splitting the start first would shift the end offset
  // when both boundaries sit in the same text node.
  try {
    if (range.endContainer.nodeType === Node.TEXT_NODE &&
        range.endOffset < range.endContainer.textContent.length) {
      range.endContainer.splitText(range.endOffset);
    }
    if (range.startContainer.nodeType === Node.TEXT_NODE && range.startOffset > 0) {
      const tail = range.startContainer.splitText(range.startOffset);
      range.setStart(tail, 0);
    }
  } catch (e) {
    console.warn('Failed to split boundary text nodes:', e);
  }

  const anc  = range.commonAncestorContainer;
  const root = anc.nodeType === Node.TEXT_NODE ? anc.parentNode : anc;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  let node;
  while ((node = walker.nextNode())) {
    if (!range.intersectsNode(node)) continue;
    if (!node.textContent.trim()) continue;
    const parent = node.parentElement;
    if (!parent || parent.closest('svg, script, style, textarea, input, button')) continue;
    nodes.push(node);
  }

  let marked = 0;
  nodes.forEach(n => {
    const parent = n.parentElement;
    // Text already alone inside a mark → just recolor it
    if (parent.classList.contains('gs-hl') && parent.childNodes.length === 1) {
      setHlColor(parent, color);
      marked++;
      return;
    }
    const span = document.createElement('span');
    parent.insertBefore(span, n);
    span.appendChild(n);
    setHlColor(span, color);
    marked++;
  });

  sel.removeAllRanges();
  if (marked) { saveHighlights(); refreshHlButtons(); }
}

// ── FLOATING BUBBLE (color swatches + eraser) ─────────────────
function buildHlPopup() {
  let p = $('hl-popup');
  if (p) return p;
  p = document.createElement('div');
  p.id = 'hl-popup';
  p.className = 'hl-popup';
  const eraseIcon = window.AyIcon ? AyIcon.svg('eraser') : '✕';
  p.innerHTML =
    HL_PALETTE.map(c =>
      `<button type="button" class="hl-swatch ${c.key}" data-hl-color="${c.key}" title="تظليل ${c.label}"></button>`
    ).join('') +
    `<span class="hl-pop-sep"></span>` +
    `<button type="button" class="hl-pop-erase" data-hl-erase title="إزالة التظليل">${eraseIcon}</button>`;

  // Keep the text selection alive while interacting with the bubble
  p.addEventListener('mousedown', e => e.preventDefault());

  p.addEventListener('click', e => {
    const swatch = e.target.closest('[data-hl-color]');
    const erase  = e.target.closest('[data-hl-erase]');
    const target = GS._hlPopupTarget;
    if (swatch) {
      if (target) { setHlColor(target, swatch.dataset.hlColor); saveHighlights(); }
      else applyHighlight(swatch.dataset.hlColor);
    } else if (erase) {
      if (target) { unwrapHl(target); saveHighlights(); }
      else eraseInSelection();
    } else {
      return;
    }
    hideHlPopup();
    refreshHlButtons();
  });

  document.body.appendChild(p);
  return p;
}

function showHlPopup(rect) {
  const p  = buildHlPopup();
  const pw = p.offsetWidth, ph = p.offsetHeight;

  let top = rect.top - ph - 12, below = false;
  if (top < 64) { top = rect.bottom + 12; below = true; }

  let left = rect.left + rect.width / 2 - pw / 2;
  left = Math.max(10, Math.min(left, window.innerWidth - pw - 10));

  const arrowX = Math.max(16, Math.min(rect.left + rect.width / 2 - left, pw - 16));
  p.style.setProperty('--arrow-x', arrowX + 'px');
  p.classList.toggle('below', below);
  p.style.top  = top + 'px';
  p.style.left = left + 'px';
  p.classList.add('show');
}

function hideHlPopup() {
  const p = $('hl-popup');
  if (p) p.classList.remove('show');
  GS._hlPopupTarget = null;
}

// ── MARK HELPERS ──────────────────────────────────────────────
function setHlColor(el, color) {
  [...el.classList].filter(c => c.indexOf('gs-hl') === 0).forEach(c => el.classList.remove(c));
  el.style.backgroundColor = '';
  if (el.getAttribute('style') !== null && !el.style.cssText.trim()) el.removeAttribute('style');
  el.classList.add('gs-hl', 'gs-hl-' + color, 'gs-hl-new');
  setTimeout(() => el.classList.remove('gs-hl-new'), 700);
}

// Find the highlight mark wrapping a node (new class-based or legacy inline)
function findHlAncestor(t, pc) {
  while (t && t !== pc) {
    if (t.classList && t.classList.contains('gs-hl')) return t;
    if (t.style && t.style.backgroundColor) return t;
    t = t.parentNode;
  }
  return null;
}

// Remove a mark; unwrap the span entirely if nothing else is on it
function unwrapHl(el) {
  [...el.classList].filter(c => c.indexOf('gs-hl') === 0).forEach(c => el.classList.remove(c));
  el.style.backgroundColor = '';
  if (el.getAttribute('style') !== null && !el.style.cssText.trim()) el.removeAttribute('style');
  if (el.tagName === 'SPAN' && !el.className && !el.id && !el.getAttribute('style')) {
    const parent = el.parentNode;
    while (el.firstChild) parent.insertBefore(el.firstChild, el);
    parent.removeChild(el);
    parent.normalize();
  }
}

// Remove every mark intersecting the current selection
function eraseInSelection() {
  const pc  = $('page-content');
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount || sel.isCollapsed) return;
  const range = sel.getRangeAt(0);
  let removed = 0;
  pc.querySelectorAll('.gs-hl, span[style*="background"]').forEach(sp => {
    try {
      if (range.intersectsNode(sp)) { unwrapHl(sp); removed++; }
    } catch (e) { /* node detached by a previous unwrap */ }
  });
  sel.removeAllRanges();
  if (removed) { saveHighlights(); refreshHlButtons(); }
}

// Show/hide the eraser & clear buttons based on remaining marks
function refreshHlButtons() {
  const pc  = $('page-content');
  const has = !!pc.querySelector('.gs-hl, span[style*="background"]');
  ['btn-eraser', 'btn-clear-hl', 'mob-btn-eraser', 'mob-btn-clear-hl'].forEach(id => {
    const el = $(id);
    if (el) el.classList.toggle('hidden', !has);
  });
  if (!has && GS.ui.eraserMode) {
    GS.ui.eraserMode = false;
    updateToolState();
  }
}

// ── TOOL STATE UPDATE ─────────────────────────────────────────
function updateToolState() {
  const pc     = $('page-content');
  const hlBtn  = $('btn-highlight');
  const erBtn  = $('btn-eraser');
  const clrBtn = $('btn-clear-hl');
  const modebar = $('mode-bar');
  const modeText = $('mode-bar-text');

  hlBtn.classList.toggle('active', GS.ui.highlightMode);
  erBtn.classList.toggle('active-eraser', GS.ui.eraserMode);

  if (pc) {
    pc.classList.toggle('hl-mode', GS.ui.highlightMode);
    pc.classList.toggle('eraser-mode', GS.ui.eraserMode);
  }

  const mobHl  = $('mob-btn-highlight');
  const mobEr  = $('mob-btn-eraser');
  const mobClr = $('mob-btn-clear-hl');
  if (mobHl)  mobHl.classList.toggle('active', GS.ui.highlightMode);
  if (mobEr)  mobEr.classList.toggle('active-eraser', GS.ui.eraserMode);
  if (mobEr)  mobEr.classList.toggle('hidden', !erBtn || erBtn.classList.contains('hidden'));
  if (mobClr) mobClr.classList.toggle('hidden', !clrBtn || clrBtn.classList.contains('hidden'));

  if (GS.ui.highlightMode) {
    modebar.classList.remove('hidden', 'eraser');
    modeText.innerHTML = AyIcon.svg('highlighter') + '  وضع التظليل — اسحب على أي نص ليتظلّل بالذهبي فورًا';
  } else if (GS.ui.eraserMode) {
    modebar.classList.remove('hidden');
    modebar.classList.add('eraser');
    modeText.innerHTML = AyIcon.svg('eraser') + '  وضع الممحاة — انقر على أي تظليل لإزالته';
  } else {
    modebar.classList.add('hidden');
    modebar.classList.remove('eraser');
  }
}

// ── SAVE HIGHLIGHTS ───────────────────────────────────────────
function saveHighlights() {
  const uid = GS.UNITS[GS.currentUnit].id;
  // Strip the transient pop-animation class so it never replays on load
  const clone = $('page-content').cloneNode(true);
  clone.querySelectorAll('.gs-hl-new').forEach(el => el.classList.remove('gs-hl-new'));
  GS.student.highlights[uid] = clone.innerHTML;
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