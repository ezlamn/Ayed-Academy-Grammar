/* ================================================================
   INTERACTIVE.JS — Creative Interactivity Layer
   Grammar Strategies — Ayed Academy
   Adds: WebAudio sound engine, speed-bonus timers, achievement
   badges, learning-path map, drag/arrange + fill question types,
   stats dashboard & smart SRS review.
   ================================================================ */

/* ================================================================
   1) SOUND ENGINE (WebAudio — no external files)
   ================================================================ */
const NBSound = {
  ctx: null,
  enabled: localStorage.getItem('gs_sound') !== 'off',
  init() {
    if (this.ctx) return;
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch (e) { this.ctx = null; }
  },
  _tone(freq, dur = 0.15, type = 'sine', vol = 0.18, delay = 0) {
    if (!this.enabled || !this.ctx) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(this.ctx.destination);
    osc.start(t0); osc.stop(t0 + dur + 0.02);
  },
  correct() { this.init(); this._tone(660, 0.12, 'triangle', 0.2); this._tone(880, 0.16, 'triangle', 0.2, 0.1); },
  wrong()   { this.init(); this._tone(200, 0.22, 'sawtooth', 0.16); this._tone(150, 0.26, 'sawtooth', 0.14, 0.08); },
  tick()    { this.init(); this._tone(900, 0.04, 'square', 0.05); },
  combo(level) {
    this.init();
    const base = 520 + Math.min(level, 8) * 60;
    this._tone(base, 0.1, 'square', 0.16);
    this._tone(base * 1.5, 0.12, 'square', 0.16, 0.08);
  },
  badge()   { this.init(); [523, 659, 784, 1046].forEach((f, i) => this._tone(f, 0.16, 'triangle', 0.2, i * 0.09)); },
  cheer()   { this.init(); [392, 523, 659, 784, 1046].forEach((f, i) => this._tone(f, 0.2, 'triangle', 0.22, i * 0.1)); },
  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem('gs_sound', this.enabled ? 'on' : 'off');
    if (this.enabled) { this.init(); this.correct(); }
    const b = document.getElementById('nb-sound-toggle');
    if (b) b.textContent = this.enabled ? '🔊' : '🔇';
    return this.enabled;
  }
};
// Resume audio on first user gesture (browser autoplay policy)
document.addEventListener('pointerdown', () => { NBSound.init(); if (NBSound.ctx && NBSound.ctx.state === 'suspended') NBSound.ctx.resume(); }, { once: true });
window.NBSound = NBSound;

/* ================================================================
   2) SPEED BONUS — reward fast correct answers
   ================================================================ */
function nbMarkQuestionSeen(wrap) {
  if (!wrap || wrap.dataset.seenAt) return;
  wrap.dataset.seenAt = Date.now();
  // visual draining timer bar
  if (!wrap.querySelector('.nb-qtimer')) {
    const bar = document.createElement('div');
    bar.className = 'nb-qtimer';
    bar.innerHTML = '<span class="nb-qtimer-fill"></span>';
    wrap.prepend(bar);
    requestAnimationFrame(() => { const f = bar.querySelector('.nb-qtimer-fill'); if (f) f.style.width = '0%'; });
  }
}
function nbAwardSpeed(wrap, event) {
  const seen = parseInt(wrap.dataset.seenAt || '0', 10);
  if (!seen) return;
  const sec = (Date.now() - seen) / 1000;
  let bonus = sec < 8 ? 5 : sec < 15 ? 3 : sec < 25 ? 1 : 0;
  if (!bonus) return;
  if (typeof addXP === 'function') addXP(bonus, null);
  const chip = document.createElement('div');
  chip.className = 'nb-speed-pop';
  chip.textContent = `⚡ سرعة +${bonus}`;
  const r = wrap.getBoundingClientRect();
  chip.style.left = (r.left + r.width / 2) + 'px';
  chip.style.top = (r.top + 24) + 'px';
  document.body.appendChild(chip);
  setTimeout(() => chip.remove(), 1100);
}
// Observe questions entering view to start their timer
let nbQObserver = null;
function nbObserveQuestions(container) {
  if (!('IntersectionObserver' in window)) return;
  if (nbQObserver) nbQObserver.disconnect();
  nbQObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) nbMarkQuestionSeen(e.target); });
  }, { threshold: 0.5 });
  container.querySelectorAll('.mini-q').forEach(q => nbQObserver.observe(q));
}
window.nbAwardSpeed = nbAwardSpeed;
window.nbObserveQuestions = nbObserveQuestions;

