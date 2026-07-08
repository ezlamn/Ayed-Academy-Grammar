/* ================================================================
   APP.JS — Main Entry Point: boot() & initApp()
   Grammar Strategies — Ayed Academy
   ================================================================ */

// ── SPLASH INTRO VIDEO ─────────────────────────────────────────
function populateSplashVideo() {
  const slot = $('splash-video-slot');
  if (!slot) return;
  const url = GS.ALL_DATA && GS.ALL_DATA.config && GS.ALL_DATA.config.introVideoUrl;
  if (!url || typeof getVideoEmbed !== 'function') { slot.innerHTML = ''; return; }
  const embed = getVideoEmbed(url);
  if (!embed) { slot.innerHTML = ''; return; }
  slot.innerHTML = `
    <div class="splash-video-wrap">
      <span class="splash-video-badge">▶ شاهد</span>
      ${embed}
    </div>`;
}

// ── BOOTSTRAP ──────────────────────────────────────────────────
async function boot() {
  // 1. Init DataService (IndexedDB + API Abstraction)
  try {
    await window.dataService.init();
    await window.loadStudentState();
  } catch (dbErr) {
    console.error('Failed to initialize local database:', dbErr);
  }

  // Config and intro is now handled purely frontend
  initSplash();
}

// ── INIT APP ───────────────────────────────────────────────────
function initApp() {
  const name = GS.student.name;
  $('student-name-display').textContent = name;
  // Avatar: show first letter of name (element has gradient bg from CSS)
  const avatarEl = $('student-avatar');
  avatarEl.textContent = '';  // clear any icon
  avatarEl.textContent = name.charAt(0).toUpperCase();

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
  const trackNames = { 
    reading: 'فهم المقروء', 
    grammar: 'التراكيب (Grammar)', 
    listening: 'الاستماع', 
    composition: 'التحليل الكتابي',
    vocab: 'بنك المفردات',
    tests: 'نماذج الاختبارات' 
  };
  $('bc-strat').textContent = trackNames[GS.currentTrack] || GS.currentTrack;

  buildUnitsNav();

  if (GS.UNITS.length > 0) {
    loadUnit(0);
  } else {
    const emptyMessages = {
      reading: 'سيتم إضافة قطع القراءة (Reading Comprehension) قريباً!',
      composition: 'سيتم إضافة وحدات التحليل الكتابي وعلامات الترقيم قريباً!',
      vocab: 'جاري تجهيز بنك المفردات التفاعلي بطريقة التكرار المتباعد (SRS)...',
      tests: '50 نموذج اختبار شامل قيد التجهيز. تابعنا!',
    };
    const msg = emptyMessages[GS.currentTrack] || 'لا يوجد محتوى بعد. قريباً، سيتم إضافة المحتوى من لوحة التحكم.';
    $('page-content').innerHTML = `
      <div class="empty-track-msg">
        <div class="empty-icon">🛠️</div>
        <h2>قيد الإعداد</h2>
        <p>${msg}</p>
        <p style="margin-top:1rem;color:var(--gold);font-weight:700;">ترقب التحديثات القادمة.</p>
      </div>
    `;
  }

  bindTopbar();
  bindNotes();
  bindTools();

  // Init new UI features (dark mode + FAB)
  initNewFeatures();
}

// ── START ──────────────────────────────────────────────────────
boot();
