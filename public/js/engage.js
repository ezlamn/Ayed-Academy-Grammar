/* ================================================================
   ENGAGE.JS — Live Interactivity Layer (v2)
   Grammar Strategies — Ayed Academy
   Adds: reactive mascot companion, motion everywhere (scroll-reveal,
   card tilt, unit slide transitions, count-up), step-by-step guided
   lessons, and a mini-games hub (Match + Quick-Fire).
   Hooks into existing globals by wrapping them — no edits needed
   elsewhere.
   ================================================================ */
(function () {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ==============================================================
     1) MASCOT COMPANION
     ============================================================== */
  const Mascot = {
    el: null, face: null, bubble: null, mood: 'idle', idleTimer: null, hideTimer: null,
    LINES: {
      greet: ['يلا بينا نتعلم! 💪', 'جاهز للوحدة دي؟ 🚀', 'أهلاً! خليك مركّز معايا 👀', 'النهارده هنكسر الدنيا! 🔥'],
      correct: ['برافو! 👏', 'إجابة صح! 🎯', 'شاطر! كمّل 💯', 'ماشي يا وحش! 🦾', 'تمام التمام ✅'],
      wrong: ['معلش، جرّب تاني 💛', 'قريب! ركّز شوية 🤏', 'الغلط بيعلّم — كمّل! 🌱', 'متزعلش، تاني 💪'],
      combo: ['كومبو نار! 🔥🔥', 'ما تقفش! ⚡', 'مستحيل تتوقف 🚀', 'أنت في الزون! 🌟'],
      level: ['مستوى جديد! 🎉', 'بتكبر بسرعة! 🏆', 'ليفل أب! 💎'],
      idle: ['تعرف تفتح خريطة الرحلة من 🗺️؟', 'جرّب لعبة المطابقة من 🎮', 'كل إجابة سريعة = نقاط أكتر ⚡', 'راجع كلماتك من 🔁', 'خليك مواظب عشان السلسلة 🔥', 'دوس على كلمة عشان ترجمتها 👆']
    },
    pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
    mount() {
      if (this.el) return;
      const wrap = document.createElement('div');
      wrap.id = 'nb-mascot';
      wrap.className = 'nb-mascot';
      wrap.innerHTML = `
        <div class="nb-mascot-bubble" id="nb-mascot-bubble"></div>
        <button class="nb-mascot-body" id="nb-mascot-body" title="مساعدك" aria-label="المساعد">
          <span class="nb-mascot-face">🦉</span>
        </button>`;
      document.body.appendChild(wrap);
      this.el = wrap;
      this.face = wrap.querySelector('.nb-mascot-face');
      this.bubble = wrap.querySelector('#nb-mascot-bubble');
      wrap.querySelector('#nb-mascot-body').addEventListener('click', () => this.say(this.pick(this.LINES.idle), 'idle'));
      this.scheduleIdle();
    },
    say(text, mood = 'idle', ms = 3600) {
      if (!this.bubble) return;
      this.bubble.textContent = text;
      this.bubble.classList.add('show');
      this.el.classList.remove('happy', 'sad', 'hype');
      if (mood === 'correct' || mood === 'level') this.el.classList.add('happy');
      else if (mood === 'wrong') this.el.classList.add('sad');
      else if (mood === 'combo') this.el.classList.add('hype');
      clearTimeout(this.hideTimer);
      this.hideTimer = setTimeout(() => { this.bubble.classList.remove('show'); this.el.classList.remove('happy', 'sad', 'hype'); }, ms);
      this.scheduleIdle();
    },
    react(kind) {
      const map = { correct: 'correct', wrong: 'wrong', combo: 'combo', level: 'level', greet: 'greet' };
      const k = map[kind] || 'idle';
      this.say(this.pick(this.LINES[k]), k);
    },
    scheduleIdle() {
      clearTimeout(this.idleTimer);
      this.idleTimer = setTimeout(() => { this.say(this.pick(this.LINES.idle), 'idle'); }, 35000);
    }
  };
  window.Mascot = Mascot;

  /* ==============================================================
     2) MOTION EVERYWHERE
     ============================================================== */
  // Scroll-reveal: stagger direct children of page-content into view
  let revealObs = null;
  function setupReveal() {
    const pc = document.getElementById('page-content');
    if (!pc) return;
    if (prefersReduced) return;
    if (revealObs) revealObs.disconnect();
    revealObs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('nb-revealed'); revealObs.unobserve(e.target); } });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    const targets = pc.querySelectorAll('.strategy-card, .rd-strategy-section, .ls-strategy-section, .nb-video-library, .nb-video-card, .unit-end-cta, .mini-quiz-wrap, .ls-info-box, .ls-vocab-section');
    targets.forEach((t, i) => {
      t.classList.add('nb-reveal');
      t.style.setProperty('--rev-delay', (Math.min(i, 8) * 60) + 'ms');
      revealObs.observe(t);
    });
    // Safety: never leave anything hidden if the observer misfires
    setTimeout(() => { targets.forEach(t => t.classList.add('nb-revealed')); }, 1600);
  }

  // Subtle pointer tilt for cards
  function setupTilt() {
    if (prefersReduced || window.matchMedia('(hover: none)').matches) return;
    const pc = document.getElementById('page-content');
    if (!pc) return;
    pc.querySelectorAll('.strategy-card').forEach(card => {
      if (card.dataset.tilt) return;
      card.dataset.tilt = '1';
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const dx = (e.clientX - r.left) / r.width - 0.5;
        const dy = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(900px) rotateY(${dx * 3}deg) rotateX(${-dy * 3}deg) translateZ(0)`;
      });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });
  }

  // Count-up numbers in progress pills/labels
  function countUp(el, to, suffix = '') {
    const from = 0, dur = 700, t0 = performance.now();
    function step(t) {
      const p = Math.min(1, (t - t0) / dur);
      el.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3))) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  window.nbCountUp = countUp;

  // Unit slide transition — wrap loadUnit
  function wrapLoadUnit() {
    if (typeof window.loadUnit !== 'function' || window.loadUnit.__wrapped) return;
    const orig = window.loadUnit;
    const wrapped = function (idx) {
      const pc = document.getElementById('page-content');
      const prev = (typeof GS !== 'undefined') ? GS.currentUnit : 0;
      const dir = idx >= prev ? 1 : -1;
      orig.apply(this, arguments);
      if (pc && !prefersReduced) {
        pc.classList.remove('nb-slide-in-l', 'nb-slide-in-r');
        void pc.offsetWidth;
        pc.classList.add(dir > 0 ? 'nb-slide-in-r' : 'nb-slide-in-l');
      }
      afterRender();
      // Mascot greets on unit change
      if (window.Mascot && window.Mascot.el) setTimeout(() => Mascot.react('greet'), 400);
    };
    wrapped.__wrapped = true;
    window.loadUnit = wrapped;
  }

  // Runs after every page render
  function afterRender() {
    setTimeout(() => { setupReveal(); setupTilt(); addStepperButtons(); }, 30);
  }

  // Wrap bindInteractiveElements (called after each render) to trigger afterRender
  function wrapBind() {
    if (typeof window.bindInteractiveElements !== 'function' || window.bindInteractiveElements.__wrapped) return;
    const orig = window.bindInteractiveElements;
    const wrapped = function () { const r = orig.apply(this, arguments); afterRender(); return r; };
    wrapped.__wrapped = true;
    window.bindInteractiveElements = wrapped;
  }

  // Wrap registerAnswer so the mascot reacts
  function wrapRegisterAnswer() {
    if (typeof window.registerAnswer !== 'function' || window.registerAnswer.__wrapped) return;
    const orig = window.registerAnswer;
    const wrapped = function (correct, event) {
      orig.apply(this, arguments);
      if (window.Mascot && window.Mascot.el) {
        const combo = (typeof GS !== 'undefined' && GS.student) ? GS.student.combo : 0;
        if (correct && combo >= 3) Mascot.react('combo');
        else Mascot.react(correct ? 'correct' : 'wrong');
      }
    };
    wrapped.__wrapped = true;
    window.registerAnswer = wrapped;
  }

  /* ==============================================================
     3) STEP-BY-STEP GUIDED LESSON (per strategy card)
     ============================================================== */
  function addStepperButtons() {
    document.querySelectorAll('.strategy-card .sc-content').forEach(content => {
      const card = content.closest('.strategy-card');
      if (card.querySelector('.nb-step-toggle')) return;
      // Steppable sections = direct children of sc-content
      const steps = Array.from(content.children).filter(c => !c.classList.contains('nb-step-toggle'));
      if (steps.length < 2) return;
      const btn = document.createElement('button');
      btn.className = 'btn nb-step-toggle';
      btn.innerHTML = '▶ اشرح بالخطوات';
      content.prepend(btn);
      btn.addEventListener('click', () => startStepper(content, steps, btn));
    });
  }

  function startStepper(content, steps, btn) {
    if (content.dataset.stepping) { return; }
    content.dataset.stepping = '1';
    btn.classList.add('hidden');
    let i = 0;
    steps.forEach(s => { s.classList.add('nb-step'); s.classList.remove('nb-step-active'); });

    const nav = document.createElement('div');
    nav.className = 'nb-step-nav';
    nav.innerHTML = `
      <button class="btn btn-secondary nb-step-prev">◀ السابق</button>
      <span class="nb-step-count"></span>
      <button class="btn btn-primary nb-step-next">التالي ▶</button>`;
    content.appendChild(nav);
    const countEl = nav.querySelector('.nb-step-count');
    const prevBtn = nav.querySelector('.nb-step-prev');
    const nextBtn = nav.querySelector('.nb-step-next');

    function show(n) {
      steps.forEach((s, k) => s.classList.toggle('nb-step-active', k === n));
      countEl.textContent = `${n + 1} / ${steps.length}`;
      prevBtn.disabled = n === 0;
      nextBtn.textContent = n === steps.length - 1 ? 'إنهاء ✓' : 'التالي ▶';
      steps[n].scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (window.NBSound) NBSound.tick();
    }
    function finish() {
      content.removeChild(nav);
      steps.forEach(s => s.classList.remove('nb-step', 'nb-step-active'));
      delete content.dataset.stepping;
      btn.classList.remove('hidden');
      btn.innerHTML = '🔁 اعرض الخطوات تاني';
    }
    nextBtn.addEventListener('click', () => { if (i >= steps.length - 1) finish(); else { i++; show(i); } });
    prevBtn.addEventListener('click', () => { if (i > 0) { i--; show(i); } });
    show(0);
  }

  /* ==============================================================
     4) MINI-GAMES HUB
     ============================================================== */
  // Gather en/ar word pairs from current track (vocab + strategy keywords)
  function gatherPairs() {
    const pairs = [];
    const seen = new Set();
    const units = (typeof GS !== 'undefined' && GS.UNITS) ? GS.UNITS : [];
    units.forEach(u => {
      const p = u.page || {};
      (p.vocabCategories || []).forEach(cat => (cat.words || []).forEach(w => {
        if (w.en && w.ar && !seen.has(w.en)) { seen.add(w.en); pairs.push({ en: w.en, ar: w.ar }); }
      }));
      (p.strategies || []).forEach(s => (s.keywords || []).forEach(kw => {
        const en = kw.f, ar = (kw.b || '').split('—')[0].trim();
        if (en && ar && !seen.has(en)) { seen.add(en); pairs.push({ en, ar }); }
      }));
    });
    return pairs;
  }

  // Gather MCQ questions (practice + quizzes) from current track
  function gatherMCQs() {
    const qs = [];
    const units = (typeof GS !== 'undefined' && GS.UNITS) ? GS.UNITS : [];
    units.forEach(u => {
      const p = u.page || {};
      (p.strategies || []).forEach(s => (s.practice || []).forEach(pq => {
        if (Array.isArray(pq.opts) && typeof pq.c === 'number') qs.push({ q: pq.q, opts: pq.opts, c: pq.c, expl: pq.expl });
      }));
      (p.quizzes || []).forEach(q => {
        if (Array.isArray(q.opts) && typeof q.correct === 'number') qs.push({ q: q.q, opts: q.opts, c: q.correct, expl: q.expl });
      });
    });
    return qs;
  }

  function openGamesHub() {
    if (typeof nbOpenModal !== 'function') return;
    nbOpenModal('🎮 مركز الألعاب', `
      <div class="nb-games-grid">
        <button class="nb-game-card" id="nb-game-match">
          <div class="nb-game-ic">🃏</div>
          <div class="nb-game-name">لعبة المطابقة</div>
          <div class="nb-game-desc">وصّل الكلمة بترجمتها بأسرع وقت</div>
        </button>
        <button class="nb-game-card" id="nb-game-quick">
          <div class="nb-game-ic">⚡</div>
          <div class="nb-game-name">سباق سريع</div>
          <div class="nb-game-desc">جاوب أكبر عدد أسئلة قبل ما الوقت يخلص</div>
        </button>
      </div>`);
    const m = document.getElementById('nb-game-match');
    const q = document.getElementById('nb-game-quick');
    if (m) m.onclick = startMatchGame;
    if (q) q.onclick = startQuickFire;
  }
  window.openGamesHub = openGamesHub;

  // ── MATCH GAME ──
  function startMatchGame() {
    const all = gatherPairs();
    if (all.length < 4) { if (typeof showToast === 'function') showToast('🃏', 'محتاج كلمات أكتر في القسم ده للّعبة'); return; }
    const pick = nbShuffleArr(all).slice(0, Math.min(6, all.length));
    let cards = [];
    pick.forEach((p, i) => {
      cards.push({ id: i, txt: p.en, dir: 'ltr' });
      cards.push({ id: i, txt: p.ar, dir: 'rtl' });
    });
    cards = nbShuffleArr(cards);
    let selected = null, matched = 0, moves = 0, t0 = Date.now();

    nbOpenModal('🃏 لعبة المطابقة', `
      <div class="nb-match-hud"><span id="nb-match-prog">0 / ${pick.length}</span><span id="nb-match-moves">محاولات: 0</span></div>
      <div class="nb-match-grid" id="nb-match-grid">
        ${cards.map((c, idx) => `<button class="nb-match-cell" data-idx="${idx}" data-id="${c.id}" dir="${c.dir}">${c.txt}</button>`).join('')}
      </div>`);

    const grid = document.getElementById('nb-match-grid');
    grid.querySelectorAll('.nb-match-cell').forEach(cell => {
      cell.addEventListener('click', function () {
        if (this.classList.contains('done') || this === selected) return;
        this.classList.add('sel');
        if (window.NBSound) NBSound.tick();
        if (!selected) { selected = this; return; }
        moves++;
        document.getElementById('nb-match-moves').textContent = 'محاولات: ' + moves;
        if (selected.dataset.id === this.dataset.id) {
          const a = selected, b = this;
          setTimeout(() => { a.classList.add('done'); b.classList.add('done'); a.classList.remove('sel'); b.classList.remove('sel'); }, 180);
          matched++;
          document.getElementById('nb-match-prog').textContent = `${matched} / ${pick.length}`;
          if (window.NBSound) NBSound.correct();
          if (typeof addXP === 'function') addXP(5, null);
          if (matched === pick.length) {
            const secs = Math.round((Date.now() - t0) / 1000);
            if (window.NBSound) NBSound.cheer();
            if (typeof launchConfetti === 'function') launchConfetti();
            if (typeof addXP === 'function') addXP(20, null);
            setTimeout(() => nbOpenModal('🎉 خلّصت!', `<div class="nb-game-result">طابقت ${pick.length} كلمات في <b>${secs}ث</b> و<b>${moves}</b> محاولة!<br>+ ${pick.length * 5 + 20} XP 🪙</div>
              <button class="btn btn-primary" style="width:100%;margin-top:1rem" onclick="openGamesHub()">العب تاني 🎮</button>`), 600);
          }
          selected = null;
        } else {
          const a = selected, b = this;
          a.classList.add('miss'); b.classList.add('miss');
          if (window.NBSound) NBSound.wrong();
          setTimeout(() => { a.classList.remove('sel', 'miss'); b.classList.remove('sel', 'miss'); }, 600);
          selected = null;
        }
      });
    });
  }

  // ── QUICK-FIRE ──
  function startQuickFire() {
    const pool = nbShuffleArr(gatherMCQs());
    if (pool.length < 3) { if (typeof showToast === 'function') showToast('⚡', 'محتاج أسئلة أكتر في القسم ده'); return; }
    let idx = 0, score = 0, correct = 0, timeLeft = 45, timer = null;

    nbOpenModal('⚡ سباق سريع', `
      <div class="nb-qf-hud">
        <div class="nb-qf-time"><span id="nb-qf-timeval">45</span>ث</div>
        <div class="nb-qf-score">النقاط: <b id="nb-qf-score">0</b></div>
      </div>
      <div class="nb-qf-bar"><span id="nb-qf-barfill"></span></div>
      <div id="nb-qf-stage"></div>`);

    const stage = document.getElementById('nb-qf-stage');
    const timeEl = document.getElementById('nb-qf-timeval');
    const barFill = document.getElementById('nb-qf-barfill');
    const scoreEl = document.getElementById('nb-qf-score');

    function tick() {
      timeLeft--;
      timeEl.textContent = timeLeft;
      barFill.style.width = (timeLeft / 45 * 100) + '%';
      if (timeLeft <= 5 && window.NBSound) NBSound.tick();
      if (timeLeft <= 0) end();
    }
    timer = setInterval(tick, 1000);
    barFill.style.width = '100%';

    function render() {
      if (idx >= pool.length) { end(); return; }
      const item = pool[idx];
      stage.innerHTML = `
        <div class="nb-qf-q" dir="ltr">${item.q}</div>
        <div class="nb-qf-opts">
          ${item.opts.map((o, i) => `<button class="nb-qf-opt" data-i="${i}" dir="ltr">${o}</button>`).join('')}
        </div>`;
      stage.querySelectorAll('.nb-qf-opt').forEach(btn => {
        btn.addEventListener('click', function () {
          const chosen = parseInt(this.dataset.i, 10);
          const ok = chosen === item.c;
          stage.querySelectorAll('.nb-qf-opt').forEach((b, i) => {
            b.disabled = true;
            if (i === item.c) b.classList.add('ok');
            else if (i === chosen) b.classList.add('no');
          });
          if (ok) { score += 10; correct++; scoreEl.textContent = score; if (window.NBSound) NBSound.correct(); if (typeof addXP === 'function') addXP(3, null); }
          else { timeLeft = Math.max(0, timeLeft - 3); if (window.NBSound) NBSound.wrong(); }
          idx++;
          setTimeout(render, 520);
        });
      });
    }
    function end() {
      if (timer) clearInterval(timer);
      if (window.SmartAnalytics) for (let i = 0; i < correct; i++) {/* analytics optional */}
      if (typeof launchConfetti === 'function' && correct > 0) launchConfetti();
      if (window.NBSound) NBSound.cheer();
      nbOpenModal('⚡ انتهى السباق!', `<div class="nb-game-result">جاوبت <b>${correct}</b> صح!<br>نقاطك: <b>${score}</b> 🏁<br>+ ${correct * 3} XP 🪙</div>
        <button class="btn btn-primary" style="width:100%;margin-top:1rem" onclick="openGamesHub()">العب تاني 🎮</button>`);
    }
    render();
  }

  function nbShuffleArr(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  /* ==============================================================
     5) TOPBAR GAMES BUTTON + BOOTSTRAP
     ============================================================== */
  function injectGamesButton() {
    const actions = document.getElementById('nb-actions');
    if (!actions || document.getElementById('nb-games-btn')) return;
    const btn = document.createElement('button');
    btn.className = 'icon-btn nb-act';
    btn.id = 'nb-games-btn';
    btn.title = 'الألعاب';
    btn.textContent = '🎮';
    btn.onclick = openGamesHub;
    actions.appendChild(btn);
  }

  function boot() {
    wrapBind();
    wrapLoadUnit();
    wrapRegisterAnswer();
    const app = document.getElementById('app');
    if (app) {
      const obs = new MutationObserver(() => {
        if (!app.classList.contains('hidden')) {
          Mascot.mount();
          injectGamesButton();
          setTimeout(() => { Mascot.react('greet'); afterRender(); }, 700);
        }
      });
      obs.observe(app, { attributes: true, attributeFilter: ['class'] });
      if (!app.classList.contains('hidden')) { Mascot.mount(); injectGamesButton(); afterRender(); }
    }
    // Re-wrap shortly after, in case globals were (re)defined late
    setTimeout(() => { wrapBind(); wrapLoadUnit(); wrapRegisterAnswer(); injectGamesButton(); }, 800);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
