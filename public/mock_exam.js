// Mock Exam Engine
window.MockExam = {
  active: false,
  timerInterval: null,
  timeLeft: 7200, // 2 hours
  score: { correct: 0, total: 0 },
  
  start: function() {
    this.active = true;
    this.timeLeft = 7200;
    this.score = { correct: 0, total: 0 };
    
    // Hide standard app, show mock exam UI
    document.getElementById('app').classList.add('hidden');
    document.getElementById('main-dashboard').classList.add('hidden');
    
    let mockUI = document.getElementById('mock-exam-ui');
    if (!mockUI) {
      mockUI = document.createElement('div');
      mockUI.id = 'mock-exam-ui';
      mockUI.className = 'mock-ui-container';
      mockUI.innerHTML = `
        <div class="mock-header">
          <h2>🎯 محاكاة اختبار STEP</h2>
          <div id="mock-timer">02:00:00</div>
          <button id="mock-submit" class="btn btn-primary">تسليم الاختبار</button>
        </div>
        <div id="mock-content" class="mock-content" dir="ltr"></div>
      `;
      document.body.appendChild(mockUI);
      document.getElementById('mock-submit').addEventListener('click', () => this.endExam());
    }
    mockUI.classList.remove('hidden');
    
    this.renderQuestions();
    this.startTimer();
  },
  
  renderQuestions: function() {
    const content = document.getElementById('mock-content');
    content.innerHTML = '';
    
    // Randomly pick 10 Grammar, 10 Reading, 10 Listening questions
    let questions = [];
    if (GS.ALL_DATA.grammar) {
      GS.ALL_DATA.grammar.forEach(u => {
        if (u.page && u.page.quizzes) questions.push(...u.page.quizzes.map(q => ({...q, category: 'grammar'})));
      });
    }
    if (GS.ALL_DATA.reading) {
      GS.ALL_DATA.reading.forEach(u => {
        if (u.page && u.page.strategies) {
          u.page.strategies.forEach(s => {
            if (s.practice) questions.push(...s.practice.map(q => ({...q, category: 'reading'})));
          });
        }
      });
    }
    
    // Shuffle and pick 30
    questions.sort(() => Math.random() - 0.5);
    questions = questions.slice(0, 30);
    this.score.total = questions.length;
    
    let html = '';
    questions.forEach((q, i) => {
      html += `
        <div class="mock-q-card" data-idx="${i}" data-correct="${q.c}" data-category="${q.category}">
          <div class="mock-q-text">${i+1}. ${q.q}</div>
          ${q.passageText ? `<div class="mock-passage">${q.passageText}</div>` : ''}
          <div class="mock-opts">
            ${(q.opts || q.options).map((opt, oi) => `
              <label class="mock-opt-label">
                <input type="radio" name="mq-${i}" value="${oi}">
                ${opt}
              </label>
            `).join('')}
          </div>
        </div>
      `;
    });
    content.innerHTML = html;
  },
  
  startTimer: function() {
    const timerEl = document.getElementById('mock-timer');
    this.timerInterval = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        this.endExam();
      } else {
        const h = Math.floor(this.timeLeft / 3600).toString().padStart(2, '0');
        const m = Math.floor((this.timeLeft % 3600) / 60).toString().padStart(2, '0');
        const s = (this.timeLeft % 60).toString().padStart(2, '0');
        timerEl.textContent = `${h}:${m}:${s}`;
      }
    }, 1000);
  },
  
  endExam: function() {
    clearInterval(this.timerInterval);
    this.active = false;
    
    // Calculate score
    const cards = document.querySelectorAll('.mock-q-card');
    cards.forEach(card => {
      const selected = card.querySelector('input:checked');
      const correct = card.dataset.correct;
      const category = card.dataset.category;
      
      if (selected && selected.value == correct) {
        this.score.correct++;
        window.SmartAnalytics?.record(category, true);
      } else {
        window.SmartAnalytics?.record(category, false);
      }
    });
    
    document.getElementById('mock-content').innerHTML = `
      <div class="mock-result" style="text-align:center; padding: 3rem;">
        <h2>انتهى الاختبار!</h2>
        <p style="font-size: 2rem; color: var(--primary);">نتيجتك: ${this.score.correct} / ${this.score.total}</p>
        <button onclick="document.getElementById('mock-exam-ui').classList.add('hidden'); document.getElementById('main-dashboard').classList.remove('hidden');" class="btn btn-primary" style="margin-top: 2rem;">العودة للرئيسية</button>
      </div>
    `;
    
    if (window.addXP) window.addXP(this.score.correct * 5, null);
  }
};