/* ================================================================
   3) ACHIEVEMENT BADGES
   ================================================================ */
const NB_BADGES = [
  { id: 'first_step', icon: '👣', name: 'الخطوة الأولى', desc: 'أجب أول سؤال بشكل صحيح', check: s => s.anyCorrect },
  { id: 'combo3',     icon: '⚡', name: 'كومبو ×3',      desc: 'ثلاث إجابات صحيحة متتالية', check: s => s.bestCombo >= 3 },
  { id: 'combo5',     icon: '🌟', name: 'كومبو ×5',      desc: 'خمس إجابات صحيحة متتالية', check: s => s.bestCombo >= 5 },
  { id: 'combo10',    icon: '🚀', name: 'لا يُقهر',       desc: 'عشر إجابات صحيحة متتالية', check: s => s.bestCombo >= 10 },
  { id: 'streak3',    icon: '🔥', name: 'مواظب',          desc: 'سلسلة 3 أيام متتالية',    check: s => s.bestStreak >= 3 },
  { id: 'streak7',    icon: '📅', name: 'أسبوع كامل',     desc: 'سلسلة 7 أيام متتالية',    check: s => s.bestStreak >= 7 },
  { id: 'unit1',      icon: '✅', name: 'بداية الرحلة',   desc: 'أكمل وحدة واحدة',         check: s => s.unitsDone >= 1 },
  { id: 'unit5',      icon: '🏗️', name: 'بنّاء المعرفة',  desc: 'أكمل 5 وحدات',            check: s => s.unitsDone >= 5 },
  { id: 'level5',     icon: '🎖️', name: 'مستوى 5',        desc: 'وصلت للمستوى 5',          check: s => s.level >= 5 },
  { id: 'xp500',      icon: '💎', name: 'جامع النقاط',    desc: 'اجمع 500 XP',             check: s => s.xp >= 500 },
  { id: 'sharp',      icon: '🎯', name: 'القنّاص',         desc: 'دقة 80%+ في قسم (20 سؤال على الأقل)', check: s => s.bestAccuracy >= 80 && s.maxTotal >= 20 },
  { id: 'vocab20',    icon: '📚', name: 'حافظ الكلمات',   desc: 'راجع 20 كلمة بنظام التكرار', check: s => s.srsCount >= 20 },
];

function nbGatherStats() {
  const a = (window.SmartAnalytics && window.SmartAnalytics.data) || {};
  let bestAccuracy = 0, maxTotal = 0;
  for (const k in a) {
    const t = a[k].total || 0, c = a[k].correct || 0;
    if (t > maxTotal) maxTotal = t;
    if (t >= 5) bestAccuracy = Math.max(bestAccuracy, Math.round((c / t) * 100));
  }
  let anyCorrect = false;
  for (const k in a) if ((a[k].correct || 0) > 0) anyCorrect = true;
  const srs = JSON.parse(localStorage.getItem('gs_srs') || '{}');
  return {
    xp: GS.student.xp, level: GS.student.level,
    bestCombo: parseInt(localStorage.getItem('gs_best_combo') || '0', 10),
    bestStreak: GS.student.bestStreak || 0,
    unitsDone: (GS.student.completedUnits || []).length,
    bestAccuracy, maxTotal, anyCorrect,
    srsCount: Object.keys(srs).length,
  };
}

function checkBadges() {
  const unlocked = JSON.parse(localStorage.getItem('gs_badges') || '[]');
  const stats = nbGatherStats();
  let newly = null;
  NB_BADGES.forEach(b => {
    if (!unlocked.includes(b.id) && b.check(stats)) {
      unlocked.push(b.id);
      newly = b;
    }
  });
  localStorage.setItem('gs_badges', JSON.stringify(unlocked));
  if (newly) {
    if (typeof showToast === 'function') showToast(newly.icon, `وسام جديد: ${newly.name}!`, 't-success');
    if (window.NBSound) NBSound.badge();
    if (typeof launchConfetti === 'function') launchConfetti();
    nbUpdateBadgeCount();
  }
  return unlocked;
}
window.checkBadges = checkBadges;

