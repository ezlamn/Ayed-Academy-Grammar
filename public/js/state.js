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

// ── AUDIO FX ───────────────────────────────────────────────────
const FX = {
  correct: new Audio('data:audio/wav;base64,UklGRmQBAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YTwBAACAeXp8fIN/gIB9g4WJh4qNj46LjZKSkpCQk5eZlpednZ6bnaGjpKSjp6uqrKuur7Kzs7S2t7e3t7e4vL29vb6/wMDAwcHDxMTExcXGxsfHyMjJycrKy8vMzMzNzc7Oz8/P0NDR0dLS09PT1NTU1dXV1tbW19fX2NjY2dnZ2tra29vb3Nzc3d3d3t7e39/f4ODg4eHh4uLi4+Pj5OTk5eXl5ubm5+fn6Ojo6enp6urq6+vr7Ozs7e3t7u7u7+/v8PDw8fHx8vLy8/Pz9PT09fX19vb29/f3+Pj4+fn5+vr6+/v7/Pz8/f39/v7+//7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+'),
  wrong: new Audio('data:audio/wav;base64,UklGRmQBAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YTwBAACAeXp8fIN/gIB9g4WJh4qNj46LjZKSkpCQk5eZlpednZ6bnaGjpKSjp6uqrKuur7Kzs7S2t7e3t7e4vL29vb6/wMDAwcHDxMTExcXGxsfHyMjJycrKy8vMzMzNzc7Oz8/P0NDR0dLS09PT1NTU1dXV1tbW19fX2NjY2dnZ2tra29vb3Nzc3d3d3t7e39/f4ODg4eHh4uLi4+Pj5OTk5eXl5ubm5+fn6Ojo6enp6urq6+vr7Ozs7e3t7u7u7+/v8PDw8fHx8vLy8/Pz9PT09fX19vb29/f3+Pj4+fn5+vr6+/v7/Pz8/f39/v7+//7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+'),
};
FX.correct.volume = 0.5;
FX.wrong.volume = 0.4;
