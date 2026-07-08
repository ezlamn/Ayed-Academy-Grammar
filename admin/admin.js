// ============================================
// ADMIN DASHBOARD LOGIC (Full CMS Edition)
// ============================================

// Quill Editor Instance
let quillPassage;
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('quiz-passage-editor')) {
    quillPassage = new Quill('#quiz-passage-editor', {
      theme: 'snow',
      modules: {
        toolbar: [
          ['bold', 'italic', 'underline'],
          [{ 'size': ['small', false, 'large', 'huge'] }],
          [{ 'color': [] }, { 'background': [] }],
          ['clean']
        ]
      }
    });
  }
});

let ALL_DATA = { grammar: [], reading: [], listening: [], tests: [] };
let currentTrack = 'grammar';
let db = [];

let editingUnitIndex = -1;
let editingStrategyIndex = -1;
let currentUnit = null; 
let currentStrategy = null; 

// ── INIT ──
async function init() {
  await fetchDB();
  
  const trackSelector = document.getElementById('track-selector');
  if (trackSelector) {
    trackSelector.addEventListener('change', (e) => {
      currentTrack = e.target.value;
      db = ALL_DATA[currentTrack] || [];
      renderUnitsList();
    });
  }

  renderUnitsList();
  bindModals();
  bindTabs();
  bindUploads();
  
  document.getElementById('save-all-btn').addEventListener('click', saveToBackend);
  document.getElementById('add-unit-btn').addEventListener('click', openAddUnitModal);
  document.getElementById('save-unit-btn').addEventListener('click', saveUnit);
  document.getElementById('add-strategy-btn').addEventListener('click', openAddStrategyModal);
  document.getElementById('save-strategy-btn').addEventListener('click', saveStrategy);

  // Dev Mode
  document.getElementById('dev-mode-btn').addEventListener('click', openDevMode);
  document.getElementById('save-json-btn').addEventListener('click', saveDevMode);
}

// ── API ──
async function fetchDB() {
  try {
    const res = await fetch('/api/units');
    ALL_DATA = await res.json();
    if (Array.isArray(ALL_DATA)) {
      ALL_DATA = { grammar: ALL_DATA, reading: [], listening: [], tests: [] };
    }
    db = ALL_DATA[currentTrack] || [];
  } catch (e) { showToast('خطأ في جلب البيانات من السيرفر', true); }
}

async function saveToBackend() {
  try {
    ALL_DATA[currentTrack] = db;
    const res = await fetch('/api/units', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ALL_DATA)
    });
    if (res.ok) showToast('تم الحفظ بنجاح في قاعدة البيانات ✅');
    else showToast('فشل الحفظ!', true);
  } catch (e) { showToast('فشل الاتصال بالسيرفر!', true); }
}

async function uploadFile(file) {
  const fd = new FormData();
  fd.append('media', file);
  try {
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const data = await res.json();
    return data.url;
  } catch (e) {
    showToast('فشل رفع الملف', true);
    return null;
  }
}

// ── RENDER UNITS ──
function renderUnitsList() {
  const container = document.getElementById('units-list');
  container.innerHTML = '';
  db.forEach((u, i) => {
    const el = document.createElement('div');
    el.className = 'unit-card';
    el.innerHTML = `
      <div>
        <h3>${u.emoji || '📝'} ${u.nameAr} <small>(${u.nameEn || ''})</small></h3>
        <p style="color:var(--text-muted);font-size:0.9rem;margin-top:0.3rem">استراتيجيات: ${u.page?.strategies?.length || 0} | أسئلة شاملة: ${u.page?.quizzes?.length || 0}</p>
      </div>
      <div class="actions">
        <button class="btn btn-secondary btn-sm" onclick="editUnit(${i})">✏️ تعديل</button>
        <button class="btn btn-danger btn-sm" onclick="deleteUnit(${i})">🗑️ حذف</button>
      </div>
    `;
    container.appendChild(el);
  });
}