function nbUpdateBadgeCount() {
  const el = document.getElementById('nb-badge-count');
  if (!el) return;
  const n = JSON.parse(localStorage.getItem('gs_badges') || '[]').length;
  el.textContent = n;
  el.style.display = n > 0 ? 'flex' : 'none';
}

function openBadges() {
  const unlocked = checkBadges();
  const cards = NB_BADGES.map(b => {
    const got = unlocked.includes(b.id);
    return `
      <div class="nb-badge-card ${got ? 'got' : 'locked'}">
        <div class="nb-badge-ic">${got ? b.icon : '🔒'}</div>
        <div class="nb-badge-name">${b.name}</div>
        <div class="nb-badge-desc">${b.desc}</div>
      </div>`;
  }).join('');
  const got = unlocked.length, total = NB_BADGES.length;
  nbOpenModal('🏅 أوسمة الإنجاز', `
    <div class="nb-badges-progress">فتحت <b>${got}</b> من <b>${total}</b> وسام</div>
    <div class="nb-badges-grid">${cards}</div>`);
}
window.openBadges = openBadges;

/* ================================================================
   4) LEARNING PATH MAP
   ================================================================ */
function openPathMap() {
  const units = GS.UNITS || [];
  if (!units.length) { if (typeof showToast === 'function') showToast('🗺️', 'اختر قسماً يحتوي على وحدات أولاً'); return; }
  const done = GS.student.completedUnits || [];
  // highest unlocked = first not-completed index, plus all completed
  let firstIncomplete = units.findIndex(u => !done.includes(u.id));
  if (firstIncomplete === -1) firstIncomplete = units.length - 1;
  const maxUnlocked = firstIncomplete; // this index and below are unlocked

  const nodes = units.map((u, i) => {
    const isDone = done.includes(u.id);
    const isCurrent = i === GS.currentUnit;
    const locked = i > maxUnlocked && !isDone;
    const state = isDone ? 'done' : locked ? 'locked' : (isCurrent ? 'current' : 'open');
    return `
      <div class="nb-path-node ${state}" data-idx="${i}" data-locked="${locked ? 1 : 0}" style="--i:${i}">
        <div class="nb-path-dot">${isDone ? '✓' : locked ? '🔒' : (u.emoji || u.id)}</div>
        <div class="nb-path-label">
          <div class="nb-path-num">المحطة ${i + 1}</div>
          <div class="nb-path-name">${u.nameAr || ''}</div>
        </div>
        ${isCurrent ? '<span class="nb-path-here">أنت هنا</span>' : ''}
      </div>`;
  }).join('<div class="nb-path-link"></div>');

  nbOpenModal('🗺️ خريطة رحلة التعلّم', `<div class="nb-path-wrap">${nodes}</div>`);

  document.querySelectorAll('.nb-path-node').forEach(node => {
    node.addEventListener('click', () => {
      if (node.dataset.locked === '1') {
        if (window.NBSound) NBSound.wrong();
        if (typeof showToast === 'function') showToast('🔒', 'أكمل المحطة السابقة لفتح هذه!');
        node.classList.remove('shake'); void node.offsetWidth; node.classList.add('shake');
        return;
      }
      const idx = parseInt(node.dataset.idx, 10);
      nbCloseModal();
      if (typeof loadUnit === 'function') loadUnit(idx);
    });
  });
}
window.openPathMap = openPathMap;

/* ================================================================
   5) STATS DASHBOARD
   ================================================================ */
