/* ================================================================
   GRAMMAR STRATEGIES — INTERACTIVE BOOK  app.js
   Full Professional Build with Dynamic Backend
   ================================================================ */

// ── STATE ──────────────────────────────────────────────────────
const GS = {
  UNITS: [],
  currentUnit: 0,
  student: {
    name: localStorage.getItem('gs_student_name') || '',
    completedUnits: JSON.parse(localStorage.getItem('gs_completed') || '[]'),
    notes: JSON.parse(localStorage.getItem('gs_notes') || '{}'),
    highlights: JSON.parse(localStorage.getItem('gs_highlights') || '{}'),
  },
  ui: {
    highlightMode: false,
    eraserMode: false,
    fontSize: 16,
  },
  quizState: { answers: {}, submitted: false }
};

// ── SHORTCUTS ──────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const pageContent = $('page-content');
const unitsNav    = $('units-nav');

// ── BOOTSTRAP ──────────────────────────────────────────────────
async function boot() {
  try {
    const res = await fetch('/api/units');
    GS.UNITS = await res.json();
    initSplash();
  } catch (err) {
    alert('فشل الاتصال بالسيرفر! تأكد من تشغيل server.js');
  }
}

// ── SPLASH / ONBOARDING ────────────────────────────────────────
function initSplash() {
  const splash = $('splash');
  const nameInput = $('student-name-input');
  const startBtn = $('splash-start');

  // If already has name, pre-fill
  if (GS.student.name) nameInput.value = GS.student.name;

  startBtn.addEventListener('click', () => {
    const name = nameInput.value.trim() || 'طالب';
    GS.student.name = name;
    localStorage.setItem('gs_student_name', name);
    splash.classList.add('fade-out');
    setTimeout(() => {
      splash.style.display = 'none';
      $('app').classList.remove('hidden');
      initApp();
    }, 700);
  });

  // Allow pressing Enter
  nameInput.addEventListener('keydown', e => { if (e.key === 'Enter') startBtn.click(); });
}

// ── INIT APP ───────────────────────────────────────────────────
function initApp() {
  const name = GS.student.name;
  $('student-name-display').textContent = name;
  $('student-avatar').textContent = name.charAt(0);

  buildUnitsNav();
  if (GS.UNITS.length > 0) loadUnit(0);
  bindTopbar();
  bindNotes();
  bindTools();
}

// ── UNITS NAVIGATION ──────────────────────────────────────────
function buildUnitsNav() {
  unitsNav.innerHTML = '';
  GS.UNITS.forEach((u, i) => {
    const done = GS.student.completedUnits.includes(u.id);
    const active = i === GS.currentUnit;
    const el = document.createElement('div');
    el.className = `unit-nav-item${active ? ' active' : ''}${done ? ' completed' : ''}`;
    el.innerHTML = `
      <div class="unit-nav-num">${done ? '✓' : u.id}</div>
      <div class="unit-nav-info">
        <div class="unit-nav-ar">${u.emoji} ${u.nameAr}</div>
        <div class="unit-nav-en">${u.nameEn}</div>
      </div>
      ${done ? '<div class="unit-nav-check">✅</div>' : ''}
    `;
    el.addEventListener('click', () => {
      loadUnit(i);
      if (window.innerWidth <= 900) closePanel();
    });
    unitsNav.appendChild(el);
  });
  updateProgress();
}

function updateProgress() {
  const total = GS.UNITS.length;
  if(total === 0) return;
  const done  = GS.student.completedUnits.length;
  const pct   = Math.round((done / total) * 100);
  $('progress-fill').style.width = pct + '%';
  $('progress-label').textContent = `${done} / ${total}`;
  $('panel-progress-inner').style.width = pct + '%';
  $('panel-progress-text').textContent = pct + '% مكتمل';
}

// ── TOPBAR BINDINGS ───────────────────────────────────────────
function bindTopbar() {
  $('btn-menu').addEventListener('click', () => {
    const panel = $('units-panel');
    const overlay = $('overlay');
    panel.classList.toggle('open');
    overlay.classList.toggle('hidden', !panel.classList.contains('open'));
  });

  $('overlay').addEventListener('click', closePanel);

  $('btn-prev-unit').addEventListener('click', () => {
    if (GS.currentUnit > 0) loadUnit(GS.currentUnit - 1);
  });
  $('btn-next-unit').addEventListener('click', () => {
    if (GS.currentUnit < GS.UNITS.length - 1) loadUnit(GS.currentUnit + 1);
  });

  $('btn-notes-top').addEventListener('click', openNotes);
}

