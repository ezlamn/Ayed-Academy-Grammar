/* ================================================================
   STATE.JS — Global Application State, Shortcuts & Audio FX
   Grammar Strategies — Ayed Academy
   ================================================================ */

// ── SOCKET.IO & STATE ──────────────────────────────────────────
window.socket = typeof io !== 'undefined' ? io() : null;

// Ensure we have a persistent user ID for the Schema
let USER_ID = localStorage.getItem('gs_user_id');
if (!USER_ID) {
  USER_ID = 'user_' + Math.random().toString(36).substr(2, 9);
  localStorage.setItem('gs_user_id', USER_ID);
}

if (window.socket) {
  window.socket.emit('init_user', { userId: USER_ID, name: 'Student', role: 'student' });
  window.socket.on('sync_success', (res) => console.log('Real-time Sync:', res));
}

const GS = {
  ALL_DATA: null,
  currentTrack: 'grammar',
  UNITS: [],
  currentUnit: 0,
  student: {
    name: '',
    completedUnits: [],
    notes: {},
    highlights: {},
    xp: 0,
    level: 1,
    streak: 0,
    bestStreak: 0,
    lastActive: '',
  },
  ui: {
    highlightMode: false,
    eraserMode: false,
    fontSize: 16,
  },
  quizState: { answers: {}, submitted: false, currentStep: 0 }
};

// ── IDB STATE MANAGEMENT ────────────────────────────────────────
// ── IDB STATE MANAGEMENT ────────────────────────────────────────
window.loadStudentState = async function() {
  if (!window.dataService) return;
  try {
    // 1. Gamification
    const gami = await window.dataService.getGamification();
    if (gami) {
      GS.student.xp = gami.xp || 0;
      GS.student.level = gami.level || 1;
      GS.student.streak = gami.streak || 0;
      GS.student.bestStreak = gami.bestStreak || 0;
      GS.student.lastActive = gami.lastActive || '';
      GS.student.bestCombo = gami.bestCombo || 0;
    }

    // 2. Profile
    const prof = await window.dataService.getProfile();
    if (prof) {
      GS.student.name = prof.name || 'طالب STEP';
      GS.student.completedUnits = prof.completedUnits || [];
    }

    // 3. Notes & Highlights
    const notesArr = await window.dataService.getAllNotes();
    notesArr.forEach(n => GS.student.notes[n.unitId] = n.text || n.content);

    const hlArr = await window.dataService.getAllHighlights();
    hlArr.forEach(h => GS.student.highlights[h.unitId] = h.html || h.content);

  } catch (err) {
    console.warn('Could not load state from DataService:', err);
  }
};

window.saveGamificationState = async function() {
  if (!window.dataService) return;
  const gamificationData = {
    xp: GS.student.xp,
    level: GS.student.level,
    streak: GS.student.streak,
    bestStreak: GS.student.bestStreak,
    lastActive: GS.student.lastActive,
    bestCombo: GS.student.bestCombo || 0
  };
  await window.dataService.saveGamification(gamificationData);
};

window.saveProfileState = async function() {
  if (!window.dataService) return;
  await window.dataService.saveProfile({
    name: GS.student.name,
    completedUnits: GS.student.completedUnits
  });
};
// ── SHORTCUTS ──────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const pageContent = () => $('page-content');
const unitsNav    = () => $('units-nav');

// ── AUDIO FX (disabled) ────────────────────────────────────────
const FX = {
  correct: { play: () => Promise.resolve(), currentTime: 0 },
  wrong:   { play: () => Promise.resolve(), currentTime: 0 },
};