function openStats() {
  const a = (window.SmartAnalytics && window.SmartAnalytics.data) || {};
  const names = { grammar: 'الجرامر', reading: 'الريدينج', listening: 'الليسننج' };
  let bars = '';
  let weakest = null, weakPct = 101;
  for (const k in a) {
    const t = a[k].total || 0, c = a[k].correct || 0;
    const pct = t > 0 ? Math.round((c / t) * 100) : 0;
    if (t >= 3 && pct < weakPct) { weakPct = pct; weakest = names[k] || k; }
    const color = pct < 50 ? 'var(--nb-red)' : pct < 80 ? 'var(--nb-orange)' : 'var(--nb-green)';
    bars += `
      <div class="nb-stat-row">
        <div class="nb-stat-head"><span>${names[k] || k}</span><span>${pct}% (${c}/${t})</span></div>
        <div class="nb-stat-bar"><span style="width:${pct}%;background:${color}"></span></div>
      </div>`;
  }
  if (!bars) bars = '<div class="nb-empty">لسه مفيش بيانات كفاية — حل شوية تمارين الأول 💪</div>';

  const srs = JSON.parse(localStorage.getItem('gs_srs') || '{}');
  const due = nbDueWords().length;
  const badges = JSON.parse(localStorage.getItem('gs_badges') || '[]').length;
  const advice = weakest ? `🎯 ركّز على قسم <b>${weakest}</b> — هو أكتر قسم محتاج تحسين.` :
    'استمر! أداؤك متوازن. حل المزيد للحصول على نصائح أدق.';

  nbOpenModal('📊 إحصائياتي', `
    <div class="nb-stat-cards">
      <div class="nb-kpi" style="background:var(--nb-yellow)"><b>${GS.student.xp}</b><span>XP</span></div>
      <div class="nb-kpi" style="background:var(--nb-cyan)"><b>LV ${GS.student.level}</b><span>المستوى</span></div>
      <div class="nb-kpi" style="background:var(--nb-orange)"><b>${GS.student.streak}🔥</b><span>سلسلة الأيام</span></div>
      <div class="nb-kpi" style="background:var(--nb-lime)"><b>${badges}🏅</b><span>أوسمة</span></div>
    </div>
    <h4 class="nb-sub">الدقة حسب القسم</h4>
    ${bars}
    <div class="nb-advice">${advice}</div>
    <div class="nb-review-line">
      <span>🔁 كلمات تحتاج مراجعة اليوم: <b>${due}</b> | إجمالي كلمات محفوظة: <b>${Object.keys(srs).length}</b></span>
      <button class="btn btn-primary btn-sm" onclick="nbCloseModal(); startReview();" ${due ? '' : 'disabled'}>ابدأ المراجعة</button>
    </div>`);
}
window.openStats = openStats;

/* ================================================================
   6) SMART SRS REVIEW SESSION
   ================================================================ */
function nbScanVocab() {
  // Build en -> {en, ar, color} map from all tracks' vocab categories
  const map = {};
  const data = GS.ALL_DATA || {};
  ['grammar', 'reading', 'listening'].forEach(track => {
    (data[track] || []).forEach(u => {
      const cats = (u.page && u.page.vocabCategories) || [];
      cats.forEach(cat => (cat.words || []).forEach(w => {
        if (w && w.en) map[w.en] = { en: w.en, ar: w.ar, color: cat.color || '#FF5DA2' };
      }));
    });
  });
  return map;
}
function nbDueWords() {
  const srs = JSON.parse(localStorage.getItem('gs_srs') || '{}');
  const vocab = nbScanVocab();
  const now = Date.now();
  return Object.keys(srs)
    .filter(en => (srs[en].nextReview || 0) <= now && vocab[en])
    .map(en => vocab[en]);
}

let nbReviewQueue = [], nbReviewIdx = 0;
function startReview() {
  nbReviewQueue = nbDueWords();
  if (!nbReviewQueue.length) { if (typeof showToast === 'function') showToast('✅', 'مفيش كلمات محتاجة مراجعة دلوقتي!'); return; }
  nbReviewIdx = 0;
  nbRenderReviewCard();
}
window.startReview = startReview;

