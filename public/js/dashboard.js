/* ================================================================
   DASHBOARD.JS — Main Dashboard (Track Selection)
   Grammar Strategies — Ayed Academy
   ================================================================ */

// ── TRACK ROUTES ───────────────────────────────────────────────
// Each track has its own URL; the dashboard links to them and boot()
// opens the right track when the page loads on one of these paths.
const TRACK_ROUTES = { grammar: '/grammar', reading: '/reading', listening: '/listening', tests: '/mock-exam' };
const PATH_TO_TRACK = { '/grammar': 'grammar', '/reading': 'reading', '/listening': 'listening', '/mock-exam': 'tests' };

function openTrack(track) {
  if (track === 'tests') {
    if (window.MockExam) {
      window.MockExam.start();
    } else {
      alert("نظام الاختبارات قيد التحميل...");
    }
    return;
  }

  GS.currentTrack = track;
  GS.UNITS = GS.ALL_DATA[track] || [];
  GS.currentUnit = 0;

  $('main-dashboard').classList.add('hidden');
  $('app').classList.remove('hidden');
  initApp();
}

// ── DASHBOARD ──────────────────────────────────────────────────
function initDashboard() {
  $('main-dashboard').classList.remove('hidden');

  // Show personalized greeting
  const dashLogo = document.querySelector('.dash-logo');
  if (dashLogo) dashLogo.textContent = `📘 أهلاً ${GS.student.name}! — عايد أكاديمي`;

  // Show unit count badges on cards
  document.querySelectorAll('.dash-card').forEach(card => {
    const track = card.dataset.track;
    const count = (GS.ALL_DATA[track] || []).length;
    const existing = card.querySelector('.dash-count-badge');
    if (existing) existing.remove();
    const badge = document.createElement('div');
    badge.className = 'dash-count-badge';
    badge.textContent = count > 0 ? `${count} وحدة متاحة` : 'قريباً';
    card.appendChild(badge);
  });

  document.querySelectorAll('.dash-card').forEach(card => {
    card.onclick = function () {
      const track = this.dataset.track;
      location.href = TRACK_ROUTES[track] || '/';
    };
  });

  if (window.SmartAnalytics) {
    window.SmartAnalytics.renderDashboardStats();
  }

  $('dash-logout').onclick = () => {
    localStorage.removeItem('gs_student_name');
    location.href = '/';
  };

}
