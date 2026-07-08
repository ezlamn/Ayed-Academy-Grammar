function initSplash() {
  const splash = $('splash');
  
  // Tabs
  const tabLogin = $('tab-login');
  const tabGuest = $('tab-guest');
  const loginForm = $('auth-login-form');
  const guestForm = $('auth-guest-form');

  // Login inputs (Premium)
  const loginEmail = $('login-email');
  const loginPassword = $('login-password');
  const btnLogin = $('splash-btn-login');
  const loginError = $('login-error');

  // Guest inputs
  const guestName = $('guest-name');
  const btnGuest = $('splash-btn-guest');

  // Hardcoded premium account credentials
  const PREMIUM_EMAIL = 'student@ayed.com';
  const PREMIUM_PASS = '123456';

  // Check if someone is already logged in
  if (GS.student.name && localStorage.getItem('gs_auth_type')) {
    splash.style.display = 'none';
    initDashboard();
    return;
  }

  // Auto-fill from previous session if exists
  const lastUser = localStorage.getItem('gs_last_email');
  if (lastUser) {
    loginEmail.value = lastUser;
  }

  // ── TAB SWITCHING ──
  if (tabLogin && tabGuest) {
    tabLogin.addEventListener('click', () => {
      tabLogin.classList.add('active');
      tabGuest.classList.remove('active');
      loginForm.classList.remove('hidden');
      guestForm.classList.add('hidden');
    });
    tabGuest.addEventListener('click', () => {
      tabGuest.classList.add('active');
      tabLogin.classList.remove('active');
      guestForm.classList.remove('hidden');
      loginForm.classList.add('hidden');
    });
  }

  function goToDashboard() {
    splash.classList.add('fade-out');
    setTimeout(() => {
      splash.style.display = 'none';
      initDashboard();
    }, 700);
  }

  const shakeElement = (el) => {
    el.classList.remove('shake');
    void el.offsetWidth; // trigger reflow
    el.classList.add('shake');
  };

  // Guest login logic
  btnGuest.addEventListener('click', async () => {
    const name = guestName.value.trim();

    if (!name) {
      shakeElement(btnGuest);
      return;
    }

    // Set as guest
    localStorage.setItem('gs_auth_type', 'guest');
    localStorage.setItem('gs_is_guest', 'true');
    GS.student.name = name;
    if (window.saveProfileState) await window.saveProfileState();
    
    goToDashboard();
  });

  // Premium Login logic
  btnLogin.addEventListener('click', async () => {
    const email = loginEmail.value.trim().toLowerCase();
    const pass = loginPassword.value;

    if (!email || !pass) {
      loginError.style.display = 'block';
      loginError.textContent = '❌ يرجى إدخال البريد الإلكتروني وكلمة المرور.';
      shakeElement(btnLogin);
      return;
    }

    // Check credentials
    if (email !== PREMIUM_EMAIL || pass !== PREMIUM_PASS) {
      loginError.style.display = 'block';
      loginError.textContent = '❌ البريد الإلكتروني أو كلمة المرور غير صحيحة.';
      shakeElement(btnLogin);
      return;
    }

    // Login success
    loginError.style.display = 'none';
    localStorage.setItem('gs_auth_type', 'premium');
    localStorage.setItem('gs_is_guest', 'false');
    localStorage.setItem('gs_last_email', email);
    GS.student.name = 'مشترك مميز'; // Or allow them to change their name later
    if (window.saveProfileState) await window.saveProfileState();

    goToDashboard();
  });

  // Keyboard support
  [loginEmail, loginPassword].forEach(el => {
    el.addEventListener('keydown', e => { if (e.key === 'Enter') btnLogin.click(); });
  });
  guestName.addEventListener('keydown', e => { if (e.key === 'Enter') btnGuest.click(); });
}
