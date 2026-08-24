/* ================================================================
   MOCK_EXAM.JS — STEP Mock Exam Engine (محاكاة اختبار STEP)
   Grammar Strategies — Ayed Academy

   يحاكي اختبار STEP الحقيقي (قياس):
   - استيعاب المقروء 40% | التراكيب النحوية 30%
   - فهم المسموع 20%     | التحليل الكتابي 10%
   ================================================================ */

window.MockExam = {

  /* ── CONFIG ─────────────────────────────────────────────────── */
  SECTIONS: {
    listening: { label: 'فهم المسموع',      icon: 'headphones', em: '🎧', color: '#38BDF8', tip: 'استمع جيداً — يمكنك تشغيل كل مقطع مرتين فقط كما في الاختبار الحقيقي. اقرأ السؤال والخيارات قبل التشغيل.' },
    reading:   { label: 'استيعاب المقروء',  icon: 'library',    em: '📖', color: '#06D6A0', tip: 'اقرأ السؤال أولاً ثم ابحث عن الإجابة في القطعة. لا تضيع وقتك في قراءة كل كلمة — استخدم استراتيجية المسح السريع (Scanning).' },
    grammar:   { label: 'التراكيب النحوية', icon: 'book-open',  em: '📘', color: '#F5A623', tip: 'ركز على الكلمات المفتاحية في الجملة (الروابط الزمنية، أدوات الشرط، الضمائر). استبعد الخيارات الخاطئة أولاً.' },
    writing:   { label: 'التحليل الكتابي',  icon: 'pen-line',   em: '✍️', color: '#2563EB', tip: 'في أسئلة الترتيب ابحث عن الجملة الافتتاحية العامة أولاً، ثم تتبع تسلسل الأفكار (First, Then, Finally).' }
  },
  ORDER: ['listening', 'reading', 'grammar', 'writing'],

  PRESETS: {
    full:  { label: 'الاختبار الكامل', sub: 'محاكاة كاملة مطابقة لاختبار STEP الرسمي', em: '🏆', badge: 'الأكثر واقعية', time: 150 * 60, counts: { listening: 20, reading: 40, grammar: 30, writing: 10 } },
    half:  { label: 'اختبار نصفي',     sub: 'نصف الطول — مناسب لجلسة تدريب مركزة',    em: '⚡', badge: 'متوازن',        time: 75 * 60,  counts: { listening: 10, reading: 20, grammar: 15, writing: 5 } },
    quick: { label: 'تدريب سريع',      sub: 'جولة قصيرة لقياس مستواك بسرعة',          em: '🎯', badge: 'سريع',          time: 30 * 60,  counts: { listening: 5,  reading: 10, grammar: 6,  writing: 3 } }
  },

  /**
   * النماذج المحفوظة من لوحة التحكم بتتحقن هنا كأنها presets عادية،
   * عشان كل الكود اللي بيقرا PRESETS[preset].label/.time/.em يفضل
   * شغال زي ما هو. الفرق الوحيد إن عندها `examId` و `questions`
   * جاهزة بدل `counts` اللي بيتولّد منها امتحان عشوائي.
   */
  syncSavedExams: function () {
    // نشيل نماذج قديمة من تشغيل سابق قبل ما نضيف الحالية
    Object.keys(this.PRESETS).forEach(k => {
      if (k.startsWith('exam-')) delete this.PRESETS[k];
    });

    const saved = (typeof GS !== 'undefined' && GS.ALL_DATA && GS.ALL_DATA.tests) || [];

    saved.forEach(exam => {
      const questions = (exam.questions || []).filter(q => this.isMCQ(q));
      if (!questions.length) return;

      this.PRESETS['exam-' + exam.id] = {
        label: exam.title,
        sub: `نموذج محفوظ — ${questions.length} سؤال بترتيب ثابت`,
        em: '📄',
        badge: 'نموذج رسمي',
        time: (exam.durationMin || 120) * 60,
        examId: exam.id,
        questions,
      };
    });

    // لو الـ preset المختار بقى مش موجود (اتحذف من اللوحة) نرجّع الافتراضي
    if (!this.PRESETS[this.preset]) this.preset = 'full';
  },

  /* ── STATE ──────────────────────────────────────────────────── */
  active: false,
  view: 'setup',
  preset: 'full',
  questions: [],
  answers: {},
  flags: {},
  current: 0,
  timeLeft: 0,
  timerInterval: null,
  startedAt: 0,
  seenSections: {},
  audioPlays: {},
  _audio: null,
  _keyHandler: null,
  _unloadHandler: null,
  _toastMarks: {},
  _resultFilter: 'all',
  _lastResult: null,

  /* ── HELPERS ────────────────────────────────────────────────── */
  ic: function (name, fallback) {
    if (window.AyIcon && AyIcon.ICONS[name]) return AyIcon.svg(name);
    return fallback || '';
  },
  esc: function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  },
  shuffle: function (arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  },
  fmtTime: function (sec) {
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    return (h > 0 ? h + ':' : '') + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  },
  isMCQ: function (q) {
    return q && Array.isArray(q.opts) && q.opts.length >= 2 && typeof q.c === 'number' && q.c >= 0 && q.c < q.opts.length && q.q;
  },

  /* ── QUESTION POOL ──────────────────────────────────────────── */
  buildPool: function () {
    const D = (typeof GS !== 'undefined' && GS.ALL_DATA) || {};
    const pool = { listening: [], reading: [], grammar: [], writing: [] };

    // Grammar + Writing (from grammar track; "Writing Analysis" unit → writing section)
    (D.grammar || []).forEach(u => {
      const isWriting = /writing/i.test(u.nameEn || '') || /كتاب/i.test(u.nameAr || '');
      const target = isWriting ? pool.writing : pool.grammar;
      const page = u.page || {};
      (page.quizzes || []).forEach(q => { if (this.isMCQ(q)) target.push({ q: q.q, opts: q.opts, c: q.c, expl: q.expl }); });
      (page.strategies || []).forEach(s => (s.practice || []).forEach(q => {
        if (this.isMCQ(q)) target.push({ q: q.q, opts: q.opts, c: q.c, expl: q.expl });
      }));
    });

    // Reading — keep passage questions grouped together
    const groups = new Map();
    (D.reading || []).forEach((u, ui) => {
      (u.page && u.page.strategies || []).forEach(s => (s.practice || []).forEach(q => {
        if (!this.isMCQ(q)) return;
        const key = q.imgUrl
          ? ui + '::' + q.imgUrl
          : ui + '::' + (q.passageText || ('solo-' + Math.random()));
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push({
          q: q.q, opts: q.opts, c: q.c, expl: q.expl,
          passage: (q.passageText && q.passageText.trim().length > 30) ? q.passageText.replace(/\\n/g, '\n') : null,
          imgUrl: q.imgUrl || null
        });
      }));
    });
    pool.readingGroups = Array.from(groups.values());

    // Listening
    (D.listening || []).forEach(u => {
      const page = u.page || {};
      (page.quizzes || []).forEach(q => { if (this.isMCQ(q)) pool.listening.push({ q: q.q, opts: q.opts, c: q.c, expl: q.expl, audioUrl: q.audioUrl || null }); });
      (page.strategies || []).forEach(s => (s.practice || []).forEach(q => {
        if (this.isMCQ(q)) pool.listening.push({ q: q.q, opts: q.opts, c: q.c, expl: q.expl, audioUrl: q.audioUrl || null });
      }));
    });

    return pool;
  },

  buildExam: function (presetKey) {
    const preset = this.PRESETS[presetKey];

    // نموذج محفوظ: أسئلته ثابتة بترتيبها زي ما المعلّم رتّبها
    if (preset.questions) {
      return preset.questions.map(q => ({
        section: q.section,
        q: q.q,
        opts: q.opts,
        c: q.c,
        expl: q.expl,
        audioUrl: q.audioUrl || null,
        imgUrl: q.imgUrl || null,
        passage: q.passage || null,
      }));
    }

    const pool = this.buildPool();
    const exam = [];

    this.ORDER.forEach(sec => {
      const want = preset.counts[sec];
      let picked = [];

      if (sec === 'reading') {
        const groups = this.shuffle(pool.readingGroups.slice());
        for (const g of groups) {
          if (picked.length >= want) break;
          picked = picked.concat(g.slice(0, want - picked.length));
        }
      } else {
        picked = this.shuffle(pool[sec].slice()).slice(0, want);
      }

      picked.forEach(q => exam.push(Object.assign({ section: sec }, q)));
    });

    return exam;
  },

  /* ── LIFECYCLE ──────────────────────────────────────────────── */
  start: function () {
    document.getElementById('app') && document.getElementById('app').classList.add('hidden');
    document.getElementById('main-dashboard') && document.getElementById('main-dashboard').classList.add('hidden');

    let shell = document.getElementById('mock-exam-ui');
    if (shell) shell.remove();
    shell = document.createElement('div');
    shell.id = 'mock-exam-ui';
    shell.className = 'mx-shell';
    shell.setAttribute('dir', 'rtl');
    document.body.appendChild(shell);

    this.active = false;
    this.view = 'setup';
    this.renderSetup();
  },

  beginExam: function () {
    this.questions = this.buildExam(this.preset);
    if (!this.questions.length) { alert('لا توجد أسئلة كافية في قاعدة البيانات بعد.'); return; }

    this.answers = {};
    this.flags = {};
    this.current = 0;
    this.seenSections = {};
    this.audioPlays = {};
    this._toastMarks = {};
    this.timeLeft = this.PRESETS[this.preset].time;
    this.startedAt = Date.now();
    this.active = true;
    this.view = 'exam';

    this.renderExamShell();
    this.startTimer();
    this.attachGuards();
    this.enterQuestion(0, true);
  },

  exit: function (skipConfirm) {
    if (this.active && !skipConfirm) {
      if (!confirm('هل أنت متأكد من الخروج؟ سيتم فقدان تقدمك في الاختبار.')) return;
    }
    this.teardown();
    const shell = document.getElementById('mock-exam-ui');
    if (shell) shell.remove();
    // The exam lives on its own /mock-exam page — leaving it means navigating to the dashboard
    if (location.pathname === '/mock-exam') { location.href = '/dashboard'; return; }
    const dash = document.getElementById('main-dashboard');
    if (dash) dash.classList.remove('hidden');
    if (typeof initDashboard === 'function') initDashboard();
  },

  teardown: function () {
    this.active = false;
    clearInterval(this.timerInterval);
    this.stopAudio();
    if (this._keyHandler) { document.removeEventListener('keydown', this._keyHandler); this._keyHandler = null; }
    if (this._unloadHandler) { window.removeEventListener('beforeunload', this._unloadHandler); this._unloadHandler = null; }
  },

  attachGuards: function () {
    const self = this;
    this._unloadHandler = function (e) { if (self.active) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', this._unloadHandler);

    this._keyHandler = function (e) {
      if (!self.active || self.view !== 'exam') return;
      if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
      const k = e.key.toLowerCase();
      if (['1', '2', '3', '4'].includes(k)) self.selectOption(parseInt(k, 10) - 1);
      else if (['a', 'b', 'c', 'd'].includes(k)) self.selectOption('abcd'.indexOf(k));
      else if (e.key === 'ArrowLeft') self.next();
      else if (e.key === 'ArrowRight') self.prev();
      else if (k === 'f') self.toggleFlag();
    };
    document.addEventListener('keydown', this._keyHandler);
  },

  /* ── TIMER ──────────────────────────────────────────────────── */
  startTimer: function () {
    clearInterval(this.timerInterval);
    const self = this;
    this.timerInterval = setInterval(() => {
      self.timeLeft--;
      if (self.timeLeft <= 0) { self.timeLeft = 0; self.updateTimer(); self.submitExam(true); return; }
      self.updateTimer();
    }, 1000);
    this.updateTimer();
  },

  updateTimer: function () {
    const el = document.getElementById('mx-timer');
    if (!el) return;
    el.innerHTML = this.ic('timer', '⏱') + ' <span>' + this.fmtTime(this.timeLeft) + '</span>';
    el.classList.toggle('mx-warn', this.timeLeft <= 600 && this.timeLeft > 300);
    el.classList.toggle('mx-danger', this.timeLeft <= 300);

    const marks = { 600: 'باقي 10 دقائق على نهاية الاختبار!', 300: 'باقي 5 دقائق — راجع إجاباتك!', 60: 'دقيقة واحدة فقط!' };
    if (marks[this.timeLeft] && !this._toastMarks[this.timeLeft]) {
      this._toastMarks[this.timeLeft] = true;
      if (typeof showToast === 'function') showToast('timer', marks[this.timeLeft]);
    }
  },

  /* ── SETUP SCREEN ───────────────────────────────────────────── */
  renderSetup: function () {
    const shell = document.getElementById('mock-exam-ui');
    this.syncSavedExams();
    const pool = this.buildPool();
    const avail = {
      listening: pool.listening.length,
      reading: pool.readingGroups.reduce((a, g) => a + g.length, 0),
      grammar: pool.grammar.length,
      writing: pool.writing.length
    };
    const self = this;

    const modeCards = Object.keys(this.PRESETS).map(key => {
      const p = this.PRESETS[key];
      const total = p.questions
        ? p.questions.length
        : this.ORDER.reduce((a, s) => a + Math.min(p.counts[s], avail[s]), 0);
      return `
        <div class="mx-mode-card ${key === this.preset ? 'selected' : ''}" data-mode="${key}">
          <div class="mx-mode-badge">${p.badge}</div>
          <div class="mx-mode-icon">${p.em}</div>
          <div class="mx-mode-title">${p.label}</div>
          <div class="mx-mode-sub">${p.sub}</div>
          <div class="mx-mode-stats">
            <span>${this.ic('clipboard', '📋')} ${total} سؤال</span>
            <span>${this.ic('clock', '⏰')} ${Math.round(p.time / 60)} دقيقة</span>
          </div>
        </div>`;
    }).join('');

    const history = this.getHistory().slice(0, 5);
    const histHtml = history.length ? `
      <div class="mx-history">
        <h3>${this.ic('bar-chart', '📊')} محاولاتك السابقة</h3>
        <div class="mx-history-list">
          ${history.map(h => {
            const color = h.pct >= 75 ? '#06D6A0' : h.pct >= 50 ? '#F5A623' : '#EF233C';
            return `
            <div class="mx-history-item">
              <div class="mx-hist-score" style="background:${color}">${h.pct}%</div>
              <div class="mx-hist-meta">
                <div class="mx-hist-title">${(self.PRESETS[h.preset] || { label: 'اختبار' }).label} — ${h.correct} / ${h.total}</div>
                <div class="mx-hist-sub">${h.date} • استغرقت ${self.fmtTime(h.timeUsed)}</div>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>` : '';

    shell.innerHTML = `
      <header class="mx-header">
        <div class="mx-header-brand">
          <div class="mx-logo">${this.ic('target', '🎯')}</div>
          <span class="mx-brand-text">محاكاة اختبار STEP</span>
        </div>
        <div class="mx-header-actions">
          <button class="mx-btn mx-btn-ghost" id="mx-exit-setup">${this.ic('home', '🏠')} العودة للرئيسية</button>
        </div>
      </header>
      <div class="mx-body">
        <main class="mx-main">
          <div class="mx-setup">
            <div class="mx-setup-hero">
              <div class="mx-hero-icon">${this.ic('graduation-cap', '🎓')}</div>
              <h1>محاكاة اختبار STEP</h1>
              <p>اختبار تجريبي بمؤقت زمني يحاكي اختبار كفايات اللغة الإنجليزية (STEP) الحقيقي — بنفس أقسامه ونِسَبه الرسمية. اختر نمط الاختبار وابدأ.</p>
            </div>

            <div class="mx-modes" id="mx-modes">${modeCards}</div>

            <div class="mx-breakdown">
              <h3>${this.ic('clipboard', '📋')} توزيع الأسئلة — <span id="mx-bd-preset">${this.PRESETS[this.preset].label}</span></h3>
              <div class="mx-bd-rows" id="mx-bd-rows"></div>
            </div>

            <div class="mx-instructions">
              <h4>${this.ic('lightbulb', '💡')} تعليمات الاختبار</h4>
              <ul>
                <li>المؤقت يبدأ فور الضغط على «ابدأ الاختبار» ولا يمكن إيقافه — تماماً كالاختبار الحقيقي.</li>
                <li>مقاطع الاستماع يمكن تشغيل كل منها <b>مرتين فقط</b>.</li>
                <li>يمكنك وضع <b>علامة مراجعة</b> 🚩 على أي سؤال والعودة إليه لاحقاً من لوحة الأسئلة.</li>
                <li>لن تظهر الإجابات الصحيحة والشروحات إلا بعد تسليم الاختبار.</li>
                <li>اختصارات لوحة المفاتيح: <b>1-4</b> لاختيار الإجابة، <b>الأسهم</b> للتنقل، <b>F</b> لعلامة المراجعة.</li>
                <li>عند انتهاء الوقت يُسلَّم الاختبار تلقائياً.</li>
              </ul>
            </div>

            <div class="mx-setup-cta">
              <button class="mx-btn mx-btn-primary mx-btn-lg" id="mx-begin">${this.ic('rocket', '🚀')} ابدأ الاختبار الآن</button>
            </div>

            ${histHtml}
          </div>
        </main>
      </div>`;

    this.renderBreakdown(avail);

    shell.querySelectorAll('.mx-mode-card').forEach(card => {
      card.onclick = function () {
        self.preset = this.dataset.mode;
        shell.querySelectorAll('.mx-mode-card').forEach(c => c.classList.toggle('selected', c === this), this);
        document.getElementById('mx-bd-preset').textContent = self.PRESETS[self.preset].label;
        self.renderBreakdown(avail);
      };
    });
    document.getElementById('mx-begin').onclick = () => this.beginExam();
    document.getElementById('mx-exit-setup').onclick = () => this.exit(true);
  },

  renderBreakdown: function (avail) {
    const p = this.PRESETS[this.preset];
    const rows = document.getElementById('mx-bd-rows');
    if (!rows) return;
    // النموذج المحفوظ توزيعه معروف من أسئلته نفسها مش من counts
    const counts = p.questions
      ? this.ORDER.map(s => p.questions.filter(q => q.section === s).length)
      : this.ORDER.map(s => Math.min(p.counts[s], avail[s]));
    const total = counts.reduce((a, b) => a + b, 0) || 1;
    rows.innerHTML = this.ORDER.map((s, i) => {
      const meta = this.SECTIONS[s];
      const n = counts[i];
      return `
        <div class="mx-bd-row">
          <div class="mx-bd-label" style="color:${meta.color}">${this.ic(meta.icon, meta.em)} ${meta.label}</div>
          <div class="mx-bd-bar"><div class="mx-bd-fill" style="width:${Math.round(n / total * 100)}%;background:${meta.color}"></div></div>
          <div class="mx-bd-count">${n} سؤال</div>
        </div>`;
    }).join('');
  },

  /* ── EXAM SHELL ─────────────────────────────────────────────── */
  renderExamShell: function () {
    const shell = document.getElementById('mock-exam-ui');
    shell.innerHTML = `
      <header class="mx-header">
        <div class="mx-header-brand">
          <div class="mx-logo">${this.ic('target', '🎯')}</div>
          <span class="mx-brand-text">محاكاة STEP</span>
        </div>
        <div class="mx-header-center">
          <span class="mx-section-chip" id="mx-section-chip"></span>
          <span class="mx-qcount" id="mx-qcount"></span>
        </div>
        <div class="mx-header-actions">
          <div class="mx-timer" id="mx-timer"></div>
          <button class="mx-btn mx-btn-success" id="mx-open-review">${this.ic('check-circle', '✅')} تسليم</button>
          <button class="mx-btn mx-btn-danger" id="mx-exit">${this.ic('x-circle', '✖')}</button>
        </div>
      </header>
      <div class="mx-progress"><div class="mx-progress-fill" id="mx-progress-fill" style="width:0%"></div></div>
      <div class="mx-body">
        <main class="mx-main" id="mx-main"><div class="mx-main-inner" id="mx-qarea"></div></main>
        <aside class="mx-palette" id="mx-palette"></aside>
      </div>
      <button class="mx-pal-toggle" id="mx-pal-toggle" title="لوحة الأسئلة">${this.ic('clipboard', '#')}</button>`;

    document.getElementById('mx-exit').onclick = () => this.exit();
    document.getElementById('mx-open-review').onclick = () => this.openReviewModal();
    document.getElementById('mx-pal-toggle').onclick = () => document.getElementById('mx-palette').classList.toggle('open');
    this.renderPalette();
  },

  /* ── NAVIGATION ─────────────────────────────────────────────── */
  enterQuestion: function (idx, allowIntro) {
    this.stopAudio();
    this.current = Math.max(0, Math.min(idx, this.questions.length - 1));
    const sec = this.questions[this.current].section;

    if (allowIntro && !this.seenSections[sec]) {
      this.seenSections[sec] = true;
      this.renderSectionIntro(sec);
      return;
    }
    this.seenSections[sec] = true;
    this.renderQuestion();
  },

  next: function () {
    if (this.current < this.questions.length - 1) {
      const nextSec = this.questions[this.current + 1].section;
      this.enterQuestion(this.current + 1, !this.seenSections[nextSec]);
    } else {
      this.openReviewModal();
    }
  },
  prev: function () { if (this.current > 0) this.enterQuestion(this.current - 1); },
  goto: function (i) {
    document.getElementById('mx-palette').classList.remove('open');
    this.enterQuestion(i);
  },

  /* ── SECTION INTRO ──────────────────────────────────────────── */
  renderSectionIntro: function (sec) {
    const meta = this.SECTIONS[sec];
    const count = this.questions.filter(q => q.section === sec).length;
    const area = document.getElementById('mx-qarea');
    this.updateHeaderMeta();
    area.innerHTML = `
      <div class="mx-section-intro">
        <div class="mx-si-icon" style="background:linear-gradient(135deg, ${meta.color}, ${meta.color}cc)">${this.ic(meta.icon, meta.em)}</div>
        <h2>قسم ${meta.label}</h2>
        <div class="mx-si-count">${count} سؤال في هذا القسم</div>
        <div class="mx-si-tips">${this.ic('lightbulb', '💡')} <b>نصيحة:</b> ${meta.tip}</div>
        <button class="mx-btn mx-btn-primary mx-btn-lg" id="mx-si-start">ابدأ القسم ${this.ic('chevron-left', '◀')}</button>
      </div>`;
    document.getElementById('mx-si-start').onclick = () => this.renderQuestion();
    document.getElementById('mx-main').scrollTop = 0;
  },

  /* ── QUESTION VIEW ──────────────────────────────────────────── */
  updateHeaderMeta: function () {
    const q = this.questions[this.current];
    const meta = this.SECTIONS[q.section];
    const chip = document.getElementById('mx-section-chip');
    chip.innerHTML = this.ic(meta.icon, meta.em) + ' ' + meta.label;
    chip.style.background = meta.color + '22';
    chip.style.color = meta.color;
    document.getElementById('mx-qcount').textContent = 'سؤال ' + (this.current + 1) + ' من ' + this.questions.length;
    const answered = Object.keys(this.answers).length;
    document.getElementById('mx-progress-fill').style.width = Math.round(answered / this.questions.length * 100) + '%';
  },

  renderQuestion: function () {
    const q = this.questions[this.current];
    const idx = this.current;
    const area = document.getElementById('mx-qarea');
    const flagged = !!this.flags[idx];
    const sel = this.answers[idx];

    let media = '';
    if (q.audioUrl) {
      const played = this.audioPlays[idx] || 0;
      const left = Math.max(0, 2 - played);
      media = `
        <div class="mx-audio">
          <button class="mx-audio-play" id="mx-audio-play" ${left === 0 ? 'disabled' : ''}>${this.ic('play', '▶')}</button>
          <div class="mx-audio-info">
            <div class="mx-audio-title">المقطع الصوتي</div>
            <div class="mx-audio-sub" id="mx-audio-sub">${left === 0 ? 'استنفدت مرات التشغيل' : 'متبقي ' + left + ' من 2 تشغيل'}</div>
          </div>
          <div class="mx-audio-plays">
            <div class="mx-play-dot ${played >= 1 ? 'used' : ''}"></div>
            <div class="mx-play-dot ${played >= 2 ? 'used' : ''}"></div>
          </div>
        </div>`;
    }
    if (q.imgUrl) media += `<img class="mx-chart-img" src="${this.esc(q.imgUrl)}" alt="Chart"/>`;
    if (q.passage) media += `
        <div>
          <div class="mx-passage-label">${this.ic('library', '📖')} READING PASSAGE</div>
          <div class="mx-passage">${this.esc(q.passage)}</div>
        </div>`;

    area.innerHTML = `
      <div class="mx-qwrap">
        <div class="mx-qmeta">
          <div class="mx-qnum-badge"><span class="mx-qnum">${idx + 1}</span> السؤال ${idx + 1} من ${this.questions.length}</div>
          <button class="mx-flag-btn ${flagged ? 'on' : ''}" id="mx-flag">${this.ic('flag', '🚩')} ${flagged ? 'معلَّم للمراجعة' : 'علامة مراجعة'}</button>
        </div>
        <div class="mx-qcard">
          ${media}
          <div class="mx-qtext">${this.esc(q.q)}</div>
          <div class="mx-opts">
            ${q.opts.map((opt, oi) => `
              <button class="mx-opt ${sel === oi ? 'selected' : ''}" data-oi="${oi}">
                <span class="mx-opt-letter">${'ABCD'[oi] || oi + 1}</span>
                <span>${this.esc(opt)}</span>
              </button>`).join('')}
          </div>
        </div>
        <div class="mx-qnav">
          <button class="mx-btn mx-btn-ghost" id="mx-prev" ${idx === 0 ? 'disabled' : ''}>${this.ic('chevron-right', '▶')} السابق</button>
          <div class="mx-hint-keys"><kbd>1</kbd>-<kbd>4</kbd> اختيار &nbsp;•&nbsp; <kbd>←</kbd> التالي &nbsp;•&nbsp; <kbd>F</kbd> علامة</div>
          <button class="mx-btn mx-btn-primary" id="mx-next">${idx === this.questions.length - 1 ? 'إنهاء ومراجعة' : 'التالي'} ${this.ic('chevron-left', '◀')}</button>
        </div>
      </div>`;

    const self = this;
    area.querySelectorAll('.mx-opt').forEach(btn => {
      btn.onclick = function () { self.selectOption(parseInt(this.dataset.oi, 10)); };
    });
    document.getElementById('mx-prev').onclick = () => this.prev();
    document.getElementById('mx-next').onclick = () => this.next();
    document.getElementById('mx-flag').onclick = () => this.toggleFlag();
    const playBtn = document.getElementById('mx-audio-play');
    if (playBtn) playBtn.onclick = () => this.playAudio();

    this.updateHeaderMeta();
    this.refreshPalette();
    document.getElementById('mx-main').scrollTop = 0;
  },

  selectOption: function (oi) {
    const q = this.questions[this.current];
    if (!q || oi < 0 || oi >= q.opts.length) return;
    this.answers[this.current] = oi;
    const area = document.getElementById('mx-qarea');
    area.querySelectorAll('.mx-opt').forEach((btn, i) => btn.classList.toggle('selected', i === oi));
    this.updateHeaderMeta();
    this.refreshPalette();
  },

  toggleFlag: function () {
    const idx = this.current;
    this.flags[idx] = !this.flags[idx];
    const btn = document.getElementById('mx-flag');
    if (btn) {
      btn.classList.toggle('on', this.flags[idx]);
      btn.innerHTML = this.ic('flag', '🚩') + ' ' + (this.flags[idx] ? 'معلَّم للمراجعة' : 'علامة مراجعة');
    }
    this.refreshPalette();
  },

  /* ── AUDIO ──────────────────────────────────────────────────── */
  playAudio: function () {
    const idx = this.current;
    const q = this.questions[idx];
    if (!q.audioUrl) return;
    const played = this.audioPlays[idx] || 0;
    if (played >= 2) return;

    this.stopAudio();
    this.audioPlays[idx] = played + 1;

    const self = this;
    this._audio = new Audio(q.audioUrl);
    const btn = document.getElementById('mx-audio-play');
    if (btn) btn.classList.add('playing');
    this._audio.onended = this._audio.onerror = function () {
      if (self.current === idx && document.getElementById('mx-audio-play')) self.renderAudioState();
    };
    this._audio.play().catch(() => {});
    this.renderAudioState(true);
  },

  renderAudioState: function (playing) {
    const idx = this.current;
    const played = this.audioPlays[idx] || 0;
    const left = Math.max(0, 2 - played);
    const btn = document.getElementById('mx-audio-play');
    const sub = document.getElementById('mx-audio-sub');
    if (!btn) return;
    btn.classList.toggle('playing', !!playing);
    btn.disabled = !playing && left === 0;
    if (sub) sub.textContent = playing ? 'جارٍ التشغيل...' : (left === 0 ? 'استنفدت مرات التشغيل' : 'متبقي ' + left + ' من 2 تشغيل');
    const dots = btn.closest('.mx-audio').querySelectorAll('.mx-play-dot');
    dots.forEach((d, i) => d.classList.toggle('used', played >= i + 1));
  },

  stopAudio: function () {
    if (this._audio) { try { this._audio.pause(); } catch (e) {} this._audio = null; }
  },

  /* ── PALETTE ────────────────────────────────────────────────── */
  renderPalette: function () {
    const pal = document.getElementById('mx-palette');
    if (!pal) return;
    let html = `<div class="mx-palette-head">${this.ic('map', '🗺')} لوحة الأسئلة</div>`;

    this.ORDER.forEach(sec => {
      const meta = this.SECTIONS[sec];
      const idxs = [];
      this.questions.forEach((q, i) => { if (q.section === sec) idxs.push(i); });
      if (!idxs.length) return;
      html += `
        <div>
          <div class="mx-pal-section-label" style="color:${meta.color}">${this.ic(meta.icon, meta.em)} ${meta.label}</div>
          <div class="mx-pal-grid">
            ${idxs.map(i => `<div class="mx-pal-cell" data-i="${i}">${i + 1}</div>`).join('')}
          </div>
        </div>`;
    });

    html += `
      <div class="mx-pal-legend">
        <div><span class="mx-leg-dot" style="background:rgba(6,214,160,0.35);border:1.5px solid rgba(6,214,160,0.7)"></span> تمت الإجابة</div>
        <div><span class="mx-leg-dot" style="background:var(--surface2);border:1.5px solid var(--border-md)"></span> لم تتم الإجابة</div>
        <div><span class="mx-leg-dot" style="background:#F5A623"></span> معلَّم للمراجعة</div>
      </div>`;

    pal.innerHTML = html;
    const self = this;
    pal.querySelectorAll('.mx-pal-cell').forEach(cell => {
      cell.onclick = function () { self.goto(parseInt(this.dataset.i, 10)); };
    });
    this.refreshPalette();
  },

  refreshPalette: function () {
    const pal = document.getElementById('mx-palette');
    if (!pal) return;
    const self = this;
    pal.querySelectorAll('.mx-pal-cell').forEach(cell => {
      const i = parseInt(cell.dataset.i, 10);
      cell.classList.toggle('answered', self.answers[i] != null);
      cell.classList.toggle('flagged', !!self.flags[i]);
      cell.classList.toggle('current', i === self.current && self.view === 'exam');
    });
  },

  /* ── REVIEW MODAL (pre-submit) ──────────────────────────────── */
  openReviewModal: function () {
    const total = this.questions.length;
    const answered = Object.keys(this.answers).length;
    const flaggedIdx = Object.keys(this.flags).filter(k => this.flags[k]).map(Number);
    const unansweredIdx = [];
    for (let i = 0; i < total; i++) if (this.answers[i] == null) unansweredIdx.push(i);

    const old = document.getElementById('mx-review-overlay');
    if (old) old.remove();

    const overlay = document.createElement('div');
    overlay.id = 'mx-review-overlay';
    overlay.className = 'mx-modal-overlay';
    overlay.innerHTML = `
      <div class="mx-modal">
        <h3>${this.ic('check-circle', '✅')} مراجعة قبل التسليم</h3>
        <div class="mx-modal-sub">تأكد من إجاباتك قبل التسليم النهائي — لا يمكن التراجع بعدها.</div>
        <div class="mx-review-stats">
          <div class="mx-rstat"><span class="num" style="color:#059669">${answered}</span><span class="lbl">تمت الإجابة</span></div>
          <div class="mx-rstat"><span class="num" style="color:${unansweredIdx.length ? '#dc2626' : 'var(--text-muted)'}">${unansweredIdx.length}</span><span class="lbl">بدون إجابة</span></div>
          <div class="mx-rstat"><span class="num" style="color:#b45309">${flaggedIdx.length}</span><span class="lbl">معلَّمة للمراجعة</span></div>
        </div>
        ${unansweredIdx.length ? `
          <div style="margin-bottom:0.5rem;font-size:0.82rem;font-weight:700;color:var(--text-muted)">أسئلة بدون إجابة — اضغط للانتقال:</div>
          <div class="mx-pal-grid" style="grid-template-columns:repeat(8,1fr);margin-bottom:0.8rem">
            ${unansweredIdx.slice(0, 40).map(i => `<div class="mx-pal-cell" data-goto="${i}">${i + 1}</div>`).join('')}
          </div>` : `<div style="font-weight:700;color:#059669;margin-bottom:0.5rem">${this.ic('sparkles', '✨')} أجبت على جميع الأسئلة — جاهز للتسليم!</div>`}
        <div class="mx-modal-actions">
          <button class="mx-btn mx-btn-ghost" id="mx-review-back">${this.ic('chevron-right', '▶')} متابعة الحل</button>
          <button class="mx-btn mx-btn-success" id="mx-final-submit">${this.ic('check-circle', '✅')} تسليم نهائي</button>
        </div>
      </div>`;

    document.getElementById('mock-exam-ui').appendChild(overlay);
    const self = this;
    overlay.querySelectorAll('[data-goto]').forEach(cell => {
      cell.onclick = function () { overlay.remove(); self.goto(parseInt(this.dataset.goto, 10)); };
    });
    document.getElementById('mx-review-back').onclick = () => overlay.remove();
    document.getElementById('mx-final-submit').onclick = () => { overlay.remove(); this.submitExam(false); };
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
  },

  /* ── SUBMIT & RESULTS ───────────────────────────────────────── */
  submitExam: function (auto) {
    if (!this.active) return;
    this.teardown();
    this.view = 'results';

    const timeUsed = Math.min(Math.round((Date.now() - this.startedAt) / 1000), this.PRESETS[this.preset].time);
    const perSection = {};
    this.ORDER.forEach(s => perSection[s] = { correct: 0, total: 0 });
    let correct = 0;

    this.questions.forEach((q, i) => {
      const ok = this.answers[i] === q.c;
      perSection[q.section].total++;
      if (ok) { correct++; perSection[q.section].correct++; }
      if (window.SmartAnalytics) SmartAnalytics.record(q.section, ok);
    });

    const total = this.questions.length;
    const pct = Math.round(correct / total * 100);
    this._lastResult = { correct, total, pct, perSection, timeUsed, auto: !!auto };

    // history
    const hist = this.getHistory();
    hist.unshift({
      date: new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' }),
      preset: this.preset, correct, total, pct, timeUsed
    });
    localStorage.setItem('gs_mock_history', JSON.stringify(hist.slice(0, 10)));

    // حفظ على السيرفر كمان — ده مصدر تحليلات الامتحانات في لوحة التحكم
    this.saveAttemptToServer({ correct, total, perSection, timeUsed });

    if (typeof addXP === 'function') addXP(correct * 5, null);
    if (pct >= 60 && typeof launchConfetti === 'function') launchConfetti();

    this.renderResults();
  },

  getHistory: function () {
    try { return JSON.parse(localStorage.getItem('gs_mock_history')) || []; }
    catch (e) { return []; }
  },

  /**
   * يبعت المحاولة للسيرفر. الفشل بيتسجّل في الكونسول بس ومش بيوقف
   * أي حاجة — نتيجة الطالب معروضة قدامه بالفعل ومحفوظة محلياً.
   */
  saveAttemptToServer: function (result) {
    const preset = this.PRESETS[this.preset] || {};

    const sectionScores = {};
    this.ORDER.forEach(s => {
      if (result.perSection[s] && result.perSection[s].total > 0) {
        sectionScores[s] = result.perSection[s];
      }
    });

    fetch('/api/student/exam-attempts', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        examId: preset.examId || null,
        preset: preset.examId ? null : this.preset,
        score: result.correct,
        total: result.total,
        sectionScores,
        answers: this.answers,
        startedAt: new Date(this.startedAt).toISOString(),
      }),
    }).catch(err => console.warn('تعذّر حفظ نتيجة الامتحان على السيرفر:', err));
  },

  getBand: function (pct) {
    if (pct >= 90) return { label: 'ممتاز', cefr: 'C1+', color: '#06D6A0', msg: 'أداء استثنائي! مستواك يعادل المتحدث المتمكن. أنت جاهز تماماً لاختبار STEP الحقيقي.' };
    if (pct >= 75) return { label: 'متقدم', cefr: 'B2', color: '#00B4D8', msg: 'مستوى قوي جداً! راجع الأسئلة التي أخطأت فيها وستصل للتميز الكامل.' };
    if (pct >= 60) return { label: 'جيد', cefr: 'B1', color: '#F5A623', msg: 'أساس جيد! ركز على الأقسام الأضعف في التحليل أدناه وأعد التدرب عليها.' };
    if (pct >= 40) return { label: 'متوسط', cefr: 'A2', color: '#FB923C', msg: 'تحتاج مزيداً من التدريب. راجع الاستراتيجيات في المنصة ثم أعد المحاولة.' };
    return { label: 'يحتاج تأسيس', cefr: 'A1', color: '#EF233C', msg: 'لا تقلق — كل خبير كان مبتدئاً. ابدأ بمراجعة استراتيجيات القواعد والقراءة خطوة بخطوة.' };
  },

  renderResults: function () {
    const r = this._lastResult;
    const band = this.getBand(r.pct);
    const shell = document.getElementById('mock-exam-ui');
    const C = 2 * Math.PI * 80;
    const self = this;

    const sectionRows = this.ORDER.map(s => {
      const meta = this.SECTIONS[s];
      const st = r.perSection[s];
      if (!st.total) return '';
      const p = Math.round(st.correct / st.total * 100);
      return `
        <div class="mx-bd-row">
          <div class="mx-bd-label" style="color:${meta.color}">${this.ic(meta.icon, meta.em)} ${meta.label}</div>
          <div class="mx-bd-bar"><div class="mx-bd-fill" style="width:0%;background:${meta.color}" data-w="${p}"></div></div>
          <div class="mx-bd-count">${st.correct}/${st.total} (${p}%)</div>
        </div>`;
    }).join('');

    shell.innerHTML = `
      <header class="mx-header">
        <div class="mx-header-brand">
          <div class="mx-logo">${this.ic('trophy', '🏆')}</div>
          <span class="mx-brand-text">نتيجة الاختبار</span>
        </div>
        <div class="mx-header-actions">
          <button class="mx-btn mx-btn-ghost" id="mx-res-home">${this.ic('home', '🏠')} الرئيسية</button>
        </div>
      </header>
      <div class="mx-body">
        <main class="mx-main">
          <div class="mx-results">
            <div class="mx-res-hero">
              ${r.auto ? `<div style="color:#dc2626;font-weight:800;font-size:0.85rem;margin-bottom:0.8rem">${this.ic('timer', '⏱')} انتهى الوقت — تم التسليم تلقائياً</div>` : ''}
              <div class="mx-gauge">
                <svg width="190" height="190" viewBox="0 0 190 190">
                  <circle class="mx-gauge-track" cx="95" cy="95" r="80"/>
                  <circle class="mx-gauge-fill" id="mx-gauge-fill" cx="95" cy="95" r="80"
                    stroke="${band.color}" stroke-dasharray="${C}" stroke-dashoffset="${C}"/>
                </svg>
                <div class="mx-gauge-center">
                  <div class="mx-gauge-score" id="mx-gauge-score" style="color:${band.color}">0</div>
                  <div class="mx-gauge-total">من 100 درجة تقديرية</div>
                </div>
              </div>
              <div class="mx-res-band" style="background:${band.color}22;color:${band.color}">${this.ic('star', '⭐')} ${band.label} — ${band.cefr}</div>
              <div class="mx-res-msg">${band.msg}</div>
              <div class="mx-res-quickstats">
                <div class="qs"><span class="v" style="color:#059669">${r.correct}</span><span class="k">إجابة صحيحة</span></div>
                <div class="qs"><span class="v" style="color:#dc2626">${r.total - r.correct}</span><span class="k">إجابة خاطئة / متروكة</span></div>
                <div class="qs"><span class="v">${this.fmtTime(r.timeUsed)}</span><span class="k">الوقت المستغرق</span></div>
              </div>
            </div>

            <div class="mx-res-sections">
              <h3>${this.ic('bar-chart', '📊')} أداؤك حسب الأقسام</h3>
              <div class="mx-bd-rows">${sectionRows}</div>
            </div>

            <div class="mx-ans-review">
              <h3>${this.ic('eye', '👁')} مراجعة الإجابات والشروحات</h3>
              <div class="mx-ans-filters" id="mx-ans-filters">
                <button class="mx-ans-filter on" data-f="all">الكل (${r.total})</button>
                <button class="mx-ans-filter" data-f="wrong">الأخطاء (${r.total - r.correct - this.countSkipped()})</button>
                <button class="mx-ans-filter" data-f="skipped">المتروكة (${this.countSkipped()})</button>
                <button class="mx-ans-filter" data-f="correct">الصحيحة (${r.correct})</button>
              </div>
              <div id="mx-ans-list"></div>
            </div>

            <div class="mx-res-actions">
              <button class="mx-btn mx-btn-primary mx-btn-lg" id="mx-retry">${this.ic('refresh', '🔄')} اختبار جديد</button>
              <button class="mx-btn mx-btn-ghost mx-btn-lg" id="mx-res-home2">${this.ic('home', '🏠')} العودة للرئيسية</button>
            </div>
          </div>
        </main>
      </div>`;

    // animate gauge + bars
    setTimeout(() => {
      const fill = document.getElementById('mx-gauge-fill');
      if (fill) fill.style.strokeDashoffset = C * (1 - r.pct / 100);
      shell.querySelectorAll('.mx-bd-fill[data-w]').forEach(b => b.style.width = b.dataset.w + '%');
      // count-up
      const scoreEl = document.getElementById('mx-gauge-score');
      const t0 = performance.now();
      (function tick(now) {
        const k = Math.min((now - t0) / 1200, 1);
        scoreEl.textContent = Math.round(r.pct * (1 - Math.pow(1 - k, 3)));
        if (k < 1) requestAnimationFrame(tick);
      })(t0);
    }, 80);

    this._resultFilter = 'all';
    this.renderAnswerList();

    shell.querySelectorAll('.mx-ans-filter').forEach(btn => {
      btn.onclick = function () {
        shell.querySelectorAll('.mx-ans-filter').forEach(b => b.classList.toggle('on', b === this), this);
        self._resultFilter = this.dataset.f;
        self.renderAnswerList();
      };
    });
    document.getElementById('mx-retry').onclick = () => { this.view = 'setup'; this.renderSetup(); };
    document.getElementById('mx-res-home').onclick = () => this.exit(true);
    document.getElementById('mx-res-home2').onclick = () => this.exit(true);
  },

  countSkipped: function () {
    let n = 0;
    for (let i = 0; i < this.questions.length; i++) if (this.answers[i] == null) n++;
    return n;
  },

  renderAnswerList: function () {
    const list = document.getElementById('mx-ans-list');
    if (!list) return;
    const f = this._resultFilter;
    let html = '';

    this.questions.forEach((q, i) => {
      const sel = this.answers[i];
      const state = sel == null ? 'skipped' : (sel === q.c ? 'correct' : 'wrong');
      if (f !== 'all' && f !== state) return;
      const meta = this.SECTIONS[q.section];
      const stateLabel = state === 'correct' ? 'صحيحة' : state === 'wrong' ? 'خاطئة' : 'متروكة';

      html += `
        <div class="mx-ans-item ${state}">
          <div class="mx-ans-top">
            <span class="mx-ans-num">Q${i + 1}</span>
            <span class="mx-ans-badge section" style="background:${meta.color}22;color:${meta.color}">${meta.label}</span>
            <span class="mx-ans-badge ${state}">${stateLabel}</span>
          </div>
          <div class="mx-ans-q">${this.esc(q.q)}</div>
          <div class="mx-ans-opts">
            ${q.opts.map((opt, oi) => {
              let cls = '';
              if (oi === q.c) cls = 'is-correct';
              else if (oi === sel) cls = 'is-wrong-pick';
              const mark = oi === q.c ? '✓' : (oi === sel ? '✗' : '');
              return `<div class="mx-ans-opt ${cls}"><b>${'ABCD'[oi]}.</b> ${this.esc(opt)} ${mark ? '<b style="margin-left:auto">' + mark + '</b>' : ''}</div>`;
            }).join('')}
          </div>
          ${q.expl ? `<div class="mx-ans-expl">${this.ic('lightbulb', '💡')} ${q.expl}</div>` : ''}
        </div>`;
    });

    list.innerHTML = html || '<div style="text-align:center;color:var(--text-muted);font-weight:700;padding:1.5rem">لا توجد أسئلة في هذا التصنيف</div>';
  }
};