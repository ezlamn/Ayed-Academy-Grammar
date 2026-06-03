// ============================================
// ADMIN DASHBOARD LOGIC
// ============================================

let db = []; // Full units array
let editingUnitIndex = -1;
let editingStrategyIndex = -1;
let currentUnit = null; // Copy of unit being edited
let currentStrategy = null; // Copy of strategy being edited

// ── INIT ──
async function init() {
  await fetchDB();
  renderUnitsList();
  bindModals();
  bindTabs();
  bindUploads();
  
  document.getElementById('save-all-btn').addEventListener('click', saveToBackend);
  document.getElementById('add-unit-btn').addEventListener('click', openAddUnitModal);
  document.getElementById('save-unit-btn').addEventListener('click', saveUnit);
  document.getElementById('add-strategy-btn').addEventListener('click', openAddStrategyModal);
  document.getElementById('save-strategy-btn').addEventListener('click', saveStrategy);
}

// ── API ──
async function fetchDB() {
  try {
    const res = await fetch('/api/units');
    db = await res.json();
  } catch (e) { showToast('خطأ في جلب البيانات من السيرفر', true); }
}

async function saveToBackend() {
  try {
    const res = await fetch('/api/units', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(db)
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
        <h3>${u.emoji} ${u.nameAr} <small>(${u.nameEn})</small></h3>
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
    page: { tag: '', mascot: '🎓', strategies: [], quizzes: [] }
  };
  populateUnitForm();
  document.getElementById('unit-modal').classList.remove('hidden');
}

window.editUnit = (index) => {
  editingUnitIndex = index;
  // Deep copy to prevent accidental saving before clicking "Save"
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
  document.getElementById('unit-tag').value = currentUnit.page.tag || '';
  renderStrategiesNestedList();
  renderQuizzesNestedList(); // Assuming simple implementation for now
}

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

function renderQuizzesNestedList() {
  const container = document.getElementById('quizzes-list');
  container.innerHTML = '';
  (currentUnit.page.quizzes || []).forEach((q, i) => {
    const el = document.createElement('div');
    el.className = 'list-item';
    el.innerHTML = `
      <div><strong>سؤال ${i+1}:</strong> ${q.q.substring(0,30)}...</div>
      <div>
        <button class="btn btn-danger btn-sm" onclick="deleteQuiz(${i})">🗑️</button>
      </div>
    `;
    container.appendChild(el);
  });
}

document.getElementById('add-quiz-btn').addEventListener('click', () => {
  const q = prompt('نص السؤال (الاختبار الشامل):'); if(!q) return;
  const optStr = prompt('الخيارات مفصولة بفاصلة (مثال: is,are,am):'); if(!optStr) return;
  const opts = optStr.split(',').map(s=>s.trim());
  const correct = parseInt(prompt(`رقم الإجابة الصحيحة (0 إلى ${opts.length-1}):`));
  const expl = prompt('الشرح:');
  if(!currentUnit.page.quizzes) currentUnit.page.quizzes=[];
  currentUnit.page.quizzes.push({q, opts, correct, expl});
  renderQuizzesNestedList();
});

window.deleteQuiz = (index) => {
  if (confirm('حذف هذا السؤال من الاختبار الشامل؟')) {
    currentUnit.page.quizzes.splice(index, 1);
    renderQuizzesNestedList();
  }
}

function openAddStrategyModal() {
  editingStrategyIndex = -1;
  currentStrategy = {
    id: `u${currentUnit.id}s${(currentUnit.page.strategies?.length||0)+1}`,
    theme: 'sc-theme-blue', icon: '📝', title: '', subtitle: '', badge: '',
    usage: '', imageUrl: '', audioUrl: '',
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
  document.getElementById('strat-image-url').value = currentStrategy.imageUrl || '';
  document.getElementById('strat-audio-url').value = currentStrategy.audioUrl || '';
  document.getElementById('strat-image-upload').value = '';
  document.getElementById('strat-audio-upload').value = '';
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

// ── KEYWORDS, FORMULAS, PRACTICE (Simplified for length) ──
function renderKeywordsList() {
  const c = document.getElementById('kw-list'); c.innerHTML = '';
  (currentStrategy.keywords||[]).forEach((kw,i) => {
    c.innerHTML += `<div class="list-item"><div><b>${kw.f}</b> - ${kw.b}</div> <button class="btn btn-danger btn-sm" onclick="currentStrategy.keywords.splice(${i},1);renderKeywordsList()">✕</button></div>`;
  });
}
document.getElementById('add-kw-btn').onclick = () => {
  const f = prompt('الكلمة الإنجليزية (Front):'); if (!f) return;
  const b = prompt('الترجمة (Back):'); if (!b) return;
  if(!currentStrategy.keywords) currentStrategy.keywords=[];
  currentStrategy.keywords.push({f,b}); renderKeywordsList();
};

function renderFormulasList() {
  const c = document.getElementById('formula-list'); c.innerHTML = '';
  (currentStrategy.formulas||[]).forEach((fm,i) => {
    c.innerHTML += `<div class="list-item"><div><b>${fm.subj}</b>: ${fm.form}</div> <button class="btn btn-danger btn-sm" onclick="currentStrategy.formulas.splice(${i},1);renderFormulasList()">✕</button></div>`;
  });
}
document.getElementById('add-formula-btn').onclick = () => {
  const subj = prompt('الفاعل / الحالة:'); if(!subj) return;
  const form = prompt('التكوين (يمكن استخدام HTML):'); if(!form) return;
  const ex = prompt('مثال:'); if(!ex) return;
  if(!currentStrategy.formulas) currentStrategy.formulas=[];
  currentStrategy.formulas.push({subj, form, ex}); renderFormulasList();
}

function renderPracticeList() {
  const c = document.getElementById('practice-list'); c.innerHTML = '';
  (currentStrategy.practice||[]).forEach((pq,i) => {
    c.innerHTML += `<div class="list-item"><div><b>${pq.q}</b></div> <button class="btn btn-danger btn-sm" onclick="currentStrategy.practice.splice(${i},1);renderPracticeList()">✕</button></div>`;
  });
}
document.getElementById('add-practice-btn').onclick = () => {
  const q = prompt('نص السؤال (اترك فراغاً بنقاط .......):'); if(!q) return;
  const optStr = prompt('الخيارات مفصولة بفاصلة (مثال: is,are,am):'); if(!optStr) return;
  const opts = optStr.split(',').map(s=>s.trim());
  const c = parseInt(prompt(`رقم الإجابة الصحيحة (0 إلى ${opts.length-1}):`));
  const expl = prompt('الشرح:');
  if(!currentStrategy.practice) currentStrategy.practice=[];
  currentStrategy.practice.push({q, opts, c, expl}); renderPracticeList();
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
      document.getElementById(btn.dataset.target).classList.add('active');
    };
  });
}
function bindUploads() {
  document.getElementById('strat-image-upload').onchange = async (e) => {
    const file = e.target.files[0]; if(!file) return;
    const url = await uploadFile(file);
    if(url) {
      document.getElementById('strat-image-url').value = url;
      document.getElementById('strat-image-preview').innerHTML = `<img src="${url}">`;
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
}

let toastTimer;
function showToast(msg, isError=false) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${isError?'error':''}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>t.classList.add('hidden'), 3000);
}

// Boot
init();
