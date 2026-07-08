/* ================================================================
   DASHBOARD.JS — Main Dashboard (Track Selection) + User Dashboard
   Grammar Strategies — Ayed Academy  [v5]
   ================================================================ */

// ── DASHBOARD ──────────────────────────────────────────────────
function getRecommendedFocus() {
  const data = (window.SmartAnalytics && window.SmartAnalytics.data) ? window.SmartAnalytics.data : {};
  // STEP Test Weights
  const weights = {
    reading: 0.40,
    grammar: 0.30,
    listening: 0.20,
    composition: 0.10
  };

  const scores = {
    reading: data.reading?.score || 0,
    grammar: data.grammar?.score || 0,
    listening: data.listening?.score || 0,
    composition: data.composition?.score || 0
  };
  
  // Calculate the "Weighted Gap" (how much potential score is lost here)
  // Weighted Gap = (100 - Score) * Weight
  // The track with the highest Weighted Gap is the most urgent to study.
  let urgentTrack = 'reading';
  let maxGap = -1;

  for (const track in weights) {
    const gap = (100 - scores[track]) * weights[track];
    if (gap > maxGap) {
      maxGap = gap;
      urgentTrack = track;
    }
  }

  const trackNames = { reading: 'فهم المقروء', grammar: 'التراكيب (Grammar)', listening: 'الاستماع', composition: 'التحليل الكتابي' };
  return trackNames[urgentTrack];
}

function initDashboard() {
  $('main-dashboard').classList.remove('hidden');

  // Show personalized greeting
  const dashTitle = document.querySelector('.dash-title');
  if (dashTitle) dashTitle.innerHTML = `أهلاً ${GS.student.name}! — كتاب STEP التفاعلي الشامل`;

  // Insert Recommendation Banner if it doesn't exist
  let recBanner = document.getElementById('step-rec-banner');
  if (!recBanner) {
    recBanner = document.createElement('div');
    recBanner.id = 'step-rec-banner';
    recBanner.style = `
      background: linear-gradient(135deg, var(--accent) 0%, var(--purple) 100%);
      color: white;
      padding: 1rem 1.5rem;
      border-radius: var(--radius);
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: var(--shadow-md);
    `;
    const dashHeader = document.querySelector('.dash-header');
    if (dashHeader && dashHeader.parentNode) {
      dashHeader.parentNode.insertBefore(recBanner, dashHeader.nextSibling);
    }
  }
  
  const focusTrack = getRecommendedFocus();
  recBanner.innerHTML = `
    <div style="font-size: 2rem;">🎯</div>
    <div>
      <div style="font-size: 0.85rem; opacity: 0.9; margin-bottom: 0.2rem;">توصية النظام الذكي للوصول للدرجة الكاملة:</div>
      <div style="font-size: 1.1rem; font-weight: 700;">ركز تدريبك اليوم على قسم «${focusTrack}»</div>
    </div>
  `;

  // Show unit count badges on cards
  document.querySelectorAll('.dash-card').forEach(async card => {
    const track = card.dataset.track;
    let count = 0;
    if (track === 'mistakes') {
      window.dataService.getMistakes().then(mistakes => {
        count = mistakes ? mistakes.length : 0;
        const badge = document.createElement('div');
        badge.className = 'dash-count-badge';
        badge.textContent = count > 0 ? `${count} أخطاء تحتاج مراجعة` : 'لا توجد أخطاء';
        card.appendChild(badge);
      });
      return;
    }
    
    try {
      if (track !== 'tests' && track !== 'results') {
        const indexData = await window.dataService.getTrackIndex(track);
        count = indexData ? indexData.length : 0;
      }
    } catch(e) {}
    
    const existing = card.querySelector('.dash-count-badge');
    if (existing) existing.remove();
    const badge = document.createElement('div');
    badge.className = 'dash-count-badge';
    badge.textContent = count > 0 ? `${count} وحدة متاحة` : 'قريباً';
    card.appendChild(badge);
  });

  document.querySelectorAll('.dash-card').forEach(card => {
    card.onclick = async function () {
      const track = this.dataset.track;

      // Results track → open User Dashboard
      if (track === 'tests') {
        if (window.MockExam) {
          window.MockExam.start();
        } else {
          alert("نظام الاختبارات قيد التحميل...");
        }
        return;
      }

      if (track === 'mistakes') {
        if (window.openMistakesBox) {
          window.openMistakesBox();
        } else {
          alert("لا توجد أخطاء لمراجعتها حالياً أو النظام غير جاهز.");
        }
        return;
      }

      GS.currentTrack = track;
      // Fetch units index for the chosen track via dataService
      GS.UNITS = await window.dataService.getTrackIndex(track);
      GS.currentUnit = 0;

      $('main-dashboard').classList.add('hidden');
      $('app').classList.remove('hidden');
      initApp();
    };
  });

  // Analytics dashboard button - show user dashboard
  if (window.SmartAnalytics) {
    window.SmartAnalytics.renderDashboardStats();
  }

  $('dash-logout').onclick = () => {
    localStorage.removeItem('gs_current_user');
    // We intentionally keep gs_last_email to pre-fill the login form
    location.reload();
  };

  const btnBack = $('btn-back-dash');
  if (btnBack) {
    btnBack.onclick = () => {
      $('app').classList.add('hidden');
      $('main-dashboard').classList.remove('hidden');
      initDashboard();
    };
  }
}

