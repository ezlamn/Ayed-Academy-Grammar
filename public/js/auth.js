/* ================================================================
   AUTH.JS — Splash Screen (Guest Entry)
   Grammar Strategies — Ayed Academy
   ================================================================ */

// ── SPLASH / ONBOARDING ────────────────────────────────────────
function initSplash() {
  const splash = $('splash');
  const nameInput = $('student-name-input');
  const startGuestBtn = $('splash-start');

  const routeTrack = PATH_TO_TRACK[location.pathname];
  const onDashboard = location.pathname === '/dashboard';

  // Inner pages (/dashboard or a track) — the splash only lives on '/'
  if (routeTrack || onDashboard) {
    if (!GS.student.name) { location.replace('/'); return; }
    splash.style.display = 'none';
    if (routeTrack) openTrack(routeTrack);
    else initDashboard();
    return;
  }

  // Welcome page ('/')
  if (GS.student.name) nameInput.value = GS.student.name;

  startGuestBtn.addEventListener('click', () => {
    const name = nameInput.value.trim() || 'طالب';
    GS.student.name = name;
    localStorage.setItem('gs_student_name', name);
    splash.classList.add('fade-out');
    setTimeout(() => { location.href = '/dashboard'; }, 400);
  });

  nameInput.addEventListener('keydown', e => { if (e.key === 'Enter') startGuestBtn.click(); });
}
