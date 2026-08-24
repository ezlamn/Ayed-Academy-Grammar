/* ================================================================
   SYNC.JS — مزامنة حالة الطالب مع السيرفر
   Grammar Strategies — Ayed Academy
   ----------------------------------------------------------------
   المبدأ: الكتابة المحلية (localStorage) تفضل زي ما هي عشان الواجهة
   تبقى فورية، و queueSync بيرفع نفس التغيير للسيرفر بعد تأخير قصير.
   كده الموقع بيفضل شغال حتى لو الشبكة وقعت.
   ================================================================ */

const GSSync = {
  /* ── الحالة ──────────────────────────────────────────────── */
  enabled: false,        // بيتفعّل بس لما يكون فيه جلسة طالب
  _pendingState: {},     // تغييرات الحالة المتراكمة
  _pendingAttempts: [],  // محاولات الأسئلة المتراكمة
  _timer: null,
  _flushing: false,

  DEBOUNCE_MS: 2000,

  /* ── الطلبات ─────────────────────────────────────────────── */
  async request(method, path, body) {
    const res = await fetch('/api' + path, {
      method,
      credentials: 'include',
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const err = new Error(`فشل الطلب (${res.status})`);
      err.status = res.status;
      try { err.payload = await res.json(); } catch { /* رد مش JSON */ }
      throw err;
    }

    return res.status === 204 ? null : res.json();
  },

  /* ── التوثيق ─────────────────────────────────────────────── */
  me() { return this.request('GET', '/auth/student/me'); },

  login(email, password) {
    return this.request('POST', '/auth/student/login', { email, password });
  },

  register(email, password, name) {
    return this.request('POST', '/auth/student/register', { email, password, name });
  },

  logout() { return this.request('POST', '/auth/student/logout'); },

  /* ── جدولة المزامنة ──────────────────────────────────────── */

  /**
   * يضيف تغييراً لطابور الرفع. النداءات المتتالية بتتجمّع في طلب
   * واحد — مهم لأن addXP مثلاً بيتنادى على كل إجابة صح.
   */
  queueState(patch) {
    if (!this.enabled) return;
    Object.assign(this._pendingState, patch);
    this._schedule();
  },

  queueAttempt(questionId, selectedIndex) {
    if (!this.enabled) return;
    const id = Number(questionId);
    if (!Number.isInteger(id) || id <= 0) return;
    this._pendingAttempts.push({ questionId: id, selectedIndex });
    this._schedule();
  },

  _schedule() {
    clearTimeout(this._timer);
    this._timer = setTimeout(() => this.flush(), this.DEBOUNCE_MS);
  },

  /** يرفع كل المتراكم. آمن للنداء المتكرر. */
  async flush() {
    if (!this.enabled || this._flushing) return;

    const state = this._pendingState;
    const attempts = this._pendingAttempts;
    if (!Object.keys(state).length && !attempts.length) return;

    // نفضّي الطابور قبل الطلب عشان التغييرات الجديدة أثناء الرفع
    // ما تضيعش — لو الطلب فشل بنرجّعها
    this._pendingState = {};
    this._pendingAttempts = [];
    this._flushing = true;

    try {
      if (Object.keys(state).length) {
        await this.request('PATCH', '/student/state', state);
      }
      if (attempts.length) {
        await this.request('POST', '/student/attempts', { attempts });
      }
    } catch (err) {
      // الجلسة خلصت — نوقف المزامنة بدل ما نفضل نحاول
      if (err.status === 401) {
        this.enabled = false;
        console.warn('انتهت الجلسة — التقدّم هيتحفظ محلياً بس.');
        return;
      }
      // فشل مؤقت: نرجّع اللي فشل ونحاول تاني بعد شوية
      this._pendingState = { ...state, ...this._pendingState };
      this._pendingAttempts = [...attempts, ...this._pendingAttempts];
      console.warn('فشلت المزامنة، هنحاول تاني:', err.message);
      this._schedule();
    } finally {
      this._flushing = false;
    }
  },

  /* ── التقدّم في الوحدات ──────────────────────────────────── */
  markUnitComplete(unitLegacyId) {
    if (!this.enabled) return Promise.resolve();
    return this.request('POST', `/student/progress/${encodeURIComponent(unitLegacyId)}/complete`)
      .catch(err => console.warn('تعذّر حفظ إكمال الوحدة:', err.message));
  },

  /* ── الترحيل من localStorage ─────────────────────────────── */

  /**
   * بيتنادى مرة واحدة بعد أول دخول: بيرفع اللي في localStorage
   * للسيرفر. السيرفر بيرفض التكرار (migrated flag) فمفيش خطر
   * إن بيانات قديمة تدوس على تقدّم أحدث.
   */
  async migrateLocal() {
    const num = (key, def = 0) => {
      const v = parseInt(localStorage.getItem(key) || '', 10);
      return Number.isFinite(v) ? v : def;
    };
    const json = (key, def) => {
      try { return JSON.parse(localStorage.getItem(key) || '') ?? def; }
      catch { return def; }
    };

    const payload = {
      xp: num('gs_xp'),
      level: num('gs_level', 1),
      streak: num('gs_streak'),
      bestStreak: num('gs_best_streak'),
      lastActive: localStorage.getItem('gs_last_active') || null,
      notes: json('gs_notes', {}),
      highlights: json('gs_highlights', {}),
      srs: json('gs_srs', {}),
      analytics: json('gs_analytics', {}),
      completedUnits: json('gs_completed', []).map(String),
    };

    // مفيش حاجة تُرحَّل؟ ما نزعّجش السيرفر
    const hasData = payload.xp > 0
      || payload.completedUnits.length
      || Object.keys(payload.notes).length
      || Object.keys(payload.highlights).length;
    if (!hasData) return { migrated: false };

    try {
      return await this.request('POST', '/student/migrate-local', payload);
    } catch (err) {
      console.warn('تعذّر ترحيل البيانات المحلية:', err.message);
      return { migrated: false };
    }
  },

  /* ── تطبيق حالة السيرفر محلياً ───────────────────────────── */

  /** يكتب حالة السيرفر في GS و localStorage — السيرفر هو المرجع. */
  applyServerState(session) {
    const s = session.state || {};

    GS.student.name = session.name || GS.student.name;
    GS.student.xp = s.xp ?? 0;
    GS.student.level = s.level ?? 1;
    GS.student.streak = s.streak ?? 0;
    GS.student.bestStreak = s.bestStreak ?? 0;
    GS.student.lastActive = s.lastActive || '';
    GS.student.notes = s.notes || {};
    GS.student.highlights = s.highlights || {};
    GS.student.completedUnits = session.completedUnits || [];

    // نسخة محلية عشان الموقع يفضل شغال لو الشبكة وقعت
    localStorage.setItem('gs_student_name', GS.student.name);
    localStorage.setItem('gs_xp', GS.student.xp);
    localStorage.setItem('gs_level', GS.student.level);
    localStorage.setItem('gs_streak', GS.student.streak);
    localStorage.setItem('gs_best_streak', GS.student.bestStreak);
    localStorage.setItem('gs_last_active', GS.student.lastActive);
    localStorage.setItem('gs_notes', JSON.stringify(GS.student.notes));
    localStorage.setItem('gs_highlights', JSON.stringify(GS.student.highlights));
    localStorage.setItem('gs_completed', JSON.stringify(GS.student.completedUnits));
    if (s.srs) localStorage.setItem('gs_srs', JSON.stringify(s.srs));
    if (s.analytics && Object.keys(s.analytics).length) {
      localStorage.setItem('gs_analytics', JSON.stringify(s.analytics));
    }
  },

  /** يمسح كل الأثر المحلي عند الخروج. */
  clearLocal() {
    [
      'gs_student_name', 'gs_xp', 'gs_level', 'gs_streak', 'gs_best_streak',
      'gs_last_active', 'gs_notes', 'gs_highlights', 'gs_completed',
      'gs_srs', 'gs_analytics', 'gs_mock_history',
    ].forEach(k => localStorage.removeItem(k));
  },
};

// آخر فرصة للرفع قبل ما الصفحة تقفل
window.addEventListener('pagehide', () => {
  if (!GSSync.enabled) return;
  const state = GSSync._pendingState;
  if (!Object.keys(state).length) return;
  // fetch العادي بيتلغي مع إغلاق الصفحة — sendBeacon بيكمل
  try {
    navigator.sendBeacon(
      '/api/student/state',
      new Blob([JSON.stringify(state)], { type: 'application/json' })
    );
  } catch { /* المتصفح ما بيدعمش — التغيير محفوظ محلياً على أي حال */ }
});

window.GSSync = GSSync;