function openAddUnitModal() {
  editingUnitIndex = -1;
  currentUnit = {
    id: db.length > 0 ? Math.max(...db.map(u=>u.id||0)) + 1 : 1,
    emoji: '📝', nameAr: '', nameEn: '', color: '#3B82F6',
    page: { tag: '', mascot: '🎓', strategies: [], quizzes: [], videos: [] }
  };
  populateUnitForm();
  document.getElementById('unit-modal').classList.remove('hidden');
}

window.editUnit = (index) => {
  editingUnitIndex = index;
  currentUnit = JSON.parse(JSON.stringify(db[index]));
  if (!currentUnit.page) currentUnit.page = { strategies: [], quizzes: [] };
  populateUnitForm();
  document.getElementById('unit-modal').classList.remove('hidden');
}

window.deleteUnit = (index) => {
  if (confirm('هل أنت متأكد من حذف هذه الوحدة بالكامل؟')) {
    db.splice(index, 1);
    renderUnitsList();
  }
}

function populateUnitForm() {
  document.getElementById('unit-modal-title').textContent = editingUnitIndex === -1 ? 'إضافة وحدة' : 'تعديل الوحدة';
  document.getElementById('unit-id').value = currentUnit.id || '';
  document.getElementById('unit-emoji').value = currentUnit.emoji || '';
  document.getElementById('unit-name-ar').value = currentUnit.nameAr || '';
  document.getElementById('unit-name-en').value = currentUnit.nameEn || '';
  document.getElementById('unit-tag').value = currentUnit.page?.tag || '';
  if (!currentUnit.page.videos) currentUnit.page.videos = [];
  renderVideosNestedList();
  renderStrategiesNestedList();
  renderQuizzesNestedList();
}

// ── UNIT VIDEO LIBRARY ──
function renderVideosNestedList() {
  const container = document.getElementById('videos-list');
  if (!container) return;
  container.innerHTML = '';
  (currentUnit.page.videos || []).forEach((v, i) => {
    const el = document.createElement('div');
    el.className = 'list-item';
    el.innerHTML = `
      <div><strong>🎬 ${v.title || 'فيديو'}</strong><br><small style="color:var(--text-muted)" dir="ltr">${v.url}</small></div>
      <button class="btn btn-danger btn-sm" onclick="deleteVideo(${i})">🗑️</button>
    `;
    container.appendChild(el);
  });
}
window.deleteVideo = (index) => {
  currentUnit.page.videos.splice(index, 1);
  renderVideosNestedList();
};
document.getElementById('add-video-btn').addEventListener('click', () => {
  const title = prompt('عنوان الفيديو:'); if (title === null) return;
  const url = prompt('رابط الفيديو (يوتيوب / Vimeo / ملف مرفوع):'); if (!url) return;
  if (!currentUnit.page.videos) currentUnit.page.videos = [];
  currentUnit.page.videos.push({ title: title.trim(), url: url.trim() });
  renderVideosNestedList();
});

// ── WELCOME INTRO VIDEO ──
document.getElementById('intro-video-btn').addEventListener('click', () => {
  if (!ALL_DATA.config) ALL_DATA.config = {};
  const current = ALL_DATA.config.introVideoUrl || '';
  const url = prompt('رابط فيديو الترحيب على شاشة الدخول (يوتيوب / Vimeo / ملف مرفوع).\nاتركه فارغاً لإخفائه:', current);
  if (url === null) return;
  ALL_DATA.config.introVideoUrl = url.trim();
  showToast(url.trim() ? 'تم تعيين فيديو الترحيب — اضغط حفظ ✅' : 'تم إزالة فيديو الترحيب — اضغط حفظ');
});

function saveUnit() {
  currentUnit.id = parseInt(document.getElementById('unit-id').value);
  currentUnit.emoji = document.getElementById('unit-emoji').value;
  currentUnit.nameAr = document.getElementById('unit-name-ar').value;
  currentUnit.nameEn = document.getElementById('unit-name-en').value;
  currentUnit.page.tag = document.getElementById('unit-tag').value;

  if (editingUnitIndex === -1) db.push(currentUnit);
  else db[editingUnitIndex] = currentUnit;

  document.getElementById('unit-modal').classList.add('hidden');
  renderUnitsList();
}