function closePanel() {
  $('units-panel').classList.remove('open');
  $('overlay').classList.add('hidden');
}

// ── LOAD UNIT ─────────────────────────────────────────────────
function loadUnit(idx) {
  if (!GS.UNITS[idx]) return;
  GS.currentUnit = idx;
  const unit = GS.UNITS[idx];

  buildUnitsNav();
  $('bc-unit').textContent = unit.page?.tag || `الوحدة ${unit.id}`;
  $('bc-strat').textContent = unit.nameAr;
  $('bottom-unit-indicator').textContent = `${idx + 1} / ${GS.UNITS.length}`;

  const saved = GS.student.highlights[unit.id];
  if (saved) {
    pageContent.innerHTML = saved;
    bindInteractiveElements();
    $('btn-eraser').classList.remove('hidden');
    $('btn-clear-hl').classList.remove('hidden');
  } else {
    renderUnit(unit);
    $('btn-eraser').classList.add('hidden');
    $('btn-clear-hl').classList.add('hidden');
  }

  GS.ui.highlightMode = false;
  GS.ui.eraserMode = false;
  updateToolState();

  $('notes-unit-label').textContent = `📍 ${unit.page?.tag} — ${unit.nameAr}`;
  pageContent.scrollTop = 0;
}

// ── RENDER UNIT ───────────────────────────────────────────────
function renderUnit(unit) {
  const p = unit.page || {};
  let html = `
    <div class="unit-header animate-in">
      <div>
        <div class="unit-tag">${p.tag || ''}</div>
        <div class="unit-h-title">${unit.emoji} ${unit.nameAr}</div>
        <div class="unit-h-en">${unit.nameEn}</div>
      </div>
      <div class="unit-h-mascot">${p.mascot || ''}</div>
    </div>
  `;

  (p.strategies || []).forEach((s, si) => {
    html += renderStrategy(s, si);
  });

  const quizzes = p.quizzes || [];
  if (quizzes.length > 0) {
    html += `
      <div class="unit-end-cta animate-in">
        <h3>هل أنت مستعد للاختبار الشامل؟</h3>
        <p>تم تغطية جميع الاستراتيجيات. أجب عن الأسئلة لتتحقق من فهمك.</p>
        <button id="open-big-quiz">🎯 بدء الاختبار الشامل للوحدة (${quizzes.length} أسئلة)</button>
      </div>
    `;
  }

  pageContent.innerHTML = html;
  bindInteractiveElements();
}

