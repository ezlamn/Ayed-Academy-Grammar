/* ================================================================
   UI.JS — Toast Notifications, Confetti, Dark Mode & FAB
   Grammar Strategies — Ayed Academy
   ================================================================ */

// ── TOAST ─────────────────────────────────────────────────────
let _toastTimer;
function showToast(icon = '', msg = '', cls = '') {
  const el = $('toast');
  el.className = 'toast ' + cls;
  // icon may be an icon name (e.g. 'trophy') or a legacy emoji — both render as SVG
  if (window.AyIcon && AyIcon.ICONS[icon]) {
    $('toast-icon').innerHTML = AyIcon.svg(icon);
  } else if (window.AyIcon) {
    $('toast-icon').innerHTML = AyIcon.iconify(icon);
  } else {
    $('toast-icon').textContent = icon;
  }
  $('toast-msg').textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.add('hidden'), 3200);
}

// ── CONFETTI ──────────────────────────────────────────────────
function launchConfetti() {
  const canvas = $('confetti-canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  const colors = ['#F5A623', '#FFD07A', '#06D6A0', '#00B4D8', '#7C3AED', '#EF233C', '#fff'];
  const ps = Array.from({ length: 120 }, () => ({
    x: Math.random() * canvas.width, y: -20,
    r: Math.random() * 7 + 3, d: Math.random() * 80 + 40,
    c: colors[Math.floor(Math.random() * colors.length)],
    t: Math.random() * 10 - 10, ta: 0, ts: Math.random() * 0.12 + 0.05
  }));
  let frame = 0;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    frame++;
    let alive = false;
    ps.forEach(p => {
      ctx.beginPath();
      ctx.lineWidth = p.r / 2;
      ctx.strokeStyle = p.c;
      ctx.moveTo(p.x + p.t + p.r / 4, p.y);
      ctx.lineTo(p.x + p.t, p.y + p.t + p.r / 4);
      ctx.stroke();
      p.ta += p.ts;
      p.y += (Math.cos(frame / p.d) + 3 + p.r / 2) * 0.9;
      p.t = Math.sin(p.ta) * 12;
      if (p.y < canvas.height + 20) alive = true;
    });
    if (alive) requestAnimationFrame(draw);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  draw();
}

// ── NEW FEATURES: Dark Mode, Scroll-to-Top FAB ────────────────
function initNewFeatures() {
  // 1. Dark Mode — null-safe (admin.html doesn't have dark-toggle)
  const darkToggle = $('dark-toggle');
  const savedTheme = localStorage.getItem('gs_theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    darkToggle.innerHTML = AyIcon.svg('sun');
  }

  darkToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    if (document.body.classList.contains('dark-mode')) {
      localStorage.setItem('gs_theme', 'dark');
      darkToggle.innerHTML = AyIcon.svg('sun');
    } else {
      localStorage.setItem('gs_theme', 'light');
      darkToggle.innerHTML = AyIcon.svg('moon');
    }
  });

}