// ── STRATEGIES ──
function renderStrategiesNestedList() {
  const container = document.getElementById('strategies-list');
  container.innerHTML = '';
  (currentUnit.page.strategies || []).forEach((s, i) => {
    const el = document.createElement('div');
    el.className = 'list-item';
    el.innerHTML = `
      <div><strong>${s.icon || ''} ${s.title || 'بدون عنوان'}</strong></div>
      <div>
        <button class="btn btn-secondary btn-sm" onclick="editStrategy(${i})">✏️</button>
        <button class="btn btn-danger btn-sm" onclick="deleteStrategy(${i})">🗑️</button>
      </div>
    `;
    container.appendChild(el);
  });
}

function openAddStrategyModal() {
  editingStrategyIndex = -1;
  currentStrategy = {
    id: `u${currentUnit.id}s${(currentUnit.page.strategies?.length||0)+1}`,
    theme: 'sc-theme-blue', icon: '📝', title: '', subtitle: '', badge: '',
    usage: '', videoUrl: '', imageUrl: '', audioUrl: '',
    keywords: [], formulas: [], exception: null, practice: []
  };
  populateStrategyForm();
  document.getElementById('strategy-modal').classList.remove('hidden');
}

window.editStrategy = (index) => {
  editingStrategyIndex = index;
  currentStrategy = JSON.parse(JSON.stringify(currentUnit.page.strategies[index]));
  populateStrategyForm();
  document.getElementById('strategy-modal').classList.remove('hidden');
}

window.deleteStrategy = (index) => {
  if (confirm('حذف الاستراتيجية؟')) {
    currentUnit.page.strategies.splice(index, 1);
    renderStrategiesNestedList();
  }
}

function populateStrategyForm() {
  document.getElementById('strat-title').value = currentStrategy.title || '';
  document.getElementById('strat-subtitle').value = currentStrategy.subtitle || '';
  document.getElementById('strat-icon').value = currentStrategy.icon || '';
  document.getElementById('strat-badge').value = currentStrategy.badge || '';
  document.getElementById('strat-theme').value = currentStrategy.theme || 'sc-theme-blue';
  document.getElementById('strat-usage').value = currentStrategy.usage || '';
  
  // Media
  document.getElementById('strat-video-url').value = currentStrategy.videoUrl || '';
  document.getElementById('strat-video-upload').value = '';
  document.getElementById('strat-video-preview').innerHTML = currentStrategy.videoUrl
    ? `<div style="font-size:0.85rem;color:var(--green)">🎬 ${currentStrategy.videoUrl}</div>` : '';
  document.getElementById('strat-image-url').value = currentStrategy.imageUrl || '';
  document.getElementById('strat-audio-url').value = currentStrategy.audioUrl || '';
  document.getElementById('strat-image-preview').innerHTML = currentStrategy.imageUrl ? `<img src="${currentStrategy.imageUrl}">` : '';
  document.getElementById('strat-audio-preview').innerHTML = currentStrategy.audioUrl ? `<audio controls src="${currentStrategy.audioUrl}"></audio>` : '';

  // Exceptions
  document.getElementById('ex-title').value = currentStrategy.exception?.title || '';
  document.getElementById('ex-body').value = currentStrategy.exception?.body || '';

  renderKeywordsList();
  renderFormulasList();
  renderPracticeList();
}

