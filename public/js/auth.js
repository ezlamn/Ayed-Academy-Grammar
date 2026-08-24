/* ================================================================
   AUTH.JS — شاشة البداية: دخول وتسجيل الطلاب
   Grammar Strategies — Ayed Academy
   ----------------------------------------------------------------
   الجلسة بـ httpOnly cookie على السيرفر، والتقدّم بيتحفظ هناك —
   الطالب بيلاقي تقدّمه على أي جهاز يدخل منه.
   ================================================================ */

let authMode = 'login'; // 'login' | 'register'

function showAuthError(message) {
  const box = $('auth-error');
  if (!box) return;
  box.textContent = message;
  box.classList.remove('hidden');
}

function clearAuthError() {
  const box = $('auth-error');
  if (box) box.classList.add('hidden');
}

function setAuthMode(mode) {
  authMode = mode;
  clearAuthError();

  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.authTab === mode);
  });

  const isRegister = mode === 'register';
  $('auth-name').classList.toggle('hidden', !isRegister);
  $('auth-name').required = isRegister;
  $('auth-password').autocomplete = isRegister ? 'new-password' : 'current-password';
  $('auth-submit-label').textContent = isRegister ? 'إنشاء الحساب' : 'دخول';
  $('auth-sub').textContent = isRegister
    ? 'سجّل حساباً جديداً عشان تقدّمك يتحفظ على كل أجهزتك'
    : 'سجّل دخولك عشان تقدّمك يتحفظ على كل أجهزتك';
}

/** يجهّز الجلسة بعد نجاح الدخول/التسجيل ثم يوجّه للوحة. */
async function completeSignIn(session, { isNew }) {
  GSSync.enabled = true;

  // حساب جديد ولقينا بيانات محلية من استخدام سابق كضيف؟ نرحّلها.
  // السيرفر بيرفض التكرار فمفيش خطر إنها تدوس على تقدّم أحدث.
  if (isNew) {
    const result = await GSSync.migrateLocal();
    if (result && result.migrated) {
      session = await GSSync.me();
    }
  }

  GSSync.applyServerState(session);

  const splash = $('splash');
  splash.classList.add('fade-out');
  setTimeout(() => { location.href = '/dashboard'; }, 400);
}

async function submitAuth(e) {
  e.preventDefault();
  clearAuthError();

  const email = $('auth-email').value.trim();
  const password = $('auth-password').value;
  const name = $('auth-name').value.trim();
  const button = $('splash-start');
  const label = $('auth-submit-label');

  if (authMode === 'register' && name.length < 2) {
    return showAuthError('اكتب اسمك (حرفين على الأقل).');
  }
  if (authMode === 'register' && password.length < 8) {
    return showAuthError('كلمة المرور لازم تكون 8 أحرف على الأقل.');
  }

  button.disabled = true;
  const originalLabel = label.textContent;
  label.textContent = 'لحظة...';

  try {
    const session = authMode === 'register'
      ? await GSSync.register(email, password, name)
      : await GSSync.login(email, password);

    // الرد بيرجّع الحساب بس — بنجيب الحالة الكاملة بعده
    const full = await GSSync.me();
    await completeSignIn(full, { isNew: authMode === 'register' });
  } catch (err) {
    button.disabled = false;
    label.textContent = originalLabel;

    const serverMessage = err.payload && err.payload.error;
    if (err.status === 409) {
      showAuthError('الإيميل ده مسجّل بالفعل — جرّب تسجيل الدخول.');
    } else if (err.status === 401) {
      showAuthError('الإيميل أو كلمة المرور غير صحيحة.');
    } else if (err.status === 400 && err.payload && err.payload.details) {
      showAuthError(err.payload.details[0].message);
    } else if (serverMessage) {
      showAuthError(serverMessage);
    } else {
      showAuthError('تعذّر الاتصال بالسيرفر. تأكد إنه شغال وحاول تاني.');
    }
  }
}

// ── SPLASH / ONBOARDING ────────────────────────────────────────
async function initSplash() {
  const splash = $('splash');

  const routeTrack = PATH_TO_TRACK[location.pathname];
  const onDashboard = location.pathname === '/dashboard';
  const onInnerPage = !!routeTrack || onDashboard;

  // في كل الحالات بنسأل السيرفر الأول: هو ده مصدر الحقيقة للجلسة
  let session = null;
  try {
    session = await GSSync.me();
    GSSync.enabled = true;
    GSSync.applyServerState(session);
  } catch (err) {
    if (err.status !== 401) {
      console.warn('تعذّر الوصول للسيرفر — الموقع هيشتغل بالبيانات المحلية:', err.message);
      // السيرفر واقع بس عندنا نسخة محلية؟ نكمل بيها بدل ما نطرد الطالب
      GSSync.enabled = false;
      session = GS.student.name ? { name: GS.student.name } : null;
    }
  }

  // صفحة داخلية من غير جلسة → رجوع للبداية
  if (onInnerPage) {
    if (!session) { location.replace('/'); return; }
    splash.style.display = 'none';
    if (routeTrack) openTrack(routeTrack);
    else initDashboard();
    return;
  }

  // صفحة البداية ومعانا جلسة → على طول للوحة
  if (session) { location.replace('/dashboard'); return; }

  // ── نموذج الدخول ──
  setAuthMode('login');

  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => setAuthMode(tab.dataset.authTab));
  });

  $('auth-form').addEventListener('submit', submitAuth);
  $('auth-email').focus();
}