function nbRenderReviewCard() {
  if (nbReviewIdx >= nbReviewQueue.length) {
    nbOpenModal('🎉 خلصت المراجعة', `<div class="nb-review-done">راجعت <b>${nbReviewQueue.length}</b> كلمة! شغل ممتاز 👏</div>
      <button class="btn btn-primary" style="width:100%;margin-top:1rem" onclick="nbCloseModal()">تمام</button>`);
    if (window.NBSound) NBSound.cheer();
    if (typeof launchConfetti === 'function') launchConfetti();
    return;
  }
  const w = nbReviewQueue[nbReviewIdx];
  nbOpenModal(`🔁 مراجعة (${nbReviewIdx + 1}/${nbReviewQueue.length})`, `
    <div class="nb-review-card" id="nb-review-card" onclick="this.classList.toggle('flipped')">
      <div class="nb-rc-front" style="border-color:${w.color}">
        <span class="nb-rc-en" dir="ltr">${w.en}</span>
        <span class="nb-rc-hint">اضغط لرؤية الترجمة 👆</span>
      </div>
      <div class="nb-rc-back" style="background:${w.color}22">
        <span class="nb-rc-ar">${w.ar || ''}</span>
      </div>
    </div>
    <div class="nb-review-actions">
      <button class="btn srs-hard" onclick="nbReviewAnswer('${encodeURIComponent(w.en)}','hard')">صعب 😣</button>
      <button class="btn srs-good" onclick="nbReviewAnswer('${encodeURIComponent(w.en)}','good')">جيد 🙂</button>
      <button class="btn srs-easy" onclick="nbReviewAnswer('${encodeURIComponent(w.en)}','easy')">سهل 😎</button>
    </div>`);
}
function nbReviewAnswer(enc, quality) {
  const en = decodeURIComponent(enc);
  if (typeof processSRS === 'function') processSRS(en, quality);
  nbReviewIdx++;
  nbRenderReviewCard();
}
window.nbReviewAnswer = nbReviewAnswer;

function nbUpdateReviewBadge() {
  const el = document.getElementById('nb-review-count');
  if (!el) return;
  const n = nbDueWords().length;
  el.textContent = n;
  el.style.display = n > 0 ? 'flex' : 'none';
}
window.nbUpdateReviewBadge = nbUpdateReviewBadge;

/* ================================================================
   7) GENERIC BRUTALIST MODAL
   ================================================================ */
