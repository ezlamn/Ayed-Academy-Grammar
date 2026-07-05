/* ================================================================
   GRAMMAR STRATEGIES — INTERACTIVE BOOK  app.js
   Full Professional Build with Dynamic Backend
   ================================================================ */

// ── STATE ──────────────────────────────────────────────────────
const GS = {
  ALL_DATA: null,
  currentTrack: 'grammar',
  UNITS: [],
  currentUnit: 0,
  student: {
    name: localStorage.getItem('gs_student_name') || '',
    completedUnits: JSON.parse(localStorage.getItem('gs_completed') || '[]'),
    notes: JSON.parse(localStorage.getItem('gs_notes') || '{}'),
    highlights: JSON.parse(localStorage.getItem('gs_highlights') || '{}'),
    xp: parseInt(localStorage.getItem('gs_xp') || '0', 10),
    level: parseInt(localStorage.getItem('gs_level') || '1', 10),
  },
  ui: {
    highlightMode: false,
    eraserMode: false,
    fontSize: 16,
  },
  quizState: { answers: {}, submitted: false, currentStep: 0 }
};

// ── SHORTCUTS ──────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const pageContent = $('page-content');
const unitsNav    = $('units-nav');

// ── AUDIO FX ───────────────────────────────────────────────────
const FX = {
  correct: new Audio('data:audio/wav;base64,UklGRmQBAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YTwBAACAeXp8fIN/gIB9g4WJh4qNj46LjZKSkpCQk5eZlpednZ6bnaGjpKSjp6uqrKuur7Kzs7S2t7e3t7e4vL29vb6/wMDAwcHDxMTExcXGxsfHyMjJycrKy8vMzMzNzc7Oz8/P0NDR0dLS09PT1NTU1dXV1tbW19fX2NjY2dnZ2tra29vb3Nzc3d3d3t7e39/f4ODg4eHh4uLi4+Pj5OTk5eXl5ubm5+fn6Ojo6enp6urq6+vr7Ozs7e3t7u7u7+/v8PDw8fHx8vLy8/Pz9PT09fX19vb29/f3+Pj4+fn5+vr6+/v7/Pz8/f39/v7+//7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+'),
  wrong: new Audio('data:audio/wav;base64,UklGRmQBAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YTwBAACAeXp8fIN/gIB9g4WJh4qNj46LjZKSkpCQk5eZlpednZ6bnaGjpKSjp6uqrKuur7Kzs7S2t7e3t7e4vL29vb6/wMDAwcHDxMTExcXGxsfHyMjJycrKy8vMzMzNzc7Oz8/P0NDR0dLS09PT1NTU1dXV1tbW19fX2NjY2dnZ2tra29vb3Nzc3d3d3t7e39/f4ODg4eHh4uLi4+Pj5OTk5eXl5ubm5+fn6Ojo6enp6urq6+vr7Ozs7e3t7u7u7+/v8PDw8fHx8vLy8/Pz9PT09fX19vb29/f3+Pj4+fn5+vr6+/v7/Pz8/f39/v7+//7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+'),
};
FX.correct.volume = 0.5;
FX.wrong.volume = 0.4;
// Quick base64 beeps used for test, later can be replaced with actual high quality sounds

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

// ── SPLASH / ONBOARDING ────────────────────────────────────────
function initSplash() {
  const splash = $('splash');
  const nameInput = $('student-name-input');
  const startGuestBtn = $('splash-start');
  const emailInput = $('student-email');
  const passInput = $('student-password');
  const loginBtn = $('splash-start-login');

  const tabLogin = $('tab-login');
  const tabGuest = $('tab-guest');
  const formLogin = $('auth-login-form');
  const formGuest = $('auth-guest-form');

  tabLogin.onclick = () => {
    tabLogin.classList.add('active');
    tabGuest.classList.remove('active');
    formLogin.classList.remove('hidden');
    formGuest.classList.add('hidden');
  };

  tabGuest.onclick = () => {
    tabGuest.classList.add('active');
    tabLogin.classList.remove('active');
    formGuest.classList.remove('hidden');
    formLogin.classList.add('hidden');
  };

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

  loginBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    const pass = passInput.value;
    if (!email || !pass) {
      alert("الرجاء إدخال البريد الإلكتروني وكلمة المرور");
      return;
    }
    try {
      // Check if window.FirebaseAPI exists
      if (!window.FirebaseAPI) throw new Error("Firebase SDK not loaded.");
      
      const { signInWithEmailAndPassword, createUserWithEmailAndPassword } = window.FirebaseAPI;
      const auth = window.FirebaseAuth;
      
      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, email, pass);
      } catch (err) {
        if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
          // try signup
          userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        } else {
          throw err;
        }
      }
      GS.student.name = email.split('@')[0]; // Simple name from email
      
      // Try to load progress from cloud
      await loadProgressFromCloud(userCredential.user.uid);
      
      goToDashboard();
    } catch (err) {
      console.error(err);
      alert("خطأ في تسجيل الدخول: " + err.message);
    }
  });

  nameInput.addEventListener('keydown', e => { if (e.key === 'Enter') startGuestBtn.click(); });
  passInput.addEventListener('keydown', e => { if (e.key === 'Enter') loginBtn.click(); });
}

async function loadProgressFromCloud(uid) {
  if (!window.FirebaseAPI || !window.FirebaseDB) return;
  const { doc, getDoc } = window.FirebaseAPI;
  const docRef = doc(window.FirebaseDB, "users", uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    if (data.xp) {
      GS.student.xp = data.xp;
      GS.student.level = data.level || 1;
      // Load other synced progress
      updateUI_XP();
    }
  }
}

async function syncProgressToCloud() {
  if (!window.FirebaseAuth || !window.FirebaseAuth.currentUser) return; // Guest mode
  if (!window.FirebaseAPI || !window.FirebaseDB) return;
  const uid = window.FirebaseAuth.currentUser.uid;
  const { doc, setDoc } = window.FirebaseAPI;
  
  await setDoc(doc(window.FirebaseDB, "users", uid), {
    xp: GS.student.xp,
    level: GS.student.level,
    name: GS.student.name,
    lastSynced: new Date().toISOString()
  }, { merge: true });
}


