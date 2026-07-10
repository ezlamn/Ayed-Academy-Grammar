/* ================================================================
   APP.JS — Main Entry Point: boot() & initApp()
   Grammar Strategies — Ayed Academy
   ================================================================ */

// ── BOOTSTRAP ──────────────────────────────────────────────────
async function boot() {
  try {
    const res = await fetch('/api/units');
    if (!res.ok) throw new Error('API server returned error');
    GS.ALL_DATA = await res.json();
    initSplash();
  } catch (err) {
    console.warn('Failed to connect to local API server, trying static fallback...', err);
    try {
      const res = await fetch('data/db.json');
      if (!res.ok) throw new Error('Static db.json not found');
      GS.ALL_DATA = await res.json();
      initSplash();
    } catch (fallbackErr) {
      console.error('All data loading attempts failed:', fallbackErr);
      alert('فشل تحميل البيانات! تأكد من تشغيل السيرفر محلياً أو وجود ملف data/db.json');
    }
  }
}

// ── INIT APP ───────────────────────────────────────────────────
function initApp() {
  const name = GS.student.name;
  $('student-name-display').textContent = name;
  $('student-avatar').textContent = name.charAt(0);

  // Create Streak chip in the topbar (left of student chip)
  if (!$('nb-streak-chip')) {
    const chip = $('student-chip');
    if (chip && chip.parentNode) {
      const streakEl = document.createElement('div');
      streakEl.id = 'nb-streak-chip';
      streakEl.className = 'nb-streak-chip';
      streakEl.innerHTML = '🔥 <span>0</span>';
      chip.parentNode.insertBefore(streakEl, chip);
    }
  }

  // Create XP / Level display next to name if it doesn't exist
  if (!$('student-xp-display')) {
    const xpEl = document.createElement('div');
    xpEl.id = 'student-xp-display';
    xpEl.className = 'nb-xp-display';
    $('student-name-display').parentNode.appendChild(xpEl);
  }
  initDailyStreak();
  updateXPUI();

  // Update breadcrumb track name
  const trackNames = { grammar: 'الجرامر', reading: 'الريدينق', listening: 'الليسينيق', tests: 'النماذج' };
  $('bc-strat').textContent = trackNames[GS.currentTrack] || GS.currentTrack;

  buildUnitsNav();

  if (GS.UNITS.length > 0) {
    loadUnit(0);
  } else {
    const emptyMessages = {
      reading: 'سيتم إضافة استراتيجيات القراءة قريباً. تابعنا للمزيد!',
      tests: '50 نموذج اختبار شامل قيد التجهيز. تابعنا!',
    };
    const msg = emptyMessages[GS.currentTrack] || 'لا يوجد محتوى بعد. قريباً، سيتم إضافة المحتوى من لوحة التحكم.';
    $('page-content').innerHTML = `
      <div class="empty-track-msg">
        <div class="empty-icon">🛠️</div>
        <h2>قيد الإعداد</h2>
        <p>${msg}</p>
        <p style="margin-top:1rem;color:var(--gold);font-weight:700;">يمكنك إضافة المحتوى من لوحة التحكم الآن.</p>
      </div>
    `;
  }

  // initApp() runs every time a track is opened from the dashboard, but the
  // listeners below must only ever be attached once — re-binding stacks
  // duplicate handlers (e.g. next/prev unit jumping 2 units per click).
  if (!GS.ui.listenersBound) {
    GS.ui.listenersBound = true;
    bindTopbar();
    bindNotes();
    bindTools();

    // Init new UI features (dark mode + FAB)
    initNewFeatures();
  }
}

// ── START ──────────────────────────────────────────────────────
boot();
