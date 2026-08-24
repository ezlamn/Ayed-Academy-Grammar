/* ================================================================
   QUIZ.JS — Comprehensive Unit Quiz (Big Quiz Modal)
   Grammar Strategies — Ayed Academy
   ================================================================ */

// ── OPEN BIG QUIZ ─────────────────────────────────────────────
function openBigQuiz() {
  const unit = GS.UNITS[GS.currentUnit];
  const quizzes = unit.page.quizzes || [];
  if (quizzes.length === 0) return;

  GS.quizState = { answers: {}, submitted: false, currentStep: 0 };
  $('quiz-unit-badge').textContent = unit.page.tag;
  $('quiz-counter').textContent = 'سؤال 1 من ' + quizzes.length;

  renderQuizStep();

  $('quiz-footer').style.display = 'none';
  $('close-quiz').onclick = () => $('quiz-overlay').classList.add('hidden');
  $('quiz-overlay').classList.remove('hidden');
}

// ── RENDER QUIZ STEP ──────────────────────────────────────────
function renderQuizStep() {
  const unit = GS.UNITS[GS.currentUnit];
  const quizzes = unit.page.quizzes || [];
  const i = GS.quizState.currentStep;
  const q = quizzes[i];
  const letters = ['A', 'B', 'C', 'D'];
  const isLast = i === quizzes.length - 1;
  const pct = Math.round((i / quizzes.length) * 100);

  let html = `
    <div class="quiz-step-container">
      <div class="quiz-step-progress" style="margin-bottom:1.5rem;">
        <div class="q-prog-bar" style="height:8px; background:var(--border); border-radius:10px; overflow:hidden; margin-bottom:0.5rem;">
          <div class="q-prog-fill" style="height:100%; width:${pct}%; background:var(--gold); transition:width 0.4s;"></div>
        </div>
        <div class="q-prog-text" style="font-size:0.85rem; color:var(--text-muted); font-weight:700;">سؤال ${i + 1} من ${quizzes.length}</div>
      </div>
      <div class="quiz-q-card animate-in" style="margin-bottom:2rem; animation:fadeUp 0.3s;">
        ${q.audioUrl ? `
          <div class="listening-audio-wrap">
            <span class="listening-audio-label">🎧 استمع للمقطع أولاً</span>
            <audio controls src="${q.audioUrl}"></audio>
          </div>
        ` : ''}
        <div class="quiz-q-text">${q.q}</div>
        <div class="quiz-opts-grid">
          ${q.opts.map((o, oi) => {
            const isSelected = GS.quizState.answers[i] === oi;
            return `
              <button class="q-opt ${isSelected ? 'selected' : ''}" data-oi="${oi}" dir="ltr" style="text-align:left;">
                <span class="q-opt-letter">${letters[oi]}</span>${o}
              </button>
            `;
          }).join('')}
        </div>
      </div>
      <div class="quiz-step-actions" style="display:flex; justify-content:space-between; gap:1rem;">
        <button class="btn" style="padding:0.75rem 1.5rem; background:var(--surface2); border:1px solid var(--border); border-radius:var(--r-pill); font-weight:800; color:var(--text-sec);" onclick="prevQuizStep()" ${i === 0 ? 'disabled' : ''}>السابق</button>
        <button class="btn" style="padding:0.75rem 2rem; background:linear-gradient(135deg,var(--gold),#e09212); border-radius:var(--r-pill); font-weight:800; color:var(--navy); opacity:${GS.quizState.answers[i] === undefined ? '0.5' : '1'}; pointer-events:${GS.quizState.answers[i] === undefined ? 'none' : 'auto'}; transition:all 0.3s;" onclick="${isLast ? 'submitBigQuiz()' : 'nextQuizStep()'}" id="btn-next-step">
          ${isLast ? 'إنهاء الاختبار ✓' : 'التالي ➔'}
        </button>
      </div>
    </div>
  `;

  $('quiz-body').innerHTML = html;

  document.querySelectorAll('.q-opt').forEach(btn => {
    btn.addEventListener('click', function () {
      const oi = parseInt(this.dataset.oi);
      GS.quizState.answers[i] = oi;
      document.querySelectorAll('.q-opt').forEach(b => b.classList.remove('selected'));
      this.classList.add('selected');
      const nxt = document.getElementById('btn-next-step');
      nxt.style.opacity = '1';
      nxt.style.pointerEvents = 'auto';
    });
  });
}

