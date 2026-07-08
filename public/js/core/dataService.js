/* ================================================================
   dataService.js — Abstraction Layer for Data Access
   Ayed Academy — Handoff Preparation
   ================================================================ */

const DB_NAME = 'AyedAcademyStepDB';
const DB_VERSION = 2;

const STORES = {
  profile: 'studentProfile',
  gamification: 'gamification',
  srs: 'srsQueue',
  notes: 'notes',
  highlights: 'highlights',
  quizHistory: 'quizHistory',
  mockExams: 'mockExamResults',
  mistakes: 'mistakeBox'
};

const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = (event) => reject('Database error: ' + event.target.errorCode);
    request.onsuccess = (event) => {
      window.StepDB = event.target.result;
      resolve(window.StepDB);
    };
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      Object.values(STORES).forEach(store => {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store, { keyPath: store === 'srs' ? 'word' : (store === 'notes' || store === 'highlights' ? 'unitId' : (store === 'quizHistory' ? 'quizId' : (store === 'mockExams' ? 'examId' : 'id'))) });
        }
      });
    };
  });
};

const idbGet = (storeName, key) => {
  return new Promise((resolve, reject) => {
    if (!window.StepDB) return resolve(null);
    const transaction = window.StepDB.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const idbPut = (storeName, data) => {
  return new Promise((resolve, reject) => {
    if (!window.StepDB) return resolve();
    const transaction = window.StepDB.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(data);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

const idbGetAll = (storeName) => {
  return new Promise((resolve, reject) => {
    if (!window.StepDB) return resolve([]);
    const transaction = window.StepDB.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// ============================================
// PUBLIC API (Mocks Future Backend API)
// ============================================
window.dataService = {
  // === 1. Initialization ===
  async init() {
    await initDB();
  },

  // === 2. Curriculum Data (Mocking Future fetch API) ===
  async getTrackIndex(trackId) {
    try {
      const res = await fetch(`public/data/${trackId}/index.json`);
      if (!res.ok) throw new Error('Not found');
      return await res.json();
    } catch (e) {
      console.warn(`Failed to fetch index for ${trackId}`, e);
      return [];
    }
  },

  async getUnitDetail(trackId, unitId) {
    try {
      const res = await fetch(`public/data/${trackId}/unit-${unitId}.json`);
      if (!res.ok) throw new Error('Not found');
      return await res.json();
    } catch (e) {
      console.error(`Failed to fetch unit ${unitId} for ${trackId}`, e);
      return null;
    }
  },

  // === 3. Student Progress (Mocking future POST/GET endpoints) ===
  async getProfile() {
    let data = await idbGet(STORES.profile, 'main');
    if (!data) data = { id: 'main', name: 'طالب STEP', completedUnits: [] };
    return data;
  },

  async saveProfile(data) {
    data.id = 'main';
    await idbPut(STORES.profile, data);
  },

  async getGamification() {
    let data = await idbGet(STORES.gamification, 'main');
    if (!data) {
      data = { id: 'main', xp: 0, level: 1, streak: 0, bestStreak: 0, badges: [] };
      await this.saveGamification(data);
    }
    return data;
  },

  async saveGamification(data) {
    data.id = 'main';
    await idbPut(STORES.gamification, data);
  },

  async getQuizHistory(quizId) {
    return await idbGet(STORES.quizHistory, quizId) || null;
  },

  async saveQuizHistory(quizId, historyData) {
    historyData.quizId = quizId;
    await idbPut(STORES.quizHistory, historyData);
  },

  async getAllNotes() {
    return await idbGetAll(STORES.notes);
  },

  async getNotes(unitId) {
    return await idbGet(STORES.notes, unitId) || null;
  },

  async saveNotes(unitId, text) {
    await idbPut(STORES.notes, { unitId, text });
  },

  async getAllHighlights() {
    return await idbGetAll(STORES.highlights);
  },

  async getHighlights(unitId) {
    return await idbGet(STORES.highlights, unitId) || null;
  },

  async saveHighlights(unitId, html) {
    await idbPut(STORES.highlights, { unitId, html });
  },

  // === Mistake Box ===
  async getMistakes() {
    return await idbGetAll(STORES.mistakes);
  },

  async logMistake(id, trackId, unitId) {
    if (!id) return;
    await idbPut(STORES.mistakes, { id, trackId, unitId, timestamp: Date.now() });
  },

  async removeMistake(id) {
    return new Promise((resolve, reject) => {
      if (!window.StepDB) return resolve();
      const transaction = window.StepDB.transaction([STORES.mistakes], 'readwrite');
      const store = transaction.objectStore(STORES.mistakes);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  // === Mock Exams ===
  async getMockExams() {
    return await idbGetAll(STORES.mockExams);
  },

  async saveMockExam(examData) {
    await idbPut(STORES.mockExams, examData);
  },

  async getMockExamResult(examId) {
    return await idbGet(STORES.mockExams, examId) || null;
  },

  async saveMockExamResult(examId, resultData) {
    resultData.examId = examId;
    await idbPut(STORES.mockExams, resultData);
  },

  // === 4. Backup (Export/Import) ===
  async exportData() {
    const backup = {
      gamification: await idbGetAll(STORES.gamification),
      notes: await idbGetAll(STORES.notes),
      highlights: await idbGetAll(STORES.highlights),
      quizHistory: await idbGetAll(STORES.quizHistory),
      mockExams: await idbGetAll(STORES.mockExams),
      mistakes: await idbGetAll(STORES.mistakes),
    };
    const str = JSON.stringify(backup, null, 2);
    const blob = new Blob([str], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ayed_academy_backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  async importData(jsonString) {
    try {
      const backup = JSON.parse(jsonString);
      if (backup.gamification) for (let item of backup.gamification) await idbPut(STORES.gamification, item);
      if (backup.notes) for (let item of backup.notes) await idbPut(STORES.notes, item);
      if (backup.highlights) for (let item of backup.highlights) await idbPut(STORES.highlights, item);
      if (backup.quizHistory) for (let item of backup.quizHistory) await idbPut(STORES.quizHistory, item);
      if (backup.mockExams) for (let item of backup.mockExams) await idbPut(STORES.mockExams, item);
      if (backup.mistakes) for (let item of backup.mistakes) await idbPut(STORES.mistakes, item);
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  }
};