// ── DASHBOARD ──────────────────────────────────────────────────
function initDashboard() {
  $('main-dashboard').classList.remove('hidden');
  
  // Show personalized greeting
  const dashTitle = document.querySelector('.dash-title');
  if (dashTitle) dashTitle.textContent = `أهلاً ${GS.student.name}! — كتاب STEP التفاعلي الشامل`;

  // Show unit count badges on cards
  document.querySelectorAll('.dash-card').forEach(card => {
    const track = card.dataset.track;
    const count = (GS.ALL_DATA[track] || []).length;
    // Remove existing badge if any
    const existing = card.querySelector('.dash-count-badge');
    if (existing) existing.remove();
    const badge = document.createElement('div');
    badge.className = 'dash-count-badge';
    badge.textContent = count > 0 ? `${count} وحدة متاحة` : 'قريباً';
    card.appendChild(badge);
  });

  document.querySelectorAll('.dash-card').forEach(card => {
    card.onclick = function() {
      const track = this.dataset.track;
      
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
    };
  });

  if (window.SmartAnalytics) {
    window.SmartAnalytics.renderDashboardStats();
  }

  $('dash-logout').onclick = () => {
    localStorage.removeItem('gs_student_name');
    location.reload();
  };

  const btnBack = $('btn-back-dash');
  if (btnBack) {
    btnBack.onclick = () => {
      $('app').classList.add('hidden');
      $('main-dashboard').classList.remove('hidden');
      // Re-init dashboard to refresh counts
      initDashboard();
    };
  }
}

// ── INIT APP ───────────────────────────────────────────────────
function initApp() {
  const name = GS.student.name;
  $('student-name-display').textContent = name;
  $('student-avatar').textContent = name.charAt(0);
  
  // Create XP Display next to name if it doesn't exist
  if (!$('student-xp-display')) {
    const xpEl = document.createElement('div');
    xpEl.id = 'student-xp-display';
    xpEl.style.cssText = 'font-size:0.85rem; font-weight:800; background:rgba(245,166,35,0.15); padding:2px 8px; border-radius:20px; border:1px solid rgba(245,166,35,0.3);';
    $('student-name-display').parentNode.appendChild(xpEl);
  }
  updateXPUI();

  // Update breadcrumb track name
  const trackNames = { grammar: 'الجرامر', reading: 'الريدينق', listening: 'الليسينيق', tests: 'النماذج' };
  $('bc-strat').textContent = trackNames[GS.currentTrack] || GS.currentTrack;

  buildUnitsNav();

  if (GS.UNITS.length > 0) {
    loadUnit(0);
  } else {
    // Show empty state
    const emptyMessages = {
      reading: 'سيتم إضافة استراتيجيات القراءة قريباً. تابعنا للمزيد!',
      tests: '50 نموذج اختبار شامل قيد التجهيز. تابعنا!',
    };
    const msg = emptyMessages[GS.currentTrack] || 'لا يوجد محتوى بعد. قريباً، سيتم إضافة المحتوى من لوحة التحكم.';
    pageContent.innerHTML = `
      <div class="empty-track-msg">
        <div class="empty-icon">🛠️</div>
        <h2>قيد الإعداد</h2>
        <p>${msg}</p>
        <p style="margin-top:1rem;color:var(--gold);font-weight:700;">  يمكنك إضافة المحتوى من لوحة التحكم الآن.</p>
      </div>
    `;
  }

  bindTopbar();
  bindNotes();
  bindTools();
}

// ── UNITS NAVIGATION ──────────────────────────────────────────
function buildUnitsNav() {
  unitsNav.innerHTML = '';
  GS.UNITS.forEach((u, i) => {
    const done = GS.student.completedUnits.includes(u.id);
    const active = i === GS.currentUnit;
    const el = document.createElement('div');
    el.className = `unit-nav-item${active ? ' active' : ''}${done ? ' completed' : ''}`;
    el.innerHTML = `
      <div class="unit-nav-num">${done ? '✓' : u.id}</div>
      <div class="unit-nav-info">
        <div class="unit-nav-ar">${u.emoji} ${u.nameAr}</div>
        <div class="unit-nav-en">${u.nameEn}</div>
      </div>
      ${done ? '<div class="unit-nav-check">✅</div>' : ''}
    `;
    el.addEventListener('click', () => {
      loadUnit(i);
      if (window.innerWidth <= 900) closePanel();
    });
    unitsNav.appendChild(el);
  });
  updateProgress();
}

function updateProgress() {
  const total = GS.UNITS.length;
  if(total === 0) return;
  const done  = GS.student.completedUnits.length;
  const pct   = Math.round((done / total) * 100);
  $('progress-fill').style.width = pct + '%';
  $('progress-label').textContent = `${done} / ${total}`;
  $('panel-progress-inner').style.width = pct + '%';
  $('panel-progress-text').textContent = pct + '% مكتمل';
}

// ── TOPBAR BINDINGS ───────────────────────────────────────────
function bindTopbar() {
  $('btn-menu').addEventListener('click', () => {
    const panel = $('units-panel');
    const overlay = $('overlay');
    panel.classList.toggle('open');
    overlay.classList.toggle('hidden', !panel.classList.contains('open'));
  });

  $('overlay').addEventListener('click', closePanel);

  $('btn-prev-unit').addEventListener('click', () => {
    if (GS.currentUnit > 0) loadUnit(GS.currentUnit - 1);
  });
  $('btn-next-unit').addEventListener('click', () => {
    if (GS.currentUnit < GS.UNITS.length - 1) loadUnit(GS.currentUnit + 1);
  });

  $('btn-notes-top').addEventListener('click', openNotes);
}

function closePanel() {
  $('units-panel').classList.remove('open');
  $('overlay').classList.add('hidden');
}

// ── LOAD UNIT ─────────────────────────────────────────────────
function loadUnit(idx) {
  if (!GS.UNITS[idx]) return;
  GS.currentUnit = idx;
  const unit = GS.UNITS[idx];

  buildUnitsNav();
  $('bc-unit').textContent = unit.page?.tag || `الوحدة ${unit.id}`;
  $('bc-strat').textContent = unit.nameAr;
  $('bottom-unit-indicator').textContent = `${idx + 1} / ${GS.UNITS.length}`;

  const saved = GS.student.highlights[unit.id];
  if (saved) {
    pageContent.innerHTML = saved;
    bindInteractiveElements();
    $('btn-eraser').classList.remove('hidden');
    $('btn-clear-hl').classList.remove('hidden');
  } else {
    renderUnit(unit);
    $('btn-eraser').classList.add('hidden');
    $('btn-clear-hl').classList.add('hidden');
  }

  GS.ui.highlightMode = false;
  GS.ui.eraserMode = false;
  updateToolState();

  $('notes-unit-label').textContent = `📍 ${unit.page?.tag} — ${unit.nameAr}`;
  pageContent.scrollTop = 0;
}