function saveStrategy() {
  currentStrategy.title = document.getElementById('strat-title').value;
  currentStrategy.subtitle = document.getElementById('strat-subtitle').value;
  currentStrategy.icon = document.getElementById('strat-icon').value;
  currentStrategy.badge = document.getElementById('strat-badge').value;
  currentStrategy.theme = document.getElementById('strat-theme').value;
  currentStrategy.usage = document.getElementById('strat-usage').value;
  currentStrategy.videoUrl = document.getElementById('strat-video-url').value.trim();
  currentStrategy.imageUrl = document.getElementById('strat-image-url').value;
  currentStrategy.audioUrl = document.getElementById('strat-audio-url').value;
  
  const exTitle = document.getElementById('ex-title').value.trim();
  const exBody = document.getElementById('ex-body').value.trim();
  if (exTitle || exBody) currentStrategy.exception = { title: exTitle, body: exBody };
  else currentStrategy.exception = null;

  if (!currentUnit.page.strategies) currentUnit.page.strategies = [];
  if (editingStrategyIndex === -1) currentUnit.page.strategies.push(currentStrategy);
  else currentUnit.page.strategies[editingStrategyIndex] = currentStrategy;

  document.getElementById('strategy-modal').classList.add('hidden');
  renderStrategiesNestedList();
}


// ============================================
// MODAL BUILDERS (Replacing Prompts)
// ============================================

// ── QUIZZES ──
let editingQuizIndex = -1;
let editingQuizType = 'comprehensive'; // 'comprehensive' or 'practice'
let tempQuizOptions = [];

function renderQuizzesNestedList() {
  const container = document.getElementById('quizzes-list');
  container.innerHTML = '';
  (currentUnit.page.quizzes || []).forEach((q, i) => {
    const el = document.createElement('div');
    el.className = 'list-item';
    el.innerHTML = `
      <div><strong>سؤال ${i+1}:</strong> ${q.q.substring(0,30)}...</div>
      <div>
        <button class="btn btn-secondary btn-sm" onclick="openQuizModal('comprehensive', ${i})">✏️</button>
        <button class="btn btn-danger btn-sm" onclick="deleteQuiz(${i})">🗑️</button>
      </div>
    `;
    container.appendChild(el);
  });
}

function renderPracticeList() {
  const container = document.getElementById('practice-list');
  container.innerHTML = '';
  (currentStrategy.practice || []).forEach((pq, i) => {
    const el = document.createElement('div');
    el.className = 'list-item';
    el.innerHTML = `
      <div><strong>${pq.q.substring(0,30)}...</strong> <br> <small style="color:var(--text-muted)">${pq.audioUrl ? '🔊 يحوي ملف صوتي' : ''}</small></div> 
      <div>
        <button class="btn btn-secondary btn-sm" onclick="openQuizModal('practice', ${i})">✏️</button>
        <button class="btn btn-danger btn-sm" onclick="deletePractice(${i})">🗑️</button>
      </div>
    `;
    container.appendChild(el);
  });
}

document.getElementById('add-quiz-btn').onclick = () => openQuizModal('comprehensive');
document.getElementById('add-practice-btn').onclick = () => openQuizModal('practice');

window.deleteQuiz = (index) => {
  if (confirm('حذف هذا السؤال؟')) { currentUnit.page.quizzes.splice(index, 1); renderQuizzesNestedList(); }
}
window.deletePractice = (index) => {
  if (confirm('حذف هذا السؤال؟')) { currentStrategy.practice.splice(index, 1); renderPracticeList(); }
}