function renderStrategy(strat, si) {
  // Media (Image & Audio)
  const mediaHtml = `
    ${strat.imageUrl ? `<div class="media-box"><img src="${strat.imageUrl}" alt="صورة توضيحية"></div>` : ''}
    ${strat.audioUrl ? `<div class="media-box"><audio controls src="${strat.audioUrl}"></audio></div>` : ''}
  `;

  const kwHtml = (strat.keywords || []).map(kw => `
    <div class="kw-reveal" onclick="this.classList.toggle('expanded')">
      <div class="kw-en-box">${kw.f}</div>
      <div class="kw-ar-box">${kw.b}</div>
    </div>
  `).join('');

  const fRows = (strat.formulas || []).map(f => `
    <div class="formula-block" dir="ltr">
      <div class="fb-subj" dir="rtl">${f.subj}</div>
      <div class="fb-form" dir="ltr">${f.form}</div>
      <div class="fb-ex" dir="ltr">${f.ex}</div>
    </div>
  `).join('');

  const formulaHtml = fRows ? `
    <div class="formula-visual-wrap">
      <div class="formula-v-title">📌 التكوين والشكل الجرافيكي للقاعدة:</div>
      ${fRows}
    </div>
  ` : '';

  const exHtml = strat.exception ? `
    <div class="exception-box">
      <div class="ex-title">${strat.exception.title}</div>
      <div class="ex-body">${strat.exception.body}</div>
    </div>
  ` : '';

  const letters = ['A','B','C','D'];
  const practiceHtml = (strat.practice && strat.practice.length > 0) ? `
    <div class="mini-quiz-wrap">
      <div class="mini-quiz-header">
        <span>🎯</span> جرّب بنفسك!
        <span class="mq-badge">تطبيق مباشر</span>
      </div>
      ${strat.practice.map((pq, pi) => {
        const qid = `${strat.id}-p${pi}`;
        return `
          <div class="mini-q" id="mq-wrap-${qid}">
            <div class="mini-q-text">${pq.q}</div>
            <div class="mini-opts">
              ${pq.opts.map((o,oi)=>`
                <button class="mini-opt" data-qid="${qid}" data-idx="${oi}">
                  <span class="opt-letter">${letters[oi]}</span>${o}
                </button>
              `).join('')}
            </div>
            <div class="mini-q-actions">
               <button class="btn btn-primary btn-check-ans hidden" id="check-${qid}" data-qid="${qid}" data-correct="${pq.c}">تحقق من الإجابة</button>
            </div>
            <div class="mini-expl" id="mq-expl-${qid}">
              <div class="expl-text">${pq.expl}</div>
              <button class="btn btn-secondary btn-sm return-rule-btn" onclick="document.getElementById('${strat.id}').scrollIntoView({behavior:'smooth'})">↩️ العودة لشرح القاعدة</button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  ` : '';

  return `
    <div class="strategy-card ${strat.theme} animate-in" id="${strat.id}" style="animation-delay:${si*0.07}s">
      <div class="sc-header">
        <span class="sc-header-icon">${strat.icon}</span>
        <div class="sc-header-texts">
          <div class="sc-title">${strat.title}</div>
          <div class="sc-subtitle">${strat.subtitle}</div>
        </div>
        <span class="sc-badge">${strat.badge}</span>
      </div>
      <div class="sc-body">
        <div class="sc-keywords">
          <div class="kw-grid">
            <div class="sc-keywords-title">🔑 الكلمات الدالة <small style="font-weight:400;color:rgba(255,255,255,0.4);font-size:0.65rem">(انقر للترجمة)</small></div>
            ${kwHtml}
          </div>
        </div>
        <div class="sc-content">
          ${mediaHtml}
          <div class="usage-banner">${strat.usage}</div>
          ${formulaHtml}
          ${exHtml}
          ${practiceHtml}
        </div>
      </div>
    </div>
  `;
}

// ── BIND INTERACTIVE ELEMENTS ─────────────────────────────────
function bindInteractiveElements() {
  // Mini quiz option selection
  pageContent.querySelectorAll('.mini-opt').forEach(btn => {
    btn.addEventListener('click', function() {
      const qid = this.dataset.qid;
      const wrap = $(`mq-wrap-${qid}`);
      if (wrap.dataset.answered) return;

      wrap.querySelectorAll('.mini-opt').forEach(b => b.classList.remove('selected'));
      this.classList.add('selected');
      wrap.dataset.selectedIdx = this.dataset.idx;

      // Show Check Answer button
      $(`check-${qid}`).classList.remove('hidden');
    });
  });

  // Check Answer logic
  pageContent.querySelectorAll('.btn-check-ans').forEach(btn => {
    btn.addEventListener('click', function() {
      const qid = this.dataset.qid;
      const wrap = $(`mq-wrap-${qid}`);
      const correct = parseInt(this.dataset.correct);
      const selected = parseInt(wrap.dataset.selectedIdx);

      wrap.dataset.answered = '1';
      this.classList.add('hidden'); // Hide the check button

      wrap.querySelectorAll('.mini-opt').forEach((b, i) => {
        b.disabled = true;
        b.classList.remove('selected');
        if (i === correct) b.classList.add('opt-correct');
        else if (i === selected) b.classList.add('opt-wrong');
      });

      $(`mq-expl-${qid}`).classList.add('show');
    });
  });

  const bigBtn = $('open-big-quiz');
  if (bigBtn) bigBtn.addEventListener('click', openBigQuiz);
}

// ── HIGHLIGHT & ERASE ─────────────────────────────────────────
function bindTools() {
  const hlBtn   = $('btn-highlight');
  const erBtn   = $('btn-eraser');
  const clrBtn  = $('btn-clear-hl');
  const modebar = $('mode-bar');
  const modeText= $('mode-bar-text');

  $('btn-zoom-in').addEventListener('click', () => {
    GS.ui.fontSize = Math.min(22, GS.ui.fontSize + 1);
    pageContent.style.fontSize = GS.ui.fontSize + 'px';
  });
  $('btn-zoom-out').addEventListener('click', () => {
    GS.ui.fontSize = Math.max(12, GS.ui.fontSize - 1);
    pageContent.style.fontSize = GS.ui.fontSize + 'px';
  });

  hlBtn.addEventListener('click', () => {
    GS.ui.highlightMode = !GS.ui.highlightMode;
    GS.ui.eraserMode = false;
    updateToolState();
    if (GS.ui.highlightMode) showToast('🖍️', 'حدد أي نص لتظليله');
  });

  erBtn.addEventListener('click', () => {
    GS.ui.eraserMode = !GS.ui.eraserMode;
    GS.ui.highlightMode = false;
    updateToolState();
    if (GS.ui.eraserMode) showToast('🧽', 'انقر على أي نص مُظلَّل لإزالته');
  });

  clrBtn.addEventListener('click', () => {
    if (!confirm('مسح جميع التظليلات في هذا الدرس؟')) return;
    const uid = GS.UNITS[GS.currentUnit].id;
    delete GS.student.highlights[uid];
    localStorage.setItem('gs_highlights', JSON.stringify(GS.student.highlights));
    loadUnit(GS.currentUnit);
    showToast('🗑️', 'تم مسح التظليلات', 't-success');
  });

  $('mode-bar-close').addEventListener('click', () => {
    GS.ui.highlightMode = false;
    GS.ui.eraserMode = false;
    updateToolState();
  });

  pageContent.addEventListener('mouseup', () => {
    if (!GS.ui.highlightMode) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;
    pageContent.contentEditable = 'true';
    document.execCommand('hiliteColor', false, 'rgba(245,166,35,0.35)');
    pageContent.contentEditable = 'false';
    sel.removeAllRanges();
    saveHighlights();
    erBtn.classList.remove('hidden');
    clrBtn.classList.remove('hidden');
  });

  pageContent.addEventListener('click', e => {
    if (!GS.ui.eraserMode) return;
    let t = e.target;
    while (t && t !== pageContent) {
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

function updateToolState() {
  const hlBtn   = $('btn-highlight');
  const erBtn   = $('btn-eraser');
  const modebar = $('mode-bar');
  const modeText= $('mode-bar-text');

  hlBtn.classList.toggle('active', GS.ui.highlightMode);
  erBtn.classList.toggle('active-eraser', GS.ui.eraserMode);

  if (GS.ui.highlightMode) {
    modebar.classList.remove('hidden','eraser');
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

function saveHighlights() {
  const uid = GS.UNITS[GS.currentUnit].id;
  GS.student.highlights[uid] = pageContent.innerHTML;
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

// ── BIG QUIZ (Comprehensive) ───────────────────────────────────
function openBigQuiz() {
  const unit = GS.UNITS[GS.currentUnit];
  const quizzes = unit.page.quizzes || [];
  if (quizzes.length === 0) return;

  GS.quizState = { answers: {}, submitted: false, currentStep: 0 };
  $('quiz-unit-badge').textContent = unit.page.tag;
  $('quiz-counter').textContent = 'سؤال 1 من ' + quizzes.length;

  renderQuizStep();
  
  $('quiz-footer').style.display = 'none'; // Custom footer inside step
  $('close-quiz').onclick = () => $('quiz-overlay').classList.add('hidden');
  $('quiz-overlay').classList.remove('hidden');
}

function renderQuizStep() {
  const unit = GS.UNITS[GS.currentUnit];
  const quizzes = unit.page.quizzes || [];
  const i = GS.quizState.currentStep;
  const q = quizzes[i];
  const letters = ['A','B','C','D'];
  const isLast = i === quizzes.length - 1;

  const pct = Math.round((i / quizzes.length) * 100);

  let html = `
    <div class="quiz-step-container">
      <div class="quiz-step-progress" style="margin-bottom:1.5rem;">
        <div class="q-prog-bar" style="height:8px; background:var(--border); border-radius:10px; overflow:hidden; margin-bottom:0.5rem;">
          <div class="q-prog-fill" style="height:100%; width:${pct}%; background:var(--gold); transition:width 0.4s;"></div>
        </div>
        <div class="q-prog-text" style="font-size:0.85rem; color:var(--text-muted); font-weight:700;">سؤال ${i+1} من ${quizzes.length}</div>
      </div>
      
      <div class="quiz-q-card animate-in" style="margin-bottom:2rem; animation:fadeUp 0.3s;">
        <div class="quiz-q-text">${q.q}</div>
        <div class="quiz-opts-grid">
          ${q.opts.map((o, oi) => {
            const isSelected = GS.quizState.answers[i] === oi;
            return `
              <button class="q-opt ${isSelected ? 'selected' : ''}" data-oi="${oi}">
                <span class="q-opt-letter">${letters[oi]}</span>${o}
              </button>
            `;
          }).join('')}
        </div>
      </div>

      <div class="quiz-step-actions" style="display:flex; justify-content:space-between; gap:1rem;">
        <button class="btn" style="padding:0.75rem 1.5rem; background:var(--surface2); border:1px solid var(--border); border-radius:var(--r-pill); font-weight:800; color:var(--text-sec);" onclick="prevQuizStep()" ${i === 0 ? 'disabled' : ''}>السابق</button>
        <button class="btn" style="padding:0.75rem 2rem; background:linear-gradient(135deg,var(--gold),#e09212); border-radius:var(--r-pill); font-weight:800; color:var(--navy); opacity:${GS.quizState.answers[i] === undefined ? '0.5':'1'}; pointer-events:${GS.quizState.answers[i] === undefined ? 'none':'auto'}; transition:all 0.3s;" onclick="${isLast ? 'submitBigQuiz()' : 'nextQuizStep()'}" id="btn-next-step">
          ${isLast ? 'إنهاء الاختبار ✓' : 'التالي ➔'}
        </button>
      </div>
    </div>
  `;

  $('quiz-body').innerHTML = html;

  document.querySelectorAll('.q-opt').forEach(btn => {
    btn.addEventListener('click', function() {
      const oi = parseInt(this.dataset.oi);
      GS.quizState.answers[i] = oi;
      document.querySelectorAll('.q-opt').forEach(b => b.classList.remove('selected'));
      this.classList.add('selected');
      const nxt = document.getElementById('btn-next-step');
      nxt.style.opacity = '1';
      nxt.style.pointerEvents = 'auto';
    });
  });
}

window.nextQuizStep = function() {
  GS.quizState.currentStep++;
  renderQuizStep();
}
window.prevQuizStep = function() {
  GS.quizState.currentStep--;
  renderQuizStep();
}

function submitBigQuiz() {
  const unit = GS.UNITS[GS.currentUnit];
  const quizzes = unit.page.quizzes || [];
  GS.quizState.submitted = true;

  let correct = 0;
  let html = '';
  const letters = ['A','B','C','D'];

  quizzes.forEach((q, qi) => {
    const ans = GS.quizState.answers[qi];
    const isRight = ans === q.correct;
    if (isRight) correct++;

    html += `
      <div class="quiz-q-card" style="margin-bottom:1.5rem;">
        <div class="quiz-q-meta">
          <span class="quiz-q-num">السؤال ${qi+1} من ${quizzes.length}</span>
          <span class="quiz-q-result" style="color:var(--${isRight?'green':'red'})">${isRight ? '✅ صحيحة' : '❌ خاطئة'}</span>
        </div>
        <div class="quiz-q-text">${q.q}</div>
        <div class="quiz-opts-grid">
          ${q.opts.map((o,oi)=> {
            let cls = '';
            if (oi === q.correct) cls = 'correct';
            else if (oi === ans) cls = 'wrong';
            return `
              <button class="q-opt ${cls}" disabled>
                <span class="q-opt-letter">${letters[oi]}</span>${o}
              </button>
            `;
          }).join('')}
        </div>
        <div class="quiz-expl show">
          <div class="expl-text">${q.expl}</div>
        </div>
      </div>
    `;
  });

  const pct = quizzes.length > 0 ? Math.round((correct/quizzes.length)*100) : 100;

  if (pct >= 60 && !GS.student.completedUnits.includes(unit.id)) {
    GS.student.completedUnits.push(unit.id);
    localStorage.setItem('gs_completed', JSON.stringify(GS.student.completedUnits));
    buildUnitsNav();
  }

  const msg = pct>=80 ? 'ممتاز! أنت تتقن هذا الدرس 🏆' : pct>=60 ? 'جيد جداً! 👍' : 'راجع الدرس وحاول مجدداً 🔄';
  const scoreHtml = `
    <div class="score-screen" style="margin-bottom:2.5rem;">
      <div class="score-donut-wrap">
        <div class="score-donut" style="--pct:${pct}%">
          <div class="score-num">${pct}%</div>
        </div>
      </div>
      <div class="score-msg">${msg}</div>
      <div class="score-sub">${correct} إجابات صحيحة من ${quizzes.length}</div>
      <div class="score-hint" style="color:var(--text-muted); margin-top:1rem; font-size:0.85rem;">انتقل للأسفل لمراجعة الشرح التفصيلي لكل سؤال ↓</div>
    </div>
  `;

  $('quiz-body').innerHTML = scoreHtml + html;
  $('quiz-body').scrollTop = 0;

  if (pct >= 80) launchConfetti();
  updateProgress();
}

// ── TOAST & CONFETTI ──────────────────────────────────────────
let _toastTimer;
function showToast(icon='', msg='', cls='') {
  const el = $('toast');
  el.className = 'toast ' + cls;
  $('toast-icon').textContent = icon;
  $('toast-msg').textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(()=> el.classList.add('hidden'), 3200);
}

function launchConfetti() {
  const canvas = $('confetti-canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = innerWidth; canvas.height = innerHeight;
  const colors = ['#F5A623','#FFD07A','#06D6A0','#00B4D8','#7C3AED','#EF233C','#fff'];
  const ps = Array.from({length:120},()=>({
    x:Math.random()*canvas.width, y:-20,
    r:Math.random()*7+3, d:Math.random()*80+40,
    c:colors[Math.floor(Math.random()*colors.length)],
    t:Math.random()*10-10, ta:0, ts:Math.random()*0.12+0.05
  }));
  let frame=0;
  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    frame++;
    let alive=false;
    ps.forEach(p=>{
      ctx.beginPath();ctx.lineWidth=p.r/2;ctx.strokeStyle=p.c;
      ctx.moveTo(p.x+p.t+p.r/4,p.y);
      ctx.lineTo(p.x+p.t,p.y+p.t+p.r/4);
      ctx.stroke();
      p.ta+=p.ts; p.y+=(Math.cos(frame/p.d)+3+p.r/2)*0.9; p.t=Math.sin(p.ta)*12;
      if(p.y<canvas.height+20) alive=true;
    });
    if(alive) requestAnimationFrame(draw);
    else ctx.clearRect(0,0,canvas.width,canvas.height);
  }
  draw();
}

// START
boot();


// ── NEW FEATURES LOGIC (Dark Mode, Chatbot, FAB) ───────────────────────────

function initNewFeatures() {
  // 1. Dark Mode
  const darkToggle = $('dark-toggle');
  const savedTheme = localStorage.getItem('gs_theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    darkToggle.textContent = '☀️';
  }
  
  darkToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    if (document.body.classList.contains('dark-mode')) {
      localStorage.setItem('gs_theme', 'dark');
      darkToggle.textContent = '☀️';
    } else {
      localStorage.setItem('gs_theme', 'light');
      darkToggle.textContent = '🌙';
    }
  });

  // 2. Scroll to Top
  const fabScroll = $('fab-scroll');
  $('page-content').addEventListener('scroll', (e) => {
    if (e.target.scrollTop > 300) {
      fabScroll.classList.add('visible');
    } else {
      fabScroll.classList.remove('visible');
    }
  });
  fabScroll.addEventListener('click', () => {
    $('page-content').scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Chatbot logic removed
}

// Call initNewFeatures when boot finishes
// We will hook this into initApp by replacing initApp function definition, or just overriding it.
const originalInitApp = initApp;
initApp = function() {
  originalInitApp();
  initNewFeatures();
};

const originalUpdateProgress = updateProgress;
updateProgress = function() {
  originalUpdateProgress();
  const total = GS.UNITS.length;
  if (total === 0) return;
  const done = GS.student.completedUnits.length;
  const pct = Math.round((done / total) * 100);
  $('overall-prog-sidebar').style.display = 'block';
  $('sidebar-overall-fill').style.width = pct + '%';
  $('sidebar-overall-lbl').textContent = 'الإنجاز الكلي: ' + pct + '%';
};