window.nextQuizStep = function () {
  GS.quizState.currentStep++;
  renderQuizStep();
};
window.prevQuizStep = function () {
  GS.quizState.currentStep--;
  renderQuizStep();
};

// ── SUBMIT & SCORE ────────────────────────────────────────────
function submitBigQuiz() {
  const unit = GS.UNITS[GS.currentUnit];
  const quizzes = unit.page.quizzes || [];
  GS.quizState.submitted = true;

  let correct = 0;
  let html = '';
  const letters = ['A', 'B', 'C', 'D'];

  quizzes.forEach((q, qi) => {
    const ans = GS.quizState.answers[qi];
    // الداتا بتستخدم `c` — نسيب `correct` كاحتياط لأي سجل قديم
    const rightIndex = typeof q.c === 'number' ? q.c : q.correct;
    const isRight = ans === rightIndex;
    if (isRight) correct++;

    // تسجيل المحاولة على السيرفر — ده مصدر تحليلات لوحة التحكم
    if (typeof ans === 'number') GSSync.queueAttempt(q.id, ans);

    html += `
      <div class="quiz-q-card" style="margin-bottom:1.5rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
          <span class="quiz-q-num">السؤال ${qi + 1} من ${quizzes.length}</span>
          <span class="quiz-q-result" style="color:var(--${isRight ? 'green' : 'red'})">${isRight ? '✅ صحيحة' : '❌ خاطئة'}</span>
        </div>
        ${q.audioUrl ? `
          <div class="listening-audio-wrap">
            <span class="listening-audio-label">🎧 استمع للمقطع</span>
            <audio controls src="${q.audioUrl}"></audio>
          </div>
        ` : ''}
        <div class="quiz-q-text">${q.q}</div>
        <div class="quiz-opts-grid">
          ${q.opts.map((o, oi) => {
            let cls = '';
            if (oi === rightIndex) cls = 'correct';
            else if (oi === ans) cls = 'wrong';
            return `
              <button class="q-opt ${cls}" disabled dir="ltr" style="text-align:left;">
                <span class="q-opt-letter">${letters[oi]}</span>${o}
              </button>
            `;
          }).join('')}
        </div>
        <div class="quiz-expl show">
          <div class="expl-text">${q.expl}</div>
        </div>
      </div>
    `;
  });

  const pct = quizzes.length > 0 ? Math.round((correct / quizzes.length) * 100) : 100;

  if (pct >= 60 && !GS.student.completedUnits.includes(unit.id)) {
    GS.student.completedUnits.push(unit.id);
    localStorage.setItem('gs_completed', JSON.stringify(GS.student.completedUnits));
    GSSync.markUnitComplete(unit.id);
    buildUnitsNav();
  }

  const msg = pct >= 80 ? 'ممتاز! أنت تتقن هذا الدرس 🏆' : pct >= 60 ? 'جيد جداً! 👍' : 'راجع الدرس وحاول مجدداً 🔄';

  const scoreHtml = `
    <div class="score-screen" style="margin-bottom:2.5rem;">
      <div class="score-donut-wrap">
        <div class="score-donut" style="--pct:${pct}%">
          <div class="score-num">${pct}%</div>
        </div>
      </div>
      <div class="score-msg">${msg}</div>
      <div class="score-sub">${correct} إجابات صحيحة من ${quizzes.length}</div>
      <div class="score-hint" style="color:var(--text-muted); margin-top:1rem; font-size:0.85rem;">انتقل للأسفل لمراجعة الشرح التفصيلي لكل سؤال ↓</div>
    </div>
  `;

  $('quiz-body').innerHTML = scoreHtml + html;
  $('quiz-body').scrollTop = 0;

  if (pct >= 80) {
    launchConfetti();
    FX.correct.currentTime = 0;
    FX.correct.play().catch(e => console.log(e));
  } else {
    FX.wrong.currentTime = 0;
    FX.wrong.play().catch(e => console.log(e));
  }

  if (correct > 0) {
    const gainedXP = correct * 15;
    addXP(gainedXP, { clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 });
  }

  updateProgress();
}
