/* ================================================================
   GAMIFICATION.JS — XP System, Levels, Floating XP & SRS
   Grammar Strategies — Ayed Academy
   ================================================================ */

// ── GAMIFICATION LOGIC ────────────────────────────────────────
function addXP(amount, event) {
  GS.student.xp += amount;

  // Level up logic: every 100 XP = 1 level
  const newLevel = Math.floor(GS.student.xp / 100) + 1;
  if (newLevel > GS.student.level) {
    GS.student.level = newLevel;
    showToast('🏆', `مبروك! وصلت للمستوى ${newLevel}!`, 't-success');
    if (typeof launchConfetti === 'function') launchConfetti();
  }

  localStorage.setItem('gs_xp', GS.student.xp);
  localStorage.setItem('gs_level', GS.student.level);
  GSSync.queueState({ xp: GS.student.xp, level: GS.student.level });

  updateXPUI();

  if (event) {
    showFloatingXP(amount, event.clientX, event.clientY);
  }
}

function xpIntoLevel() {
  const into = GS.student.xp % 100;
  return { into, pct: into }; // 100 XP per level → into == pct
}

function updateXPUI() {
  const xpDisplay = $('student-xp-display');
  if (xpDisplay) {
    const { pct } = xpIntoLevel();
    xpDisplay.innerHTML = `
      <span class="nb-lvl-badge">LV ${GS.student.level}</span>
      <span class="nb-xp-num">⭐ ${GS.student.xp}</span>
      <span class="nb-lvl-bar"><span class="nb-lvl-bar-fill" style="width:${pct}%"></span></span>`;
  }
  const streakChip = $('nb-streak-chip');
  if (streakChip) {
    streakChip.innerHTML = `🔥 <span>${GS.student.streak}</span>`;
    streakChip.title = `سلسلة الأيام: ${GS.student.streak} • الأفضل: ${GS.student.bestStreak}`;
  }
}

// ── DAILY STREAK ──────────────────────────────────────────────
function initDailyStreak() {
  const today = new Date().toDateString();
  const last = GS.student.lastActive;
  if (last === today) { /* already counted today */ }
  else {
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (last === yesterday) GS.student.streak += 1;       // continued
    else GS.student.streak = 1;                            // reset / first day
    GS.student.lastActive = today;
    if (GS.student.streak > GS.student.bestStreak) GS.student.bestStreak = GS.student.streak;
    localStorage.setItem('gs_streak', GS.student.streak);
    localStorage.setItem('gs_best_streak', GS.student.bestStreak);
    localStorage.setItem('gs_last_active', today);
    GSSync.queueState({
      streak: GS.student.streak,
      bestStreak: GS.student.bestStreak,
      lastActive: today,
    });
    if (GS.student.streak > 1) {
      setTimeout(() => showToast('🔥', `سلسلة ${GS.student.streak} أيام متتالية! استمر!`, 't-success'), 800);
    }
  }
  updateXPUI();
}

// ── ANSWER COMBO (consecutive correct answers) ────────────────
function registerAnswer(correct, event) {
  if (correct) {
    GS.student.combo = (GS.student.combo || 0) + 1;
    const combo = GS.student.combo;

    // Persist best combo for the badge system
    const bestCombo = parseInt(localStorage.getItem('gs_best_combo') || '0', 10);
    if (combo > bestCombo) localStorage.setItem('gs_best_combo', combo);

    // Bonus XP that scales with the combo, capped sensibly
    const bonus = Math.min(combo - 1, 5) * 2;
    addXP(10 + bonus, event);

    if (window.NBSound) (combo >= 2 ? NBSound.combo(combo) : NBSound.correct());

    const chip = $('nb-streak-chip');
    if (chip) { chip.classList.remove('pulse'); void chip.offsetWidth; chip.classList.add('pulse'); }

    if (combo === 3) showToast('⚡', 'كومبو ×3! إجابتان متتاليتان صحيحتان!', 't-success');
    else if (combo === 5) { showToast('🌟', 'كومبو ×5 رهيب!', 't-success'); if (typeof launchConfetti === 'function') launchConfetti(); }
    else if (combo > 0 && combo % 10 === 0) { showToast('🚀', `كومبو ×${combo}! أنت بطل!`, 't-success'); if (typeof launchConfetti === 'function') launchConfetti(); }
  } else {
    GS.student.combo = 0;
    if (window.NBSound) NBSound.wrong();
  }
  if (window.checkBadges) checkBadges();
}

function showFloatingXP(amount, x, y) {
  const el = document.createElement('div');
  el.className = 'floating-xp';
  el.textContent = `+${amount} XP`;
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}

// ── SRS (Spaced Repetition System) ────────────────────────────
window.processSRS = function(word, quality) {
  let srs = JSON.parse(localStorage.getItem("gs_srs") || "{}");
  let card = srs[word] || { interval: 1, repetition: 0, efactor: 2.5 };
  let q = quality === "hard" ? 1 : quality === "good" ? 3 : 5;

  if (q >= 3) {
    if (card.repetition === 0) card.interval = 1;
    else if (card.repetition === 1) card.interval = 6;
    else card.interval = Math.round(card.interval * card.efactor);
    card.repetition += 1;
  } else {
    card.repetition = 0;
    card.interval = 1;
  }
  card.efactor = card.efactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (card.efactor < 1.3) card.efactor = 1.3;
  card.nextReview = Date.now() + card.interval * 86400000;

  srs[word] = card;
  localStorage.setItem("gs_srs", JSON.stringify(srs));
  GSSync.queueState({ srs });
  showToast('تمت المراجعة بنجاح', `تمت جدولة مراجعة الكلمة بعد ${card.interval} يوم`, 'success');
  addXP(2, null);
};