window.openQuizModal = (type, index = -1) => {
  editingQuizType = type;
  editingQuizIndex = index;
  tempQuizOptions = [];

  let qObj = null;
  if (index !== -1) {
    qObj = type === 'comprehensive' ? currentUnit.page.quizzes[index] : currentStrategy.practice[index];
    document.getElementById('quiz-q').value = qObj.q || '';
    document.getElementById('quiz-audio-url').value = qObj.audioUrl || '';
    document.getElementById('quiz-expl').value = qObj.expl || '';
    
    // Passage Info
    if (quillPassage) {
      quillPassage.root.innerHTML = qObj.passageText || '';
    }
    const pImgUrlEl = document.getElementById('quiz-passage-img-url');
    if(pImgUrlEl) pImgUrlEl.value = qObj.imgUrl || '';
    const pLayoutEl = document.getElementById('quiz-passage-layout');
    if(pLayoutEl) pLayoutEl.value = qObj.layout || 'auto';
    const pImgPrevEl = document.getElementById('quiz-passage-img-preview');
    if(pImgPrevEl) pImgPrevEl.innerHTML = qObj.imgUrl ? `<img src="${qObj.imgUrl}" style="max-width:100%">` : '';
    
    // Normalize correct answer index ('correct' for comprehensive, 'c' for practice)
    const correctIndex = type === 'comprehensive' ? qObj.correct : qObj.c;
    tempQuizOptions = (qObj.opts || []).map((o, i) => ({ text: o, isCorrect: (correctIndex === i) }));
  } else {
    document.getElementById('quiz-q').value = '';
    document.getElementById('quiz-audio-url').value = '';
    document.getElementById('quiz-expl').value = '';
    
    if (quillPassage) {
      quillPassage.root.innerHTML = '';
    }
    const pImgUrlEl = document.getElementById('quiz-passage-img-url');
    if(pImgUrlEl) pImgUrlEl.value = '';
    const pLayoutEl = document.getElementById('quiz-passage-layout');
    if(pLayoutEl) pLayoutEl.value = 'auto';
    const pImgPrevEl = document.getElementById('quiz-passage-img-preview');
    if(pImgPrevEl) pImgPrevEl.innerHTML = '';
    
    tempQuizOptions = [
      { text: '', isCorrect: true },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false }
    ];
  }
  
  renderQuizOptions();
  document.getElementById('quiz-modal').classList.remove('hidden');
}

function renderQuizOptions() {
  const container = document.getElementById('quiz-options-container');
  container.innerHTML = '';
  tempQuizOptions.forEach((opt, i) => {
    container.innerHTML += `
      <div style="display:flex; gap:10px; margin-bottom:10px; align-items:center;">
        <input type="radio" name="correct-opt" ${opt.isCorrect ? 'checked' : ''} onclick="setCorrectOption(${i})" style="width:20px;height:20px;cursor:pointer;">
        <input type="text" value="${opt.text}" oninput="tempQuizOptions[${i}].text = this.value" placeholder="نص الخيار" style="flex:1;">
        <button class="btn btn-danger btn-sm" onclick="tempQuizOptions.splice(${i},1); renderQuizOptions()">✕</button>
      </div>
    `;
  });
}
window.setCorrectOption = (index) => {
  tempQuizOptions.forEach((o, i) => o.isCorrect = (i === index));
}
document.getElementById('add-quiz-option-btn').onclick = () => {
  tempQuizOptions.push({ text: '', isCorrect: tempQuizOptions.length === 0 });
  renderQuizOptions();
};
document.getElementById('save-quiz-btn').onclick = () => {
  const q = document.getElementById('quiz-q').value;
  const expl = document.getElementById('quiz-expl').value;
  const audioUrl = document.getElementById('quiz-audio-url').value;
  const opts = tempQuizOptions.map(o => o.text);
  const correct = tempQuizOptions.findIndex(o => o.isCorrect);

  if (!q || opts.length === 0) { showToast('يجب إدخال نص السؤال والخيارات', true); return; }

  const finalObj = { q, opts, expl };
  if (editingQuizType === 'comprehensive') finalObj.correct = correct;
  else finalObj.c = correct; 

  if (audioUrl) finalObj.audioUrl = audioUrl;

  // Save Passage Info if exist
  if (quillPassage) {
    const html = quillPassage.root.innerHTML;
    if (html !== '<p><br></p>' && quillPassage.getText().trim() !== '') {
      finalObj.passageText = html;
    }
  }
  const pImgUrlEl = document.getElementById('quiz-passage-img-url');
  if (pImgUrlEl && pImgUrlEl.value.trim()) finalObj.imgUrl = pImgUrlEl.value.trim();
  const pLayoutEl = document.getElementById('quiz-passage-layout');
  if (pLayoutEl && pLayoutEl.value !== 'auto') finalObj.layout = pLayoutEl.value;

  if (editingQuizType === 'comprehensive') {
    if (!currentUnit.page.quizzes) currentUnit.page.quizzes = [];
    if (editingQuizIndex === -1) currentUnit.page.quizzes.push(finalObj);
    else currentUnit.page.quizzes[editingQuizIndex] = finalObj;
    renderQuizzesNestedList();
  } else {
    if (!currentStrategy.practice) currentStrategy.practice = [];
    if (editingQuizIndex === -1) currentStrategy.practice.push(finalObj);
    else currentStrategy.practice[editingQuizIndex] = finalObj;
    renderPracticeList();
  }
  document.getElementById('quiz-modal').classList.add('hidden');
};