// ── USER DASHBOARD ────────────────────────────────────────────
function openUserDashboard() {
  const ud = $('user-dashboard');
  ud.classList.remove('hidden');

  // Inject icons for dashboard items
  ud.querySelectorAll('[data-icon]').forEach(el => {
    const iconName = el.getAttribute('data-icon');
    if (window.getIcon) el.innerHTML = window.getIcon(iconName);
  });

  // Set date
  const dateEl = $('ud-date-text');
  if (dateEl) {
    const now = new Date();
    dateEl.textContent = now.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  // Set greeting
  const greetEl = $('ud-greeting');
  if (greetEl) greetEl.textContent = `نتائج أداء ${GS.student.name}`;

  // Get analytics data
  const data = window.SmartAnalytics ? window.SmartAnalytics.data : {};
  const sections = [
    { key: 'grammar',   label: 'الجرامر',     icon: 'grammar',   color: '#4285F4', darkColor: '#8AB4F8' },
    { key: 'reading',   label: 'الريدينق',    icon: 'reading',   color: '#34A853', darkColor: '#81C995' },
    { key: 'listening', label: 'الليسينيق',   icon: 'listening', color: '#EA4335', darkColor: '#F28B82' },
  ];

  // Calculate percentages
  const results = sections.map(s => {
    const d = data[s.key] || { correct: 0, total: 0 };
    return { ...s, correct: d.correct, total: d.total, pct: d.total > 0 ? Math.round((d.correct / d.total) * 100) : 0 };
  });

  const totalCorrect = results.reduce((a, r) => a + r.correct, 0);
  const totalQuestions = results.reduce((a, r) => a + r.total, 0);
  const overallPct = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  // ── Score Cards
  const scoresRow = $('ud-scores-row');
  scoresRow.innerHTML = '';
  results.forEach(r => {
    const isDark = document.body.classList.contains('dark-mode');
    const barColor = isDark ? r.darkColor : r.color;
    scoresRow.innerHTML += `
      <div class="ud-score-card">
        <div class="ud-score-icon ${r.key}">
          <span style="width:24px;height:24px;display:inline-block;">${window.getIcon(r.key === 'grammar' ? 'openBook' : r.key === 'reading' ? 'books' : 'headphones')}</span>
        </div>
        <div class="ud-score-label">${r.label}</div>
        <div class="ud-score-value">${r.pct}%</div>
        <div class="ud-score-max">${r.correct} / ${r.total} سؤال</div>
        <div class="ud-score-bar"><div class="ud-score-bar-fill" style="width:${r.pct}%;background:${barColor};"></div></div>
      </div>
    `;
  });

  // Add overall + level cards
  scoresRow.innerHTML += `
    <div class="ud-score-card">
      <div class="ud-score-icon overall">⭐</div>
      <div class="ud-score-label">الإجمالي</div>
      <div class="ud-score-value">${overallPct}%</div>
      <div class="ud-score-max">${totalCorrect} / ${totalQuestions} سؤال</div>
      <div class="ud-score-bar"><div class="ud-score-bar-fill" style="width:${overallPct}%;background:var(--gold);"></div></div>
    </div>
    <div class="ud-score-card">
      <div class="ud-score-icon level">🎯</div>
      <div class="ud-score-label">المستوى</div>
      <div class="ud-score-value">${GS.student.level}</div>
      <div class="ud-score-max">${GS.student.xp} XP</div>
      <div class="ud-score-bar"><div class="ud-score-bar-fill" style="width:${Math.min(GS.student.xp / 5, 100)}%;background:var(--purple);"></div></div>
    </div>
  `;

  // ── Donut Chart
  const donutEl = $('ud-donut');
  const donutColor = overallPct >= 80 ? 'var(--green)' : overallPct >= 50 ? 'var(--gold)' : 'var(--red)';
  donutEl.style.background = `conic-gradient(${donutColor} 0% ${overallPct}%, var(--surface3) ${overallPct}% 100%)`;
  $('ud-overall-score').textContent = overallPct;

  // Overall message
  const msgEl = $('ud-overall-msg');
  const descEl = $('ud-overall-desc');
  if (overallPct >= 80) {
    msgEl.textContent = 'أداء ممتاز! 🌟';
    descEl.textContent = 'أنت في المسار الصحيح. استمر في التدريب لتحقيق أعلى النتائج.';
  } else if (overallPct >= 50) {
    msgEl.textContent = 'أداء جيد! 👍';
    descEl.textContent = 'أنت تتحسن. ركز على الأقسام الضعيفة لرفع مستواك.';
  } else if (totalQuestions > 0) {
    msgEl.textContent = 'يحتاج تطوير 💪';
    descEl.textContent = 'لا تستسلم! راجع الاستراتيجيات وأعد المحاولة.';
  } else {
    msgEl.textContent = 'ابدأ التدريب!';
    descEl.textContent = 'قم بحل التمارين في كل قسم لتحصل على تقييم شامل لمستواك.';
  }

  // ── Bar Chart
  const barChart = $('ud-bar-chart');
  const maxPct = Math.max(...results.map(r => r.pct), 10);
  barChart.innerHTML = results.map(r => {
    const isDark = document.body.classList.contains('dark-mode');
    const barColor = isDark ? r.darkColor : r.color;
    const barH = Math.max((r.pct / maxPct) * 150, 4);
    return `
      <div class="ud-bar-col">
        <div class="ud-bar" style="height:${barH}px;background:${barColor};">
          <span class="ud-bar-val">${r.pct}%</span>
        </div>
        <span class="ud-bar-label">${r.label}</span>
      </div>
    `;
  }).join('');

  // ── Session History
  const historyList = $('ud-history-list');
  if (historyList) {
    const today = new Date().toLocaleDateString('ar-SA');
    const hasData = totalQuestions > 0;
    if (hasData) {
      historyList.innerHTML = `
        <div class="ud-history-item">
          <div class="ud-history-item-left">
            <div class="ud-history-icon">${window.getIcon ? window.getIcon('target') : '🎯'}</div>
            <div>
              <div class="ud-history-title">آخر جلسة تدريب</div>
              <div class="ud-history-date">${today} — تم الإجابة على ${totalQuestions} سؤال</div>
            </div>
          </div>
          <div class="ud-history-score">${overallPct}%</div>
        </div>
      `;
    } else {
      historyList.innerHTML = '<div style="color:var(--text-muted);font-size:0.85rem;padding:1rem;text-align:center;">لا توجد جلسات تدريب مسجلة بعد.</div>';
    }
  }

  // Motivation message
  const motTitle = $('ud-motivation-title');
  const motSub = $('ud-motivation-sub');
  if (overallPct >= 80) {
    motTitle.textContent = 'أحسنت! أداء رائع! 🏆';
    motSub.textContent = 'أنت من المتميزين. واصل التعلم للوصول إلى 100%.';
  } else if (overallPct >= 50) {
    motTitle.textContent = 'جهد رائع! استمر! ⚡';
    motSub.textContent = 'أنت في المسار الصحيح. كل تدريب يقربك من هدفك.';
  } else {
    motTitle.textContent = 'استمر في التقدم! 💪';
    motSub.textContent = 'كل تدريب يقربك من هدفك. واصل التعلم والممارسة.';
  }

  // ── Sidebar Navigation
  ud.querySelectorAll('.ud-nav-item').forEach(item => {
    item.onclick = function () {
      const section = this.dataset.section;
      ud.querySelectorAll('.ud-nav-item').forEach(i => i.classList.remove('active'));
      this.classList.add('active');
      // For now, all sections show overview
      // Can be extended to show section-specific data
    };
  });

  // ── Back button
  const backBtn = $('ud-back-to-tracks');
  if (backBtn) {
    backBtn.onclick = () => {
      ud.classList.add('hidden');
      $('main-dashboard').classList.remove('hidden');
      initDashboard();
    };
  }

  // ── Start Practice button
  const startBtn = $('ud-start-practice');
  if (startBtn) {
    startBtn.onclick = () => {
      ud.classList.add('hidden');
      $('main-dashboard').classList.remove('hidden');
      initDashboard();
    };
  }
}