function nbOpenModal(title, bodyHtml) {
  let overlay = document.getElementById('nb-modal');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'nb-modal';
    overlay.className = 'nb-modal-overlay';
    overlay.innerHTML = `
      <div class="nb-modal-box">
        <div class="nb-modal-head">
          <h2 id="nb-modal-title"></h2>
          <button class="nb-modal-close" onclick="nbCloseModal()">✕</button>
        </div>
        <div class="nb-modal-body" id="nb-modal-body"></div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) nbCloseModal(); });
  }
  document.getElementById('nb-modal-title').textContent = title;
  document.getElementById('nb-modal-body').innerHTML = bodyHtml;
  overlay.classList.add('open');
}
function nbCloseModal() {
  const overlay = document.getElementById('nb-modal');
  if (overlay) overlay.classList.remove('open');
}
window.nbOpenModal = nbOpenModal;
window.nbCloseModal = nbCloseModal;

/* ================================================================
   8) NEW QUESTION TYPES — Arrange (tap-to-order) & Fill-in
   ================================================================ */
function nbShuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// pq = { type:'order', q, tokens:[correct order...], expl }
function renderOrderQuestion(pq, qid) {
  const correct = pq.tokens || [];
  const shuffled = nbShuffle(correct);
  // ensure it's not already in order
  if (shuffled.join(' ') === correct.join(' ') && correct.length > 1) { shuffled.reverse(); }
  const bank = shuffled.map((tok, i) =>
    `<button class="nb-token" data-tok="${encodeURIComponent(tok)}">${tok}</button>`).join('');
  return `
    <div class="mini-q nb-order-q" id="mq-wrap-${qid}" data-answer="${encodeURIComponent(correct.join(' '))}">
      <div class="mini-q-text" dir="ltr">${pq.q || 'رتّب الكلمات لتكوين جملة صحيحة:'}</div>
      <div class="nb-order-answer" id="ord-ans-${qid}" dir="ltr"><span class="nb-order-placeholder">اضغط الكلمات بالترتيب الصحيح…</span></div>
      <div class="nb-order-bank" id="ord-bank-${qid}" dir="ltr">${bank}</div>
      <div class="mini-q-actions">
        <button class="btn btn-primary btn-check-ans nb-check-order hidden" id="check-${qid}" data-qid="${qid}">تحقق من الإجابة</button>
      </div>
      <div class="mini-expl" id="mq-expl-${qid}"><div class="expl-text">${pq.expl || ''}</div></div>
    </div>`;
}

// pq = { type:'fill', q (use ___ for blank), answer:"go" | ["go","goes"], expl }
function renderFillQuestion(pq, qid) {
  const qHtml = (pq.q || '').replace(/_{2,}|\.{3,}/g, '<span class="nb-fill-blank">______</span>');
  return `
    <div class="mini-q nb-fill-q" id="mq-wrap-${qid}" data-answer="${encodeURIComponent(JSON.stringify(Array.isArray(pq.answer) ? pq.answer : [pq.answer]))}">
      <div class="mini-q-text" dir="ltr">${qHtml}</div>
      <div class="nb-fill-row">
        <input type="text" class="nb-fill-input" id="fill-${qid}" dir="ltr" placeholder="اكتب إجابتك هنا..." autocomplete="off" spellcheck="false">
        <button class="btn btn-primary nb-check-fill" id="check-${qid}" data-qid="${qid}">تحقق</button>
      </div>
      <div class="mini-expl" id="mq-expl-${qid}"><div class="expl-text">${pq.expl || ''}</div></div>
    </div>`;
}
window.renderOrderQuestion = renderOrderQuestion;
window.renderFillQuestion = renderFillQuestion;

function nbNorm(s) { return String(s).trim().toLowerCase().replace(/\s+/g, ' ').replace(/[.!?،؛]+$/, ''); }

function bindNewQuestionTypes(container) {
  // ── ARRANGE (tap to order) ──
  container.querySelectorAll('.nb-order-q').forEach(wrap => {
    const qid = wrap.id.replace('mq-wrap-', '');
    const ans = wrap.querySelector(`#ord-ans-${qid}`);
    const bank = wrap.querySelector(`#ord-bank-${qid}`);
    const check = wrap.querySelector(`#check-${qid}`);
    const updateCheck = () => {
      const placed = ans.querySelectorAll('.nb-token').length;
      check.classList.toggle('hidden', placed === 0);
    };
    bank.addEventListener('click', e => {
      const tok = e.target.closest('.nb-token');
      if (!tok || wrap.dataset.answered) return;
      const ph = ans.querySelector('.nb-order-placeholder'); if (ph) ph.remove();
      tok.classList.add('placed');
      ans.appendChild(tok);
      if (window.NBSound) NBSound.tick();
      updateCheck();
    });
    ans.addEventListener('click', e => {
      const tok = e.target.closest('.nb-token');
      if (!tok || wrap.dataset.answered) return;
      tok.classList.remove('placed');
      bank.appendChild(tok);
      if (!ans.querySelector('.nb-token')) ans.innerHTML = '<span class="nb-order-placeholder">اضغط الكلمات بالترتيب الصحيح…</span>';
      updateCheck();
    });
    check.addEventListener('click', () => {
      if (wrap.dataset.answered) return;
      const got = Array.from(ans.querySelectorAll('.nb-token')).map(t => decodeURIComponent(t.dataset.tok)).join(' ');
      const correct = decodeURIComponent(wrap.dataset.answer);
      const ok = nbNorm(got) === nbNorm(correct);
      wrap.dataset.answered = '1';
      check.classList.add('hidden');
      ans.classList.add(ok ? 'correct' : 'wrong');
      if (!ok) {
        ans.innerHTML = `<span class="nb-order-correct" dir="ltr">✔ ${correct}</span>`;
        wrap.classList.add('shake');
      }
      wrap.querySelector(`#mq-expl-${qid}`).classList.add('show');
      nbFinishInteractive(ok);
    });
  });

  // ── FILL IN ──
  container.querySelectorAll('.nb-fill-q').forEach(wrap => {
    const qid = wrap.id.replace('mq-wrap-', '');
    const input = wrap.querySelector(`#fill-${qid}`);
    const check = wrap.querySelector(`#check-${qid}`);
    const submit = () => {
      if (wrap.dataset.answered || !input.value.trim()) return;
      const answers = JSON.parse(decodeURIComponent(wrap.dataset.answer)).map(nbNorm);
      const ok = answers.includes(nbNorm(input.value));
      wrap.dataset.answered = '1';
      input.disabled = true; check.disabled = true;
      input.classList.add(ok ? 'correct' : 'wrong');
      if (!ok) {
        wrap.classList.add('shake');
        const tip = document.createElement('div');
        tip.className = 'nb-fill-correct';
        tip.innerHTML = `الإجابة الصحيحة: <b dir="ltr">${JSON.parse(decodeURIComponent(wrap.dataset.answer))[0]}</b>`;
        input.parentElement.after(tip);
      }
      wrap.querySelector(`#mq-expl-${qid}`).classList.add('show');
      nbFinishInteractive(ok);
    };
    check.addEventListener('click', submit);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
  });
}
window.bindNewQuestionTypes = bindNewQuestionTypes;