// ── FORMULAS ──
let editingFormulaIndex = -1;
function renderFormulasList() {
  const c = document.getElementById('formula-list'); c.innerHTML = '';
  (currentStrategy.formulas||[]).forEach((fm,i) => {
    c.innerHTML += `
      <div class="list-item">
        <div dir="ltr"><b>${fm.subj}</b>: ${fm.form} <br><small>${fm.ex}</small></div>
        <div>
          <button class="btn btn-secondary btn-sm" onclick="openFormulaModal(${i})">✏️</button>
          <button class="btn btn-danger btn-sm" onclick="currentStrategy.formulas.splice(${i},1);renderFormulasList()">✕</button>
        </div>
      </div>
    `;
  });
}
window.openFormulaModal = (index = -1) => {
  editingFormulaIndex = index;
  if (index !== -1) {
    const fm = currentStrategy.formulas[index];
    document.getElementById('formula-subj').value = fm.subj || '';
    document.getElementById('formula-form').value = fm.form || '';
    document.getElementById('formula-ex').value = fm.ex || '';
  } else {
    document.getElementById('formula-subj').value = '';
    document.getElementById('formula-form').value = '';
    document.getElementById('formula-ex').value = '';
  }
  document.getElementById('formula-modal').classList.remove('hidden');
}
document.getElementById('add-formula-btn').onclick = () => openFormulaModal();
document.getElementById('save-formula-btn').onclick = () => {
  const subj = document.getElementById('formula-subj').value;
  const form = document.getElementById('formula-form').value;
  const ex = document.getElementById('formula-ex').value;
  if(!currentStrategy.formulas) currentStrategy.formulas = [];
  const finalObj = { subj, form, ex };
  if(editingFormulaIndex === -1) currentStrategy.formulas.push(finalObj);
  else currentStrategy.formulas[editingFormulaIndex] = finalObj;
  renderFormulasList();
  document.getElementById('formula-modal').classList.add('hidden');
};

// ── KEYWORDS ──
let editingKeywordIndex = -1;
function renderKeywordsList() {
  const c = document.getElementById('kw-list'); c.innerHTML = '';
  (currentStrategy.keywords||[]).forEach((kw,i) => {
    c.innerHTML += `
      <div class="list-item">
        <div><b>${kw.f}</b> - ${kw.b}</div> 
        <div>
          <button class="btn btn-secondary btn-sm" onclick="openKeywordModal(${i})">✏️</button>
          <button class="btn btn-danger btn-sm" onclick="currentStrategy.keywords.splice(${i},1);renderKeywordsList()">✕</button>
        </div>
      </div>
    `;
  });
}
window.openKeywordModal = (index = -1) => {
  editingKeywordIndex = index;
  if (index !== -1) {
    const kw = currentStrategy.keywords[index];
    document.getElementById('keyword-f').value = kw.f || '';
    document.getElementById('keyword-b').value = kw.b || '';
  } else {
    document.getElementById('keyword-f').value = '';
    document.getElementById('keyword-b').value = '';
  }
  document.getElementById('keyword-modal').classList.remove('hidden');
}
document.getElementById('add-kw-btn').onclick = () => openKeywordModal();
document.getElementById('save-keyword-btn').onclick = () => {
  const f = document.getElementById('keyword-f').value;
  const b = document.getElementById('keyword-b').value;
  if(!currentStrategy.keywords) currentStrategy.keywords = [];
  if(editingKeywordIndex === -1) currentStrategy.keywords.push({f, b});
  else currentStrategy.keywords[editingKeywordIndex] = {f, b};
  renderKeywordsList();
  document.getElementById('keyword-modal').classList.add('hidden');
};

