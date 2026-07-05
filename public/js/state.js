/* ================================================================
   STATE.JS — Global Application State, Shortcuts & Audio FX
   Grammar Strategies — Ayed Academy
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
    streak: parseInt(localStorage.getItem('gs_streak') || '0', 10),
    bestStreak: parseInt(localStorage.getItem('gs_best_streak') || '0', 10),
    lastActive: localStorage.getItem('gs_last_active') || '',
    combo: 0,
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
const pageContent = () => $('page-content');
const unitsNav    = () => $('units-nav');

// ── AUDIO FX (disabled) ────────────────────────────────────────
const FX = {
  correct: { play: () => Promise.resolve(), currentTime: 0 },
  wrong:   { play: () => Promise.resolve(), currentTime: 0 },
};