// Shared scoring for the new interactive question types
function nbFinishInteractive(ok) {
  if (ok) {
    if (window.NBSound) NBSound.correct();
    if (typeof registerAnswer === 'function') registerAnswer(true, null);
    if (window.SmartAnalytics) window.SmartAnalytics.record(GS.currentTrack, true);
  } else {
    if (window.NBSound) NBSound.wrong();
    if (typeof registerAnswer === 'function') registerAnswer(false, null);
    if (window.SmartAnalytics) window.SmartAnalytics.record(GS.currentTrack, false);
  }
  if (window.checkBadges) checkBadges();
}

/* ================================================================
   9) TOPBAR ACTION BUTTONS (path / badges / stats / review / sound)
   ================================================================ */
function nbInjectTopbarButtons() {
  const left = document.querySelector('.topbar-left');
  if (!left || document.getElementById('nb-actions')) return;
  const wrap = document.createElement('div');
  wrap.id = 'nb-actions';
  wrap.className = 'nb-actions';
  wrap.innerHTML = `
    <button class="icon-btn nb-act" id="nb-path-btn"   title="خريطة الرحلة">🗺️</button>
    <button class="icon-btn nb-act" id="nb-badges-btn" title="الأوسمة">🏅<span class="nb-act-badge" id="nb-badge-count"></span></button>
    <button class="icon-btn nb-act" id="nb-stats-btn"  title="إحصائياتي">📊</button>
    <button class="icon-btn nb-act" id="nb-review-btn" title="مراجعة الكلمات">🔁<span class="nb-act-badge" id="nb-review-count"></span></button>
    <button class="icon-btn nb-act" id="nb-sound-toggle" title="الصوت">${NBSound.enabled ? '🔊' : '🔇'}</button>`;
  const darkToggle = document.getElementById('dark-toggle');
  if (darkToggle && darkToggle.nextSibling) left.insertBefore(wrap, darkToggle.nextSibling);
  else left.appendChild(wrap);

  document.getElementById('nb-path-btn').onclick = openPathMap;
  document.getElementById('nb-badges-btn').onclick = openBadges;
  document.getElementById('nb-stats-btn').onclick = openStats;
  document.getElementById('nb-review-btn').onclick = startReview;
  document.getElementById('nb-sound-toggle').onclick = () => NBSound.toggle();

  nbUpdateBadgeCount();
  nbUpdateReviewBadge();
}

// Hook into app init: run after a tick so the topbar exists
document.addEventListener('DOMContentLoaded', () => {
  // Inject whenever the app becomes visible (dashboard → learning view)
  const app = document.getElementById('app');
  if (app) {
    const obs = new MutationObserver(() => {
      if (!app.classList.contains('hidden')) nbInjectTopbarButtons();
    });
    obs.observe(app, { attributes: true, attributeFilter: ['class'] });
  }
  // Fallback: inject once the topbar exists in the DOM
  setTimeout(() => { if (document.querySelector('.topbar-left')) nbInjectTopbarButtons(); }, 600);
});
