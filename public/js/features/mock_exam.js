// Mock Exam Engine
window.MockExam = {
  active: false,
  timerInterval: null,
  timeLeft: 7200, // 2 hours
  score: { correct: 0, total: 0 },

  start: function () {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.active = true;
    this.timeLeft = 7200;
    this.score = { correct: 0, total: 0 };

    if (!this.renderQuestions()) {
      // Guard prevented start due to lack of questions
      this.active = false;
      return;
    }

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
    this.startTimer();
  },

  renderQuestions: function () {
    let grammarPool = [];
    let compPool = [];
    let readingBlocks = {};
    let listeningBlocks = {};

    if (GS.ALL_DATA.grammar) {
      GS.ALL_DATA.grammar.forEach(u => {
        if (u.page && u.page.quizzes) grammarPool.push(...u.page.quizzes.map(q => ({ ...q, category: 'grammar' })));
      });
    }
    if (GS.ALL_DATA.composition) {
      GS.ALL_DATA.composition.forEach(u => {
        if (u.page && u.page.quizzes) compPool.push(...u.page.quizzes.map(q => ({ ...q, category: 'composition' })));
      });
    }
    
    // Passages grouping logic
    const extractBlocks = (trackData, blockMap, category) => {
      if (!trackData) return;
      trackData.forEach(u => {
        if (u.page && u.page.strategies) {
          u.page.strategies.forEach(s => {
            if (s.practice) {
              s.practice.forEach(q => {
                const bId = q.passageId || q.audioUrl || s.id;
                if (!blockMap[bId]) blockMap[bId] = [];
                blockMap[bId].push({ ...q, category });
              });
            }
          });
        }
      });
    };
    extractBlocks(GS.ALL_DATA.reading, readingBlocks, 'reading');
    extractBlocks(GS.ALL_DATA.listening, listeningBlocks, 'listening');

    // Shuffle helper
    const shuffle = arr => arr.sort(() => Math.random() - 0.5);

    grammarPool = shuffle(grammarPool);
    compPool = shuffle(compPool);
    let readingBlockList = shuffle(Object.values(readingBlocks));
    let listeningBlockList = shuffle(Object.values(listeningBlocks));

    let selectedQuestions = [];

    // Reading (Target: 40)
    let rCount = 0;
    for (let block of readingBlockList) {
      if (rCount >= 40) break;
      selectedQuestions.push(...block);
      rCount += block.length;
    }

    // Grammar (Target: 30)
    if (grammarPool.length >= 30) {
      selectedQuestions.push(...grammarPool.slice(0, 30));
    } else {
      selectedQuestions.push(...grammarPool); // Not enough
    }

    // Listening (Target: 20)
    let lCount = 0;
    for (let block of listeningBlockList) {
      if (lCount >= 20) break;
      selectedQuestions.push(...block);
      lCount += block.length;
    }

    // Composition (Target: 10)
    if (compPool.length >= 10) {
      selectedQuestions.push(...compPool.slice(0, 10));
    } else {
      selectedQuestions.push(...compPool); // Not enough
    }

    // STRICT GUARD CHECK
    const counts = { reading: 0, grammar: 0, listening: 0, composition: 0 };
    selectedQuestions.forEach(q => counts[q.category]++);

    if (counts.reading < 40 || counts.grammar < 30 || counts.listening < 20 || counts.composition < 10) {
      alert(`المحتوى غير مكتمل بعد لعمل اختبار مطابق למواصفات قياس!\nالمطلوب (40 قراءة، 30 قواعد، 20 استماع، 10 كتابي).\nالمتوفر الآن (${counts.reading} قراءة، ${counts.grammar} قواعد، ${counts.listening} استماع، ${counts.composition} كتابي).`);
      return false; // Guard prevents starting
    }

    this.score.total = selectedQuestions.length; // Should be ~100

    let html = '';
    // Rendering by blocks to keep passages together visually
    // We already pushed them into selectedQuestions in chunks, so iterating sequentially preserves passage grouping
    
    let currentPassageId = null;
    let currentAudioUrl = null;

    selectedQuestions.forEach((q, i) => {
      // Show passage/audio only if it changes
      const pId = q.passageId || null;
      const aUrl = q.audioUrl || null;
      
      let mediaHtml = '';
      if (pId && pId !== currentPassageId && q.passageText) {
        mediaHtml += `<div class="mock-passage">${q.passageText}</div>`;
        currentPassageId = pId;
      }
      if (aUrl && aUrl !== currentAudioUrl) {
        mediaHtml += `<audio controls style="width: 100%; margin: 1rem 0;"><source src="${aUrl}" type="audio/mpeg"></audio>`;
        currentAudioUrl = aUrl;
      }

      const correctAns = q.correct !== undefined ? q.correct : q.c;
      const optsArray = q.opts || q.options || [];
      html += `
        ${mediaHtml}
        <div class="mock-q-card" data-idx="${i}" data-correct="${correctAns}" data-category="${q.category}">
          <div class="mock-q-text">${i + 1}. ${q.q}</div>
          <div class="mock-opts">
            ${optsArray.map((opt, oi) => `
              <label class="mock-opt-label">
                <input type="radio" name="mq-${i}" value="${oi}">
                ${opt}
              </label>
            `).join('')}
          </div>
        </div>
      `;
    });

    // Make sure we have mockUI created to set innerHTML safely if we are running for real
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
    }
    
    const content = document.getElementById('mock-content');
    if(content) content.innerHTML = html;
    
    return true;
  },

  startTimer: function () {
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

  endExam: async function () {
    clearInterval(this.timerInterval);
    this.active = false;

    let secScore = { reading: 0, grammar: 0, listening: 0, composition: 0 };
    let secTotal = { reading: 0, grammar: 0, listening: 0, composition: 0 };

    // Calculate score
    const cards = document.querySelectorAll('.mock-q-card');
    cards.forEach(card => {
      const selected = card.querySelector('input:checked');
      const correct = card.dataset.correct;
      const category = card.dataset.category;

      secTotal[category]++;

      if (selected && selected.value == correct) {
        this.score.correct++;
        secScore[category]++;
        window.SmartAnalytics?.record(category, true);
      } else {
        window.SmartAnalytics?.record(category, false);
      }
    });

    const percentage = Math.round((this.score.correct / this.score.total) * 100) || 0;

    // Save history
    if (window.dataService) {
      await window.dataService.saveMockExam({
        examId: 'mock_' + Date.now(),
        date: new Date().toISOString(),
        totalScore: percentage,
        rawCorrect: this.score.correct,
        rawTotal: this.score.total,
        sectionScores: secScore,
        sectionTotals: secTotal
      });
    }

    document.getElementById('mock-content').innerHTML = `
      <div class="mock-result" style="text-align:center; padding: 3rem;">
        <h2>انتهى الاختبار!</h2>
        <p style="font-size: 2.5rem; font-weight: bold; color: var(--primary); margin-bottom: 1rem;">الدرجة الكلية: ${percentage}%</p>
        <p style="font-size: 1.2rem; color: var(--text);">إجابات صحيحة: ${this.score.correct} من ${this.score.total}</p>
        <div style="display:flex; justify-content:center; gap: 1rem; margin-top: 2rem;">
          <div style="background:var(--card-bg); padding:1rem; border-radius:var(--radius); box-shadow:var(--shadow-sm);">
            <b>فهم المقروء:</b> ${Math.round((secScore.reading / (secTotal.reading || 1)) * 100)}%
          </div>
          <div style="background:var(--card-bg); padding:1rem; border-radius:var(--radius); box-shadow:var(--shadow-sm);">
            <b>التراكيب (القواعد):</b> ${Math.round((secScore.grammar / (secTotal.grammar || 1)) * 100)}%
          </div>
          <div style="background:var(--card-bg); padding:1rem; border-radius:var(--radius); box-shadow:var(--shadow-sm);">
            <b>الاستماع:</b> ${Math.round((secScore.listening / (secTotal.listening || 1)) * 100)}%
          </div>
          <div style="background:var(--card-bg); padding:1rem; border-radius:var(--radius); box-shadow:var(--shadow-sm);">
            <b>التحليل الكتابي:</b> ${Math.round((secScore.composition / (secTotal.composition || 1)) * 100)}%
          </div>
        </div>
        <button onclick="document.getElementById('mock-exam-ui').classList.add('hidden'); document.getElementById('main-dashboard').classList.remove('hidden'); window.location.reload();" class="btn btn-primary" style="margin-top: 2.5rem;">العودة للرئيسية</button>
      </div>
    `;

    if (window.addXP) window.addXP(this.score.correct * 5, null);
  }
};
