/* ================================================================
   AUTH.JS — Firebase Authentication, Splash Screen & Cloud Sync
   Grammar Strategies — Ayed Academy
   ================================================================ */

// ── SPLASH / ONBOARDING ────────────────────────────────────────
function initSplash() {
  const splash = $('splash');
  const nameInput = $('student-name-input');
  const startGuestBtn = $('splash-start');
  const emailInput = $('student-email');
  const passInput = $('student-password');
  const loginBtn = $('splash-start-login');

  const tabLogin = $('tab-login');
  const tabGuest = $('tab-guest');
  const formLogin = $('auth-login-form');
  const formGuest = $('auth-guest-form');

  tabLogin.onclick = () => {
    tabLogin.classList.add('active');
    tabGuest.classList.remove('active');
    formLogin.classList.remove('hidden');
    formGuest.classList.add('hidden');
  };

  tabGuest.onclick = () => {
    tabGuest.classList.add('active');
    tabLogin.classList.remove('active');
    formGuest.classList.remove('hidden');
    formLogin.classList.add('hidden');
  };

  if (GS.student.name) nameInput.value = GS.student.name;

  function goToDashboard() {
    splash.classList.add('fade-out');
    setTimeout(() => {
      splash.style.display = 'none';
      initDashboard();
    }, 700);
  }

  startGuestBtn.addEventListener('click', () => {
    const name = nameInput.value.trim() || 'طالب';
    GS.student.name = name;
    localStorage.setItem('gs_student_name', name);
    goToDashboard();
  });

  loginBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    const pass = passInput.value;
    if (!email || !pass) {
      alert("الرجاء إدخال البريد الإلكتروني وكلمة المرور");
      return;
    }
    try {
      if (!window.FirebaseAPI) throw new Error("Firebase SDK not loaded.");

      const { signInWithEmailAndPassword, createUserWithEmailAndPassword } = window.FirebaseAPI;
      const auth = window.FirebaseAuth;

      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, email, pass);
      } catch (err) {
        if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
          userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        } else {
          throw err;
        }
      }
      GS.student.name = email.split('@')[0];
      await loadProgressFromCloud(userCredential.user.uid);
      goToDashboard();
    } catch (err) {
      console.error(err);
      alert("خطأ في تسجيل الدخول: " + err.message);
    }
  });

  nameInput.addEventListener('keydown', e => { if (e.key === 'Enter') startGuestBtn.click(); });
  passInput.addEventListener('keydown', e => { if (e.key === 'Enter') loginBtn.click(); });
}

// ── CLOUD SYNC ────────────────────────────────────────────────
async function loadProgressFromCloud(uid) {
  if (!window.FirebaseAPI || !window.FirebaseDB) return;
  const { doc, getDoc } = window.FirebaseAPI;
  const docRef = doc(window.FirebaseDB, "users", uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    if (data.xp) {
      GS.student.xp = data.xp;
      GS.student.level = data.level || 1;
      updateXPUI();
    }
  }
}

async function syncProgressToCloud() {
  if (!window.FirebaseAuth || !window.FirebaseAuth.currentUser) return;
  if (!window.FirebaseAPI || !window.FirebaseDB) return;
  const uid = window.FirebaseAuth.currentUser.uid;
  const { doc, setDoc } = window.FirebaseAPI;

  await setDoc(doc(window.FirebaseDB, "users", uid), {
    xp: GS.student.xp,
    level: GS.student.level,
    name: GS.student.name,
    lastSynced: new Date().toISOString()
  }, { merge: true });
}
