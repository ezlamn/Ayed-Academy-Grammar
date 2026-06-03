const fs = require('fs');

const logicCode = `

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

  // 3. Chatbot
  const aiFab = $('ai-fab');
  const chatWindow = $('chatbot-window');
  const chatClose = $('chatbot-close');
  const chatSend = $('chatbot-send');
  const chatInput = $('chatbot-input');
  const chatMessages = $('chatbot-messages');
  const chatTyping = $('chat-typing');

  aiFab.addEventListener('click', () => {
    chatWindow.classList.add('open');
    aiFab.querySelector('.ai-fab-badge').style.display = 'none'; // hide new badge
  });
  
  chatClose.addEventListener('click', () => chatWindow.classList.remove('open'));

  function addMessage(text, isUser = false) {
    const div = document.createElement('div');
    div.className = 'chat-msg ' + (isUser ? 'user' : 'bot');
    div.innerHTML = text;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function handleSend(text) {
    if (!text.trim()) return;
    addMessage(text, true);
    chatInput.value = '';
    
    // Simulate typing
    chatMessages.appendChild(chatTyping);
    chatTyping.classList.remove('hidden');
    chatMessages.scrollTop = chatMessages.scrollHeight;

    setTimeout(() => {
      chatTyping.classList.add('hidden');
      
      // Simple bot logic
      let reply = "هذا سؤال رائع! حاول مراجعة قاعدة (الأزمنة) في الوحدة الأولى لمزيد من التوضيح.";
      if (text.includes('المضارع')) reply = "المضارع البسيط (Present Simple) يُستخدم للتعبير عن العادات والحقائق الثابتة. تكوينه: الفاعل + الفعل في المصدر (مع إضافة s مع he/she/it).";
      if (text.includes('is') || text.includes('are')) reply = "نستخدم is مع المفرد (he, she, it)، ونستخدم are مع الجمع (we, you, they).";
      if (text.includes('نصيحة') || text.includes('مذاكرة')) reply = "أفضل نصيحة هي التطبيق المباشر! بعد قراءة أي قاعدة، قم بحل أسئلة (جرّب بنفسك) لتثبيت المعلومة بقوة.";
      
      addMessage(reply, false);
    }, 1500);
  }

  chatSend.addEventListener('click', () => handleSend(chatInput.value));
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSend(chatInput.value);
  });

  document.querySelectorAll('.quick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      handleSend(btn.textContent);
    });
  });
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
`;

fs.appendFileSync('public/app.js', logicCode, 'utf8');
console.log('Appended logic code to app.js');
