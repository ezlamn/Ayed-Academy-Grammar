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
    showToast(`🏆 مبروك! وصلت للمستوى ${newLevel}!`);
  }

  localStorage.setItem('gs_xp', GS.student.xp);
  syncProgressToCloud();
  localStorage.setItem('gs_level', GS.student.level);

  updateXPUI();

  if (event) {
    showFloatingXP(amount, event.clientX, event.clientY);
  }
}

function updateXPUI() {
  const xpDisplay = $('student-xp-display');
  if (xpDisplay) {
    xpDisplay.innerHTML = `<span style="color:var(--gold)">⭐</span> ${GS.student.xp} XP`;
  }
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
  showToast('تمت المراجعة بنجاح', `تمت جدولة مراجعة الكلمة بعد ${card.interval} يوم`, 'success');
  addXP(2, null);
};
