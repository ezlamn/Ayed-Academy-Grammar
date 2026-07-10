/* ================================================================
   AUTH.JS — Splash Screen (Guest Entry)
   Grammar Strategies — Ayed Academy
   ================================================================ */

// ── SPLASH / ONBOARDING ────────────────────────────────────────
function initSplash() {
  const splash = $('splash');
  const nameInput = $('student-name-input');
  const startGuestBtn = $('splash-start');

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

  nameInput.addEventListener('keydown', e => { if (e.key === 'Enter') startGuestBtn.click(); });
}