// ── DEV MODE (JSON EDITOR) ──
function openDevMode() {
  const txt = document.getElementById('json-editor-textarea');
  txt.value = JSON.stringify(ALL_DATA, null, 2);
  document.getElementById('json-modal').classList.remove('hidden');
}
function saveDevMode() {
  try {
    const raw = document.getElementById('json-editor-textarea').value;
    ALL_DATA = JSON.parse(raw);
    db = ALL_DATA[currentTrack] || [];
    renderUnitsList();
    document.getElementById('json-modal').classList.add('hidden');
    showToast('تم تحديث البيانات، لا تنسَ حفظ التعديلات في النظام ✅');
  } catch(e) {
    showToast('خطأ في صيغة الـ JSON!', true);
  }
}

// ── UI HELPERS ──
function bindModals() {
  document.querySelectorAll('.close-btn').forEach(btn => {
    btn.onclick = () => document.getElementById(btn.dataset.close).classList.add('hidden');
  });
}
function bindTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      const target = document.getElementById(btn.dataset.target);
      if(target) target.classList.add('active');
    };
  });
}
function bindUploads() {
  document.getElementById('strat-video-upload').onchange = async (e) => {
    const file = e.target.files[0]; if(!file) return;
    showToast('جاري رفع الفيديو...');
    const url = await uploadFile(file);
    if(url) {
      document.getElementById('strat-video-url').value = url;
      document.getElementById('strat-video-preview').innerHTML = `<div style="font-size:0.85rem;color:var(--green)">🎬 ${url}</div>`;
      showToast('تم رفع الفيديو ✅');
    }
  };
  document.getElementById('strat-image-upload').onchange = async (e) => {
    const file = e.target.files[0]; if(!file) return;
    const url = await uploadFile(file);
    if(url) {
      document.getElementById('strat-image-url').value = url;
      document.getElementById('strat-image-preview').innerHTML = `<img src="${url}" style="max-width:100%">`;
    }
  };
  document.getElementById('strat-audio-upload').onchange = async (e) => {
    const file = e.target.files[0]; if(!file) return;
    const url = await uploadFile(file);
    if(url) {
      document.getElementById('strat-audio-url').value = url;
      document.getElementById('strat-audio-preview').innerHTML = `<audio controls src="${url}"></audio>`;
    }
  };
  // Quiz audio upload
  const qAudioUpl = document.getElementById('quiz-audio-upload');
  if(qAudioUpl) {
    qAudioUpl.onchange = async (e) => {
      const file = e.target.files[0]; if(!file) return;
      const url = await uploadFile(file);
      if(url) {
        document.getElementById('quiz-audio-url').value = url;
        document.getElementById('quiz-audio-preview').innerHTML = `<audio controls src="${url}"></audio>`;
      }
    };
  }
  // Quiz passage image upload
  const qPassageImgUpl = document.getElementById('quiz-passage-img-upload');
  if(qPassageImgUpl) {
    qPassageImgUpl.onchange = async (e) => {
      const file = e.target.files[0]; if(!file) return;
      showToast('جاري رفع الصورة...');
      const url = await uploadFile(file);
      if(url) {
        document.getElementById('quiz-passage-img-url').value = url;
        document.getElementById('quiz-passage-img-preview').innerHTML = `<img src="${url}" style="max-width:100%">`;
        showToast('تم رفع الصورة ✅');
      }
    };
  }
}

let toastTimer;
function showToast(msg, isError=false) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${isError?'error':''}`;
  t.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>t.classList.add('hidden'), 3000);
}

// Boot
init();