function formatPassageText(text) {
  // Support both literal string "\n" and actual newline chars
  const lines = text.split(/\\n|\n/);
  return lines.map(line => {
    line = line.trim();
    if (!line) return '';
    if (line.toUpperCase().includes('PASSAGE')) {
      return `<div style="font-weight:900; color:var(--gold); font-size:1.1rem; margin-bottom:0.5rem; text-align:center;">${line}</div>`;
    }
    return `<div style="margin-bottom:0.8rem; text-align:justify; line-height:1.8;">${line}</div>`;
  }).join('');
}

// ── RENDER READING UNIT (Split-Screen Layout) ─────────────────
function renderReadingUnit(unit) {
  const p = unit.page || {};

  if (unit.type === 'vocab' && p.vocabCategories) {
    return renderVocabUnit(unit);
  }

  let html = `
    <div class="reading-unit animate-in">
      <div class="rd-section-header">
        <div class="rd-header-ar">${unit.title.split(':')[1] || unit.title}</div>
        <div class="rd-header-en">( READING STRATEGY )</div>
        <div class="rd-header-icon">📖</div>
      </div>
  `;

  (p.strategies || []).forEach((s, si) => {
    html += `
      <div class="rd-strategy-section" id="${s.id}" style="animation-delay:${si*0.07}s">
        <div class="rd-strategy-banner ${s.theme}">
          <span>${s.icon}</span> ${s.title}
          <span class="rd-strategy-subtitle">${s.subtitle}</span>
        </div>
        <div class="rd-usage-box">${s.usage.replace(/\\n/g, '<br>')}</div>
        ${s.keywords && s.keywords.length > 0 ? `
          <div class="rd-keywords-grid">
            ${s.keywords.map(kw => `
              <div class="rd-kw-row">
                <span class="rd-kw-en" dir="ltr">${kw.f}</span>
                <span class="rd-arrow">←</span>
                <span class="rd-kw-ar">${kw.b}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}
        ${s.practice && s.practice.length > 0 ? `
          <div class="mini-quiz-wrap" style="margin-top:1.5rem;">
            <div class="mini-quiz-header"><span>💡</span> تدريب تطبيقي <span class="mq-badge">تدريب</span></div>
            ${s.practice.map((pq, pi) => {
              const qid = `${s.id}-p${pi}`;
              return `
                <div class="rd-split-wrap mini-q" id="mq-wrap-${qid}">
                  <div class="rd-split-left">
                    ${pq.imgUrl ? `<img src="${pq.imgUrl}" alt="Reading Passage Image" class="rd-passage-img" />` : ''}
                    <div class="rd-passage-text" dir="ltr">${formatPassageText(pq.passageText)}</div>
                  </div>
                  <div class="rd-split-right">
                    <div class="rd-split-qnum" dir="ltr" style="text-align:left;">${pi + 1} - ${pq.q}</div>
                    <div class="ls-radio-opts">
                      ${pq.opts.map((o, oi) => `
                        <label class="ls-radio-opt">
                          <input type="radio" name="rd-q-${qid}" data-qid="${qid}" data-idx="${oi}" style="display:none">
                          <span class="ls-radio-letter">${['A','B','C','D'][oi]}</span>
                          <span class="ls-radio-text" dir="ltr" style="text-align:left;">${o}</span>
                        </label>
                      `).join('')}
                    </div>
                    <button class="btn btn-primary btn-check-ans hidden" id="check-${qid}" data-qid="${qid}" data-correct="${pq.c}">تحقق من الإجابة</button>
                    <div class="mini-expl" id="mq-expl-${qid}" style="direction:rtl; text-align:right;">
                      <div class="expl-text">${pq.expl}</div>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        ` : ''}
      </div>
    `;
  });

  html += `</div>`;
  return html;
}

// ── RENDER LISTENING UNIT (Special Layout) ───────────────────
function renderListeningUnit(unit) {
  const p = unit.page || {};

  // Check if this is a vocabulary unit
  if (p.type === 'vocabulary' && p.vocabCategories) {
    return renderVocabUnit(unit);
  }

  const isFirstUnit = unit.id === 1;

  let html = `
    <div class="listening-unit animate-in">
      <!-- Section Header -->
      <div class="ls-section-header">
        <div class="ls-header-ar">قسم الإستماع</div>
        <div class="ls-header-en">( LISTENING )</div>
        <div class="ls-header-icon">🎧</div>
      </div>
  `;

  // First unit: show info box
  if (isFirstUnit) {
    html += `
      <div class="ls-info-box animate-in">
        <div class="ls-info-title">معلومات عامة عن قسم الاستماع</div>
        <div class="ls-info-rows">
          <div class="ls-info-row"><span class="ls-info-icon">🎧</span><span class="ls-info-label">ترتيب القسم:</span><span class="ls-info-val">الأول من الاختبار</span></div>
          <div class="ls-info-row"><span class="ls-info-icon">🎧</span><span class="ls-info-label">عدد الأسئلة:</span><span class="ls-info-val">٢٠ سؤال</span></div>
          <div class="ls-info-row"><span class="ls-info-icon">🎧</span><span class="ls-info-label">الدرجة الكلية:</span><span class="ls-info-val">٢٠ درجة</span></div>
          <div class="ls-info-row"><span class="ls-info-icon">🎧</span><span class="ls-info-label">مدة القسم:</span><span class="ls-info-val">٢٥ دقيقة</span></div>
        </div>
        <div class="ls-format-title">شكل الاختبار:</div>
        <div class="ls-format-body">الشاشة مقسمة لجزئين:</div>
        <div class="ls-format-row"><span class="ls-format-icon">📋</span><span><b>الجزء الأيسر</b> يوجد به المقطع الصوتي مع مجموعة تعليمات</span></div>
        <div class="ls-format-row"><span class="ls-format-icon">📋</span><span><b>الجزء الأيمن</b> يوجد به الأسئلة و الاختيارات</span></div>
      </div>
    `;
  }

  // Each strategy as a content section
  (p.strategies || []).forEach((s, si) => {
    html += renderListeningStrategy(s, si);
  });

  // Quiz CTA
  const quizzes = p.quizzes || [];
  if (quizzes.length > 0) {
    html += `
      <div class="unit-end-cta animate-in" style="margin-top:2rem;">
        <h3>هل أنت مستعد للاختبار الشامل؟</h3>
        <p>أجب عن أسئلة الاستماع بعد الاستماع لكل مقطع.</p>
        <button id="open-big-quiz">🎯 بدء الاختبار الشامل للوحدة (${quizzes.length} أسئلة)</button>
      </div>
    `;
  }

  html += `</div>`;
  return html;
}

function renderListeningStrategy(s, si) {
  const letters = ['a', 'b', 'c', 'd'];

  // Check if strategy has practice questions with audio (split-screen layout)
  if (s.practice && s.practice.length > 0 && s.practice[0].audioUrl) {
    const practiceQs = s.practice.map((pq, pi) => {
      const qid = `${s.id}-p${pi}`;
      return `
        <div class="ls-split-wrap mini-q" id="mq-wrap-${qid}">
          <div class="ls-split-left">
            <div class="ls-split-instructions">
              You will hear a conversation. Listen carefully and answer the question. You will hear it only once. You now have 15 seconds.
            </div>
            <div class="listening-audio-wrap">
              <audio controls src="${pq.audioUrl}"></audio>
            </div>
          </div>
          <div class="ls-split-right">
            <div class="ls-split-qnum" dir="ltr" style="text-align:left;">${pi + 1} - ${pq.q}</div>
            <div class="ls-radio-opts">
              ${pq.opts.map((o, oi) => `
                <label class="ls-radio-opt">
                  <input type="radio" name="ls-q-${qid}" data-qid="${qid}" data-idx="${oi}" style="display:none">
                  <span class="ls-radio-letter">${letters[oi]}</span>
                  <span class="ls-radio-text" dir="ltr">${o}</span>
                </label>
              `).join('')}
            </div>
            <button class="btn btn-primary btn-check-ans hidden" id="check-${qid}" data-qid="${qid}" data-correct="${pq.c}">تحقق من الإجابة</button>
            <div class="mini-expl" id="mq-expl-${qid}">
              <div class="expl-text">${pq.expl}</div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="ls-strategy-section animate-in" id="${s.id}" style="animation-delay:${si*0.07}s">
        <div class="ls-strategy-banner ${s.theme}">
          <span>${s.icon}</span> ${s.title}
          <span class="ls-strategy-subtitle">${s.subtitle}</span>
        </div>
        <div class="ls-usage-box">${s.usage}</div>
        ${s.exception ? `
          <div class="ls-exception-box">
            <div class="ls-exception-title">${s.exception.title}</div>
            <div class="ls-exception-body">${s.exception.body}</div>
          </div>
        ` : ''}
        ${practiceQs}
      </div>
    `;
  }

  // Regular strategy without audio practice (time/place deduction strategies)
  return `
    <div class="ls-strategy-section animate-in" id="${s.id}" style="animation-delay:${si*0.07}s">
      <div class="ls-strategy-banner ${s.theme}">
        <span>${s.icon}</span> ${s.title}
        <span class="ls-strategy-subtitle">${s.subtitle}</span>
      </div>
      <div class="ls-usage-box">${s.usage}</div>
      ${s.keywords && s.keywords.length > 0 ? `
        <div class="ls-keywords-grid">
          ${s.keywords.map(kw => `
            <div class="ls-kw-row">
              <span class="ls-kw-en" dir="ltr">${kw.f}</span>
              <span class="ls-arrow">←</span>
              <span class="ls-kw-ar">${kw.b}</span>
            </div>
          `).join('')}
        </div>
      ` : ''}
      ${s.exception ? `
        <div class="ls-exception-box">
          <div class="ls-exception-title">${s.exception.title}</div>
          <div class="ls-exception-body">${s.exception.body}</div>
        </div>
      ` : ''}
      ${s.practice && s.practice.length > 0 ? `
        <div class="mini-quiz-wrap" style="margin-top:1.5rem;">
          <div class="mini-quiz-header"><span>💡</span> جرّب بنفسك! <span class="mq-badge">تدريب</span></div>
          ${s.practice.map((pq, pi) => {
            const qid = `${s.id}-p${pi}`;
            return `
              <div class="mini-q" id="mq-wrap-${qid}">
                ${pq.audioUrl ? `<div class="listening-audio-wrap"><span class="listening-audio-label">🎧 استمع للمقطع أولاً</span><audio controls src="${pq.audioUrl}"></audio></div>` : ''}
                <div class="mini-q-text" dir="ltr" style="text-align:left;">${pq.q}</div>
                <div class="ls-radio-opts">
                  ${pq.opts.map((o, oi) => `
                    <label class="ls-radio-opt">
                      <input type="radio" name="ls-q-${qid}" data-qid="${qid}" data-idx="${oi}" style="display:none">
                      <span class="ls-radio-letter">${letters[oi]}</span>
                      <span class="ls-radio-text" dir="ltr">${o}</span>
                    </label>
                  `).join('')}
                </div>
                <button class="btn btn-primary btn-check-ans hidden" id="check-${qid}" data-qid="${qid}" data-correct="${pq.c}">تحقق من الإجابة</button>
                <div class="mini-expl" id="mq-expl-${qid}"><div class="expl-text">${pq.expl}</div></div>
              </div>
            `;
          }).join('')}
        </div>
      ` : ''}
    </div>
  `;
}

function renderVocabUnit(unit) {
  const p = unit.page || {};
  let html = `
    <div class="listening-unit animate-in">
      <div class="ls-section-header">
        <div class="ls-header-ar">كلمات الأماكن</div>
        <div class="ls-header-en">( PLACES WORDS )</div>
        <div class="ls-header-icon">🗺️</div>
      </div>
  `;

  (p.vocabCategories || []).forEach(cat => {
    html += `
      <div class="ls-vocab-section animate-in">
        <div class="ls-vocab-category-title" style="color: ${cat.color}">${cat.title}</div>
        <div class="flashcard-grid">
          ${cat.words.map((w, wi) => `
            <div class="flashcard" onclick="this.classList.toggle('flipped')">
              <div class="flashcard-inner">
                <div class="flashcard-front" style="border-bottom-color: ${cat.color}">
                  <span class="fc-en" dir="ltr">${w.en}</span>
                  <span class="fc-hint">اضغط للترجمة 👆</span>
                </div>
                <div class="flashcard-back" style="background: ${cat.color}15">
                  <span class="fc-ar">${w.ar}</span>
                  <div class="srs-buttons">
                    <button class="srs-btn srs-hard" onclick="event.stopPropagation(); processSRS('${w.en}', 'hard')">صعب</button>
                    <button class="srs-btn srs-good" onclick="event.stopPropagation(); processSRS('${w.en}', 'good')">جيد</button>
                    <button class="srs-btn srs-easy" onclick="event.stopPropagation(); processSRS('${w.en}', 'easy')">سهل</button>
                  </div>
                  <button class="fc-sound-btn" onclick="event.stopPropagation(); playVocabSound('${w.en.replace(/'/g, "\\'")}')">🔊</button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  });

  html += `</div>`;
  return html;
}

// ── RENDER UNIT ───────────────────────────────────────────────
function renderUnit(unit) {
  // Use specialized renderer for listening track
  if (GS.currentTrack === 'listening') {
    pageContent.innerHTML = renderListeningUnit(unit);
    bindInteractiveElements();
    return;
  }
  
  // Use specialized renderer for reading track
  if (GS.currentTrack === 'reading') {
    pageContent.innerHTML = renderReadingUnit(unit);
    bindInteractiveElements();
    return;
  }

  const p = unit.page || {};

  let html = `
    <div class="unit-header animate-in">
      <div>
        <div class="unit-tag">${p.tag || ''}</div>
        <div class="unit-h-title">${unit.emoji} ${unit.nameAr}</div>
        <div class="unit-h-en">${unit.nameEn}</div>
      </div>
      <div class="unit-h-mascot">${p.mascot || ''}</div>
    </div>
  `;

  (p.strategies || []).forEach((s, si) => {
    html += renderStrategy(s, si);
  });

  const quizzes = p.quizzes || [];
  if (quizzes.length > 0) {
    html += `
      <div class="unit-end-cta animate-in">
        <h3>هل أنت مستعد للاختبار الشامل؟</h3>
        <p>تم تغطية جميع الاستراتيجيات. أجب عن الأسئلة لتتحقق من فهمك.</p>
        <button id="open-big-quiz">🎯 بدء الاختبار الشامل للوحدة (${quizzes.length} أسئلة)</button>
      </div>
    `;
  }

  pageContent.innerHTML = html;
  bindInteractiveElements();
}

function renderStrategy(strat, si) {
  // Media (Image & Audio)
  const mediaHtml = `
    ${strat.imageUrl ? `<div class="media-box"><img src="${strat.imageUrl}" alt="صورة توضيحية"></div>` : ''}
    ${strat.audioUrl ? `<div class="media-box"><audio controls src="${strat.audioUrl}"></audio></div>` : ''}
  `;

  const kwHtml = (strat.keywords || []).map(kw => `
    <div class="kw-reveal" onclick="this.classList.toggle('expanded')">
      <div class="kw-en-box">${kw.f}</div>
      <div class="kw-ar-box">${kw.b}</div>
    </div>
  `).join('');

  const fRows = (strat.formulas || []).map(f => `
    <div class="formula-block" dir="ltr">
      <div class="fb-subj" dir="rtl">${f.subj}</div>
      <div class="fb-form" dir="ltr"><span>${f.form}</span></div>
      <div class="fb-ex" dir="ltr"><span>${f.ex}</span></div>
    </div>
  `).join('');

  const formulaHtml = fRows ? `
    <div class="formula-visual-wrap">
      <div class="formula-v-title">📌 التكوين والشكل الجرافيكي للقاعدة:</div>
      ${fRows}
    </div>
  ` : '';

  const exHtml = strat.exception ? `
    <div class="exception-box">
      <div class="ex-title">${strat.exception.title}</div>
      <div class="ex-body">${strat.exception.body}</div>
    </div>
  ` : '';

  const letters = ['A','B','C','D'];
  const practiceHtml = (strat.practice && strat.practice.length > 0) ? `
    <div class="mini-quiz-wrap">
      <div class="mini-quiz-header">
        <span>💡</span> جرّب بنفسك!
        <span class="mq-badge">تدريب</span>
      </div>
      ${strat.practice.map((pq, pi) => {
        const qid = `${strat.id}-p${pi}`;
        return `
          <div class="mini-q" id="mq-wrap-${qid}">
            ${pq.audioUrl ? `
              <div class="listening-audio-wrap">
                <span class="listening-audio-label">🎧 استمع للمقطع أولاً</span>
                <audio controls src="${pq.audioUrl}"></audio>
              </div>
            ` : ''}
            <div class="mini-q-text">${pq.q}</div>
            <div class="mini-opts">
              ${pq.opts.map((o,oi)=>`
                <button class="mini-opt" data-qid="${qid}" data-idx="${oi}" dir="ltr" style="text-align:left;">
                  <span class="opt-letter">${letters[oi]}</span>${o}
                </button>
              `).join('')}
            </div>
            <div class="mini-q-actions">
               <button class="btn btn-primary btn-check-ans hidden" id="check-${qid}" data-qid="${qid}" data-correct="${pq.c}">تحقق من الإجابة</button>
            </div>
            <div class="mini-expl" id="mq-expl-${qid}">
              <div class="expl-text">${pq.expl}</div>
              <button class="btn btn-secondary btn-sm return-rule-btn" onclick="document.getElementById('${strat.id}').scrollIntoView({behavior:'smooth'})">↩️ العودة لشرح القاعدة</button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  ` : '';

  return `
    <div class="strategy-card ${strat.theme} animate-in" id="${strat.id}" style="animation-delay:${si*0.07}s">
      <div class="sc-header">
        <span class="sc-header-icon">${strat.icon}</span>
        <div class="sc-header-texts">
          <div class="sc-title">${strat.title}</div>
          <div class="sc-subtitle">${strat.subtitle}</div>
        </div>
        <span class="sc-badge">${strat.badge}</span>
      </div>
      <div class="sc-body">
        <div class="sc-keywords">
          <div class="kw-grid">
            <div class="sc-keywords-title">🔑 الكلمات الدالة <small style="font-weight:400;color:rgba(255,255,255,0.4);font-size:0.65rem">(انقر للترجمة)</small></div>
            ${kwHtml}
          </div>
        </div>
        <div class="sc-content">
          ${mediaHtml}
          <div class="usage-banner">${strat.usage}</div>
          ${formulaHtml}
          ${exHtml}
          ${practiceHtml}
        </div>
      </div>
    </div>
  `;
}

function playVocabSound(text) {
  // Simple SpeechSynthesis fallback for pronouncing words
  const msg = new SpeechSynthesisUtterance(text);
  msg.lang = 'en-US';
  window.speechSynthesis.speak(msg);
  addXP(1, null); // Small reward for practicing pronunciation!
}

// ── BIND INTERACTIVE ELEMENTS ─────────────────────────────────
function bindInteractiveElements() {
  // Mini quiz option selection
  pageContent.querySelectorAll('.mini-opt').forEach(btn => {
    btn.addEventListener('click', function() {
      const qid = this.dataset.qid;
      const wrap = $(`mq-wrap-${qid}`);
      if (wrap.dataset.answered) return;

      wrap.querySelectorAll('.mini-opt').forEach(b => b.classList.remove('selected'));
      this.classList.add('selected');
      wrap.dataset.selectedIdx = this.dataset.idx;

      // Show Check Answer button
      $(`check-${qid}`).classList.remove('hidden');
    });
  });

  // Listening Radio Option selection
  pageContent.querySelectorAll('.ls-radio-opt input').forEach(radio => {
    radio.addEventListener('change', function() {
      const qid = this.dataset.qid;
      const oi = parseInt(this.dataset.idx);
      const wrap = $(`mq-wrap-${qid}`);
      if (wrap && wrap.dataset.answered) return;

      // Update visual selection
      pageContent.querySelectorAll(`input[name="${this.name}"]`).forEach(r => {
        r.closest('.ls-radio-opt').classList.remove('selected');
      });
      this.closest('.ls-radio-opt').classList.add('selected');

      // Store selected index on wrap element
      if (wrap) wrap.dataset.selectedIdx = oi;

      // Show check button
      const checkBtn = $(`check-${qid}`);
      if (checkBtn) checkBtn.classList.remove('hidden');
    });
  });

  // Check Answer logic
  pageContent.querySelectorAll('.btn-check-ans').forEach(btn => {
    btn.addEventListener('click', function() {
      const qid = this.dataset.qid;
      const wrap = $(`mq-wrap-${qid}`);
      const correct = parseInt(this.dataset.correct);
      const selected = parseInt(wrap.dataset.selectedIdx);

      wrap.dataset.answered = '1';
      this.classList.add('hidden'); // Hide the check button

      // Handle standard mini-opt buttons
      wrap.querySelectorAll('.mini-opt').forEach((b, i) => {
        b.disabled = true;
        b.classList.remove('selected');
        if (i === correct) b.classList.add('opt-correct');
        else if (i === selected) b.classList.add('opt-wrong');
      });

      // Handle ls-radio-opt labels (listening section)
      wrap.querySelectorAll('.ls-radio-opt').forEach((label, i) => {
        label.style.pointerEvents = 'none';
        label.classList.remove('selected');
        if (i === correct) label.classList.add('correct');
        else if (i === selected) label.classList.add('wrong');
        // Update radio letter circle color
        const letter = label.querySelector('.ls-radio-letter');
        if (letter) {
          if (i === correct) letter.style.background = 'var(--green)';
          else if (i === selected) letter.style.background = 'var(--red)';
        }
      });

      $(`mq-expl-${qid}`).classList.add('show');
      
      // GAMIFICATION TRIGGER
      if (selected === correct) {
        FX.correct.currentTime = 0;
        FX.correct.play().catch(e=>console.log(e));
        addXP(10, event); // Pass click event for floating text position
        if (window.SmartAnalytics) window.SmartAnalytics.record(GS.currentTrack, true);
      } else {
        FX.wrong.currentTime = 0;
        FX.wrong.play().catch(e=>console.log(e));
        if (window.SmartAnalytics) window.SmartAnalytics.record(GS.currentTrack, false);
      }
    });
  });


  const bigBtn = $('open-big-quiz');
  if (bigBtn) bigBtn.addEventListener('click', openBigQuiz);
}

// ── HIGHLIGHT & ERASE ─────────────────────────────────────────
function bindTools() {
  const hlBtn   = $('btn-highlight');
  const erBtn   = $('btn-eraser');
  const clrBtn  = $('btn-clear-hl');
  const modebar = $('mode-bar');
  const modeText= $('mode-bar-text');

  // Helper: bind a button id if it exists (mobile versions may not exist on desktop)
  const bindBtn = (id, fn) => { const el = $(id); if (el) el.addEventListener('click', fn); };

  // Zoom (desktop + mobile)
  const doZoomIn  = () => { GS.ui.fontSize = Math.min(22, GS.ui.fontSize + 1); pageContent.style.fontSize = GS.ui.fontSize + 'px'; };
  const doZoomOut = () => { GS.ui.fontSize = Math.max(12, GS.ui.fontSize - 1); pageContent.style.fontSize = GS.ui.fontSize + 'px'; };
  bindBtn('btn-zoom-in',     doZoomIn);
  bindBtn('btn-zoom-out',    doZoomOut);
  bindBtn('mob-btn-zoom-in',  doZoomIn);
  bindBtn('mob-btn-zoom-out', doZoomOut);

  // Mobile notes button
  bindBtn('mob-btn-notes', openNotes);

  const doHighlight = () => {
    GS.ui.highlightMode = !GS.ui.highlightMode;
    GS.ui.eraserMode = false;
    updateToolState();
    if (GS.ui.highlightMode) showToast('🖍️', 'حدد أي نص لتظليله');
  };
  const doErase = () => {
    GS.ui.eraserMode = !GS.ui.eraserMode;
    GS.ui.highlightMode = false;
    updateToolState();
    if (GS.ui.eraserMode) showToast('🧽', 'انقر على أي نص مُظلَّل لإزالته');
  };
  const doClearHl = () => {
    if (!confirm('مسح جميع التظليلات في هذا الدرس؟')) return;
    const uid = GS.UNITS[GS.currentUnit].id;
    delete GS.student.highlights[uid];
    localStorage.setItem('gs_highlights', JSON.stringify(GS.student.highlights));
    loadUnit(GS.currentUnit);
    showToast('🗑️', 'تم مسح التظليلات', 't-success');
  };

  hlBtn.addEventListener('click', doHighlight);
  erBtn.addEventListener('click', doErase);
  clrBtn.addEventListener('click', doClearHl);
  bindBtn('mob-btn-highlight', doHighlight);
  bindBtn('mob-btn-eraser',    doErase);
  bindBtn('mob-btn-clear-hl',  doClearHl);

  $('mode-bar-close').addEventListener('click', () => {
    GS.ui.highlightMode = false;
    GS.ui.eraserMode = false;
    updateToolState();
  });

  pageContent.addEventListener('mouseup', () => {
    if (!GS.ui.highlightMode) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;

    try {
      const range = sel.getRangeAt(0);
      expandRangeToWordBoundaries(range);
      sel.removeAllRanges();
      sel.addRange(range);
    } catch (e) {
      console.warn("Failed to expand selection to word boundaries:", e);
    }

    pageContent.contentEditable = 'true';
    document.execCommand('hiliteColor', false, 'rgba(245,166,35,0.35)');
    pageContent.contentEditable = 'false';
    sel.removeAllRanges();
    saveHighlights();
    erBtn.classList.remove('hidden');
    clrBtn.classList.remove('hidden');
  });

  pageContent.addEventListener('click', e => {
    if (!GS.ui.eraserMode) return;
    let t = e.target;
    while (t && t !== pageContent) {
      if (t.style && t.style.backgroundColor) {
        t.style.backgroundColor = '';
        if (t.tagName === 'SPAN' && !t.getAttribute('class') && !t.style.cssText.trim()) {
          const p = t.parentNode;
          while (t.firstChild) p.insertBefore(t.firstChild, t);
          p.removeChild(t);
        }
        saveHighlights();
        return;
      }
      t = t.parentNode;
    }
  });
}

function updateToolState() {
  const hlBtn   = $('btn-highlight');
  const erBtn   = $('btn-eraser');
  const clrBtn  = $('btn-clear-hl');
  const modebar = $('mode-bar');
  const modeText= $('mode-bar-text');

  // Desktop toolbar
  hlBtn.classList.toggle('active', GS.ui.highlightMode);
  erBtn.classList.toggle('active-eraser', GS.ui.eraserMode);

  // Mobile toolbar — mirror desktop state
  const mobHl  = $('mob-btn-highlight');
  const mobEr  = $('mob-btn-eraser');
  const mobClr = $('mob-btn-clear-hl');
  if (mobHl)  mobHl.classList.toggle('active', GS.ui.highlightMode);
  if (mobEr)  mobEr.classList.toggle('active-eraser', GS.ui.eraserMode);
  // Sync eraser/clear visibility on mobile toolbar
  if (mobEr)  mobEr.classList.toggle('hidden', !erBtn || erBtn.classList.contains('hidden'));
  if (mobClr) mobClr.classList.toggle('hidden', !clrBtn || clrBtn.classList.contains('hidden'));

  if (GS.ui.highlightMode) {
    modebar.classList.remove('hidden','eraser');
    modeText.textContent = '🖍️  وضع التظليل مفعَّل — حدد أي نص لتظليله بالذهبي';
  } else if (GS.ui.eraserMode) {
    modebar.classList.remove('hidden');
    modebar.classList.add('eraser');
    modeText.textContent = '🧽  الممحاة مفعَّلة — انقر على أي نص مُظلَّل لإزالته';
  } else {
    modebar.classList.add('hidden');
    modebar.classList.remove('eraser');
  }
}

function saveHighlights() {
  const uid = GS.UNITS[GS.currentUnit].id;
  GS.student.highlights[uid] = pageContent.innerHTML;
  localStorage.setItem('gs_highlights', JSON.stringify(GS.student.highlights));
}

// ── NOTES ─────────────────────────────────────────────────────
function bindNotes() {
  $('btn-notes-top').addEventListener('click', openNotes);
  $('notes-close').addEventListener('click', closeNotes);
  $('notes-overlay').addEventListener('click', closeNotes);

  $('save-notes-btn').addEventListener('click', () => {
    const uid = GS.UNITS[GS.currentUnit].id;
    GS.student.notes[uid] = $('notes-area').value;
    localStorage.setItem('gs_notes', JSON.stringify(GS.student.notes));
    const ind = $('notes-saved');
    ind.classList.remove('hidden');
    setTimeout(() => ind.classList.add('hidden'), 2500);
  });

  $('notes-area').addEventListener('input', () => {
    clearTimeout(GS._notesSaveTimer);
    GS._notesSaveTimer = setTimeout(() => {
      const uid = GS.UNITS[GS.currentUnit].id;
      GS.student.notes[uid] = $('notes-area').value;
      localStorage.setItem('gs_notes', JSON.stringify(GS.student.notes));
    }, 1000);
  });
}

function openNotes() {
  const uid = GS.UNITS[GS.currentUnit].id;
  $('notes-area').value = GS.student.notes[uid] || '';
  $('notes-panel').classList.add('open');
  $('notes-overlay').classList.remove('hidden');
  $('notes-area').focus();
}
function closeNotes() {
  $('notes-panel').classList.remove('open');
  $('notes-overlay').classList.add('hidden');
}

// ── BIG QUIZ (Comprehensive) ───────────────────────────────────
function openBigQuiz() {
  const unit = GS.UNITS[GS.currentUnit];
  const quizzes = unit.page.quizzes || [];
  if (quizzes.length === 0) return;

  GS.quizState = { answers: {}, submitted: false, currentStep: 0 };
  $('quiz-unit-badge').textContent = unit.page.tag;
  $('quiz-counter').textContent = 'سؤال 1 من ' + quizzes.length;

  renderQuizStep();
  
  $('quiz-footer').style.display = 'none'; // Custom footer inside step
  $('close-quiz').onclick = () => $('quiz-overlay').classList.add('hidden');
  $('quiz-overlay').classList.remove('hidden');
}

function renderQuizStep() {
  const unit = GS.UNITS[GS.currentUnit];
  const quizzes = unit.page.quizzes || [];
  const i = GS.quizState.currentStep;
  const q = quizzes[i];
  const letters = ['A','B','C','D'];
  const isLast = i === quizzes.length - 1;

  const pct = Math.round((i / quizzes.length) * 100);

  let html = `
    <div class="quiz-step-container">
      <div class="quiz-step-progress" style="margin-bottom:1.5rem;">
        <div class="q-prog-bar" style="height:8px; background:var(--border); border-radius:10px; overflow:hidden; margin-bottom:0.5rem;">
          <div class="q-prog-fill" style="height:100%; width:${pct}%; background:var(--gold); transition:width 0.4s;"></div>
        </div>
        <div class="q-prog-text" style="font-size:0.85rem; color:var(--text-muted); font-weight:700;">سؤال ${i+1} من ${quizzes.length}</div>
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
        <button class="btn" style="padding:0.75rem 2rem; background:linear-gradient(135deg,var(--gold),#e09212); border-radius:var(--r-pill); font-weight:800; color:var(--navy); opacity:${GS.quizState.answers[i] === undefined ? '0.5':'1'}; pointer-events:${GS.quizState.answers[i] === undefined ? 'none':'auto'}; transition:all 0.3s;" onclick="${isLast ? 'submitBigQuiz()' : 'nextQuizStep()'}" id="btn-next-step">
          ${isLast ? 'إنهاء الاختبار ✓' : 'التالي ➔'}
        </button>
      </div>
    </div>
  `;

  $('quiz-body').innerHTML = html;

  document.querySelectorAll('.q-opt').forEach(btn => {
    btn.addEventListener('click', function() {
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

window.nextQuizStep = function() {
  GS.quizState.currentStep++;
  renderQuizStep();
}
window.prevQuizStep = function() {
  GS.quizState.currentStep--;
  renderQuizStep();
}

function submitBigQuiz() {
  const unit = GS.UNITS[GS.currentUnit];
  const quizzes = unit.page.quizzes || [];
  GS.quizState.submitted = true;

  let correct = 0;
  let html = '';
  const letters = ['A','B','C','D'];

  quizzes.forEach((q, qi) => {
    const ans = GS.quizState.answers[qi];
    const isRight = ans === q.correct;
    if (isRight) correct++;

    html += `
      <div class="quiz-q-card" style="margin-bottom:1.5rem;">
          <span class="quiz-q-num">السؤال ${qi+1} من ${quizzes.length}</span>
          <span class="quiz-q-result" style="color:var(--${isRight?'green':'red'})">${isRight ? '✅ صحيحة' : '❌ خاطئة'}</span>
        </div>
        ${q.audioUrl ? `
          <div class="listening-audio-wrap">
            <span class="listening-audio-label">🎧 استمع للمقطع</span>
            <audio controls src="${q.audioUrl}"></audio>
          </div>
        ` : ''}
        <div class="quiz-q-text">${q.q}</div>
        <div class="quiz-opts-grid">
          ${q.opts.map((o,oi) => {
            let cls = '';
            if (oi === q.correct) cls = 'correct';
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

  const pct = quizzes.length > 0 ? Math.round((correct/quizzes.length)*100) : 100;

  if (pct >= 60 && !GS.student.completedUnits.includes(unit.id)) {
    GS.student.completedUnits.push(unit.id);
    localStorage.setItem('gs_completed', JSON.stringify(GS.student.completedUnits));
    buildUnitsNav();
  }

  const msg = pct>=80 ? 'ممتاز! أنت تتقن هذا الدرس 🏆' : pct>=60 ? 'جيد جداً! 👍' : 'راجع الدرس وحاول مجدداً 🔄';
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
    FX.correct.play().catch(e=>console.log(e));
  } else {
    FX.wrong.currentTime = 0;
    FX.wrong.play().catch(e=>console.log(e));
  }
  
  if (correct > 0) {
    const gainedXP = correct * 15;
    addXP(gainedXP, { clientX: window.innerWidth/2, clientY: window.innerHeight/2 }); // fake event object to center floating text
  }
  
  updateProgress();
}

// ── TOAST & CONFETTI ──────────────────────────────────────────
let _toastTimer;
function showToast(icon='', msg='', cls='') {
  const el = $('toast');
  el.className = 'toast ' + cls;
  $('toast-icon').textContent = icon;
  $('toast-msg').textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(()=> el.classList.add('hidden'), 3200);
}

function launchConfetti() {
  const canvas = $('confetti-canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = innerWidth; canvas.height = innerHeight;
  const colors = ['#F5A623','#FFD07A','#06D6A0','#00B4D8','#7C3AED','#EF233C','#fff'];
  const ps = Array.from({length:120},()=>({
    x:Math.random()*canvas.width, y:-20,
    r:Math.random()*7+3, d:Math.random()*80+40,
    c:colors[Math.floor(Math.random()*colors.length)],
    t:Math.random()*10-10, ta:0, ts:Math.random()*0.12+0.05
  }));
  let frame=0;
  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    frame++;
    let alive=false;
    ps.forEach(p=>{
      ctx.beginPath();ctx.lineWidth=p.r/2;ctx.strokeStyle=p.c;
      ctx.moveTo(p.x+p.t+p.r/4,p.y);
      ctx.lineTo(p.x+p.t,p.y+p.t+p.r/4);
      ctx.stroke();
      p.ta+=p.ts; p.y+=(Math.cos(frame/p.d)+3+p.r/2)*0.9; p.t=Math.sin(p.ta)*12;
      if(p.y<canvas.height+20) alive=true;
    });
    if(alive) requestAnimationFrame(draw);
    else ctx.clearRect(0,0,canvas.width,canvas.height);
  }
  draw();
}

// START
boot();


// ── NEW FEATURES LOGIC (Dark Mode, Chatbot, FAB) ───────────────────────────

function initNewFeatures() {
  // 1. Dark Mode
  const darkToggle = $('dark-toggle');
  const savedTheme = localStorage.getItem('gs_theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    darkToggle.textContent = '☀️';
  }
  
  darkToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    if (document.body.classList.contains('dark-mode')) {
      localStorage.setItem('gs_theme', 'dark');
      darkToggle.textContent = '☀️';
    } else {
      localStorage.setItem('gs_theme', 'light');
      darkToggle.textContent = '🌙';
    }
  });

  // 2. Scroll to Top
  const fabScroll = $('fab-scroll');
  $('page-content').addEventListener('scroll', (e) => {
    if (e.target.scrollTop > 300) {
      fabScroll.classList.add('visible');
    } else {
      fabScroll.classList.remove('visible');
    }
  });
  fabScroll.addEventListener('click', () => {
    $('page-content').scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Chatbot logic removed
}

// Call initNewFeatures when boot finishes
// We will hook this into initApp by replacing initApp function definition, or just overriding it.
const originalInitApp = initApp;
initApp = function() {
  originalInitApp();
  initNewFeatures();
};

const originalUpdateProgress = updateProgress;
updateProgress = function() {
  originalUpdateProgress();
  const total = GS.UNITS.length;
  if (total === 0) return;
  const done = GS.student.completedUnits.length;
  const pct = Math.round((done / total) * 100);
  $('overall-prog-sidebar').style.display = 'block';
  $('sidebar-overall-fill').style.width = pct + '%';
  $('sidebar-overall-lbl').textContent = 'الإنجاز الكلي: ' + pct + '%';
};

// ── HIGHLIGHT SELECTION HELPER FOR CURSIVE SCRIPTS ──
function expandRangeToWordBoundaries(range) {
  // Expand start boundary backward
  if (range.startContainer.nodeType === Node.TEXT_NODE) {
    const text = range.startContainer.textContent;
    let offset = range.startOffset;
    while (offset > 0 && !isWordBoundary(text[offset - 1])) {
      offset--;
    }
    range.setStart(range.startContainer, offset);
  }

  // Expand end boundary forward
  if (range.endContainer.nodeType === Node.TEXT_NODE) {
    const text = range.endContainer.textContent;
    let offset = range.endOffset;
    while (offset < text.length && !isWordBoundary(text[offset])) {
      offset++;
    }
    range.setEnd(range.endContainer, offset);
  }
}

function isWordBoundary(char) {
  // Define word boundaries: whitespace, punctuation, quotes, brackets, and Arabic symbols
  return /[\s\.,\/#!$%\^&\*;:{}=\-_`~()\[\]{}«»؟?،؛"']/.test(char);
}

// ── SRS LOGIC ────────────────────────────────────────────────
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
