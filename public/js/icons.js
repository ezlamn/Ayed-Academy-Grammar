/* ================================================================
   ICONS.JS — SVG Icon System (replaces all emojis site-wide)
   Grammar Strategies — Ayed Academy

   - ICONS: stroke-based 24x24 SVG icons (currentColor)
   - EMOJI_MAP: emoji character -> icon name
   - AyIcon.svg(name)     -> svg markup string
   - AyIcon.iconify(text) -> replaces emojis in a string with svg
   - Automatic sweep: converts any emoji rendered into the DOM
     (including content coming from data/db.json) into an SVG icon
     via a MutationObserver — no emoji is ever displayed.
   ================================================================ */
(function () {
  'use strict';

  // ── Icon path library (inner SVG markup, 24x24, stroke) ──────
  var ICONS = {
    'book-open': '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    'library': '<path d="m16 6 4 14"/><path d="M12 6v14"/><path d="M8 8v12"/><path d="M4 4v16"/>',
    'headphones': '<path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/>',
    'pen-line': '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    'graduation-cap': '<path d="M21.42 10.92a1 1 0 0 0-.02-1.84L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.83l8.57 3.91a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
    'home': '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
    'moon': '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    'sun': '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
    'highlighter': '<path d="m9 11-6 6v3h9l3-3"/><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4l8 8Z"/>',
    'eraser': '<path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/>',
    'trash': '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6"/><path d="M14 11v6"/>',
    'arrow-up': '<path d="M12 19V5"/><path d="m5 12 7-7 7 7"/>',
    'arrow-down': '<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>',
    'chevron-right': '<polyline points="9 18 15 12 9 6"/>',
    'chevron-left': '<polyline points="15 18 9 12 15 6"/>',
    'target': '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    'check': '<polyline points="20 6 9 17 4 12"/>',
    'check-circle': '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
    'x-circle': '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>',
    'lightbulb': '<path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/>',
    'key': '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/>',
    'corner-down-left': '<polyline points="9 10 4 15 9 20"/><path d="M20 4v7a4 4 0 0 1-4 4H4"/>',
    'clipboard': '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>',
    'map': '<polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><path d="M9 3v15"/><path d="M15 6v15"/>',
    'pointer': '<path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="m13 13 6 6"/>',
    'volume': '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>',
    'volume-x': '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="m22 9-6 6"/><path d="m16 9 6 6"/>',
    'pin': '<path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16h14v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1z"/>',
    'map-pin': '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    'trophy': '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
    'star': '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    'sparkles': '<path d="M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>',
    'flame': '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    'zap': '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
    'rocket': '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>',
    'dumbbell': '<path d="M14.4 14.4 9.6 9.6"/><path d="M18.66 21.12a2.1 2.1 0 0 0 2.97-2.97l-.06-.06a2.1 2.1 0 0 1 0-2.97l.53-.53a2.1 2.1 0 0 0-2.97-2.97l-.53.53a2.1 2.1 0 0 1-2.97 0l-.06-.06a2.1 2.1 0 0 0-2.97 2.97"/><path d="M2.34 5.31a2.1 2.1 0 0 0 0 2.97l.06.06a2.1 2.1 0 0 1 0 2.97l-.53.53a2.1 2.1 0 0 0 2.97 2.97l.53-.53a2.1 2.1 0 0 1 2.97 0l.06.06a2.1 2.1 0 0 0 2.97-2.97"/><path d="M9.29 2.34a2.1 2.1 0 0 0-2.97 0"/>',
    'percent': '<path d="m19 5-14 14"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
    'heart': '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
    'sprout': '<path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"/>',
    'party': '<path d="M5.8 11.3 2 22l10.7-3.79"/><path d="M4 3h.01"/><path d="M22 8h.01"/><path d="M15 2h.01"/><path d="M22 20h.01"/><path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10"/><path d="m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11-.11.7-.72 1.22-1.43 1.22H17"/><path d="m11 2 .33.82c.34.86-.2 1.82-1.11 1.98-.7.11-1.22.72-1.22 1.43V7"/><path d="M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2Z"/>',
    'gem': '<path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13 4-13-3-6"/><path d="M2 9h20"/>',
    'gamepad': '<line x1="6" y1="11" x2="10" y2="11"/><line x1="8" y1="9" x2="8" y2="13"/><line x1="15" y1="12" x2="15.01" y2="12"/><line x1="18" y1="10" x2="18.01" y2="10"/><path d="M17.32 5H6.68a4 4 0 0 0-3.98 3.59C2.6 9.42 2 14.46 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.41-1.41A2 2 0 0 1 9.83 16h4.34a2 2 0 0 1 1.41.59L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.54-.6-6.58-.68-7.26A4 4 0 0 0 17.32 5z"/>',
    'repeat': '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
    'refresh': '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
    'cards': '<rect x="8" y="8" width="14" height="14" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    'coins': '<circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/>',
    'flag': '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>',
    'owl': '<circle cx="12" cy="13" r="8"/><circle cx="9" cy="11" r="1"/><circle cx="15" cy="11" r="1"/><path d="M12 14v2"/><path d="M4.8 7.2 7 4.5"/><path d="M19.2 7.2 17 4.5"/>',
    'eye': '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    'thumbs-up': '<path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/>',
    'smile': '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>',
    'frown': '<circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>',
    'cool': '<circle cx="12" cy="12" r="10"/><path d="M6 10h5"/><path d="M13 10h5"/><path d="M7 10v1.5a2 2 0 0 0 4 0V10"/><path d="M13 10v1.5a2 2 0 0 0 4 0V10"/><path d="M9 16c.9.7 2 1 3 1s2.1-.3 3-1"/>',
    'bar-chart': '<path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
    'calendar': '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
    'clock': '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    'timer': '<line x1="10" y1="2" x2="14" y2="2"/><line x1="12" y1="14" x2="15" y2="11"/><circle cx="12" cy="14" r="8"/>',
    'pause': '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>',
    'skip-forward': '<polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/>',
    'play': '<polygon points="6 3 20 12 6 21 6 3"/>',
    'play-left': '<polygon points="18 3 4 12 18 21 18 3"/>',
    'alert': '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    'shuffle': '<path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.8-1.1 2-1.7 3.3-1.7H22"/><path d="m18 2 4 4-4 4"/><path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2"/><path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8"/><path d="m18 14 4 4-4 4"/>',
    'link': '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    'help': '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
    'hash': '<line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/>',
    'search': '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    'user': '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    'mirror': '<path d="M8 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h3"/><path d="M16 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3"/><path d="M12 20v2"/><path d="M12 14v2"/><path d="M12 8v2"/><path d="M12 2v2"/>',
    'calculator': '<rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="8.01" y2="10"/><line x1="12" y1="10" x2="12.01" y2="10"/><line x1="16" y1="10" x2="16.01" y2="10"/><line x1="8" y1="14" x2="8.01" y2="14"/><line x1="12" y1="14" x2="12.01" y2="14"/><line x1="8" y1="18" x2="8.01" y2="18"/><line x1="12" y1="18" x2="12.01" y2="18"/><path d="M16 14v4"/>',
    'rainbow': '<path d="M22 17a10 10 0 0 0-20 0"/><path d="M6 17a6 6 0 0 1 12 0"/><path d="M10 17a2 2 0 0 1 4 0"/>',
    'wrench': '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
    'sliders': '<line x1="21" y1="4" x2="14" y2="4"/><line x1="10" y1="4" x2="3" y2="4"/><line x1="21" y1="12" x2="12" y2="12"/><line x1="8" y1="12" x2="3" y2="12"/><line x1="21" y1="20" x2="16" y2="20"/><line x1="12" y1="20" x2="3" y2="20"/><line x1="14" y1="2" x2="14" y2="6"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="16" y1="18" x2="16" y2="22"/>',
    'ban': '<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>',
    'paperclip': '<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>',
    'mic': '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/>',
    'message': '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
    'brain': '<path d="M12 4.5a2.5 2.5 0 0 0-4.96-.46 2.5 2.5 0 0 0-1.98 3 2.5 2.5 0 0 0-1.32 4.24 3 3 0 0 0 .34 5.58 2.5 2.5 0 0 0 2.96 3.08A2.5 2.5 0 0 0 12 19.5Z"/><path d="M12 4.5a2.5 2.5 0 0 1 4.96-.46 2.5 2.5 0 0 1 1.98 3 2.5 2.5 0 0 1 1.32 4.24 3 3 0 0 1-.34 5.58 2.5 2.5 0 0 1-2.96 3.08A2.5 2.5 0 0 1 12 19.5Z"/>',
    'info': '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    'clapper': '<path d="M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3Z"/><path d="m6.2 5.3 3.1 3.9"/><path d="m12.4 3.4 3.1 4"/><path d="M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>',
    'video': '<path d="m22 8-6 4 6 4V8Z"/><rect x="2" y="6" width="14" height="12" rx="2"/>',
    'save': '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>',
    'settings': '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
    'medal': '<path d="M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15"/><path d="M11 12 5.12 2.2"/><path d="m13 12 5.88-9.8"/><path d="M8 7h8"/><circle cx="12" cy="17" r="5"/><path d="M12 18v-2h-.5"/>',
    'lock': '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    'hammer': '<path d="m15 12-8.37 8.37a1 1 0 1 1-3-3L12 9"/><path d="m18 15 4-4"/><path d="m21.5 11.5-1.91-1.91A2 2 0 0 1 19 8.17V7l-2.26-2.26a6 6 0 0 0-4.2-1.76L9 2.96l.92.82A6.18 6.18 0 0 1 12 8.4V10l2 2h1.17a2 2 0 0 1 1.42.59l1.91 1.91"/>',
    'footprints': '<path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z"/><path d="M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z"/><path d="M16 17h4"/><path d="M4 13h4"/>',
    'puzzle': '<path d="M19.44 7.85c-.05.32.06.65.29.88l1.57 1.57c.47.47.7 1.08.7 1.7s-.23 1.23-.7 1.7l-1.61 1.61a.98.98 0 0 1-.84.28c-.47-.07-.8-.48-.97-.93a2.5 2.5 0 1 0-3.21 3.21c.45.17.86.5.93.97a.98.98 0 0 1-.28.84l-1.61 1.61a2.4 2.4 0 0 1-1.7.7 2.4 2.4 0 0 1-1.7-.7l-1.57-1.57a1.03 1.03 0 0 0-.88-.29c-.49.07-.84.5-1.02.97a2.5 2.5 0 1 1-3.24-3.24c.46-.18.9-.53.97-1.02a1.03 1.03 0 0 0-.29-.88l-1.57-1.57A2.4 2.4 0 0 1 2 12c0-.62.24-1.23.71-1.7L4.23 8.77c.24-.24.58-.35.92-.3.52.08.88.53 1.07 1.01a2.5 2.5 0 1 0 3.26-3.26c-.48-.2-.93-.56-1.01-1.07-.05-.34.06-.68.3-.92l1.53-1.52A2.4 2.4 0 0 1 12 2c.62 0 1.23.24 1.7.71l1.57 1.57c.23.23.56.34.88.29.49-.07.84-.5 1.02-.97a2.5 2.5 0 1 1 3.24 3.24c-.46.18-.9.53-.97 1.02Z"/>'
  };

  // ── Emoji -> icon name (keys stored without VS16 ️) ─────
  var EMOJI_MAP = {
    '\u{1F4D8}': 'book-open', '\u{1F4D6}': 'book-open', '\u{1F4D5}': 'book-open', '\u{1F4D7}': 'book-open', '\u{1F4D9}': 'book-open', '\u{1F4D3}': 'book-open', '\u{1F4D4}': 'book-open',
    '\u{1F4DA}': 'library',
    '\u{1F3A7}': 'headphones',
    '\u{1F4DD}': 'pen-line', '✍': 'pen-line', '✏': 'pen-line', '\u{1F58A}': 'pen-line', '\u{1F58B}': 'pen-line',
    '\u{1F393}': 'graduation-cap',
    '\u{1F3E0}': 'home',
    '\u{1F319}': 'moon', '☀': 'sun', '\u{1F31E}': 'sun',
    '\u{1F58D}': 'highlighter', '\u{1F9FD}': 'eraser', '\u{1F5D1}': 'trash',
    '⬆': 'arrow-up', '⬇': 'arrow-down',
    '\u{1F3AF}': 'target',
    '✅': 'check-circle', '☑': 'check-circle', '❌': 'x-circle', '✔': 'check',
    '\u{1F4A1}': 'lightbulb', '\u{1F511}': 'key', '\u{1F510}': 'lock', '\u{1F512}': 'lock', '\u{1F513}': 'lock',
    '↩': 'corner-down-left',
    '\u{1F4CB}': 'clipboard', '\u{1F5FA}': 'map',
    '\u{1F446}': 'pointer', '\u{1F447}': 'pointer', '\u{1F448}': 'pointer', '\u{1F449}': 'pointer',
    '\u{1F50A}': 'volume', '\u{1F509}': 'volume', '\u{1F507}': 'volume-x',
    '\u{1F4CC}': 'pin', '\u{1F4CD}': 'map-pin',
    '\u{1F3C6}': 'trophy',
    '⭐': 'star', '\u{1F31F}': 'star', '✨': 'sparkles',
    '\u{1F525}': 'flame', '⚡': 'zap', '\u{1F680}': 'rocket',
    '\u{1F4AA}': 'dumbbell', '\u{1F9BE}': 'dumbbell',
    '\u{1F4AF}': 'percent',
    '\u{1F49B}': 'heart', '❤': 'heart', '\u{1F49A}': 'heart', '\u{1F499}': 'heart',
    '\u{1F90F}': 'target', '\u{1F331}': 'sprout',
    '\u{1F389}': 'party', '\u{1F38A}': 'party', '\u{1F44F}': 'party',
    '\u{1F48E}': 'gem', '\u{1F3AE}': 'gamepad', '\u{1F579}': 'gamepad',
    '\u{1F501}': 'repeat', '\u{1F502}': 'repeat', '\u{1F504}': 'refresh', '\u{1F503}': 'refresh',
    '\u{1F0CF}': 'cards', '\u{1FA99}': 'coins', '\u{1F3C1}': 'flag', '\u{1F6A9}': 'flag',
    '\u{1F989}': 'owl',
    '\u{1F440}': 'eye', '\u{1F441}': 'eye',
    '\u{1F44D}': 'thumbs-up',
    '\u{1F623}': 'frown', '\u{1F614}': 'frown', '\u{1F642}': 'smile', '\u{1F60A}': 'smile', '\u{1F600}': 'smile', '\u{1F604}': 'smile', '\u{1F60E}': 'cool',
    '\u{1F4CA}': 'bar-chart', '\u{1F4C8}': 'bar-chart', '\u{1F4C9}': 'bar-chart',
    '\u{1F4C5}': 'calendar', '\u{1F4C6}': 'calendar',
    '\u{1F550}': 'clock', '\u{1F551}': 'clock', '\u{1F552}': 'clock', '⏰': 'clock',
    '⏱': 'timer', '⏳': 'timer', '⌛': 'timer',
    '⏸': 'pause', '⏭': 'skip-forward', '⏩': 'skip-forward',
    '▶': 'play', '◀': 'play-left',
    '⚠': 'alert',
    '\u{1F500}': 'shuffle',
    '\u{1F517}': 'link', '❓': 'help', '❔': 'help',
    '\u{1F522}': 'hash',
    '\u{1F50D}': 'search', '\u{1F50E}': 'search',
    '\u{1F464}': 'user', '\u{1F465}': 'user',
    '\u{1FA9E}': 'mirror',
    '\u{1F9EE}': 'calculator', '\u{1F308}': 'rainbow',
    '\u{1F527}': 'wrench', '\u{1F6E0}': 'wrench',
    '\u{1F39B}': 'sliders', '⛔': 'ban', '\u{1F6AB}': 'ban',
    '\u{1F4CE}': 'paperclip',
    '\u{1F5E3}': 'mic', '\u{1F399}': 'mic', '\u{1F3A4}': 'mic',
    '\u{1F4AD}': 'message', '\u{1F4AC}': 'message',
    '\u{1F9E0}': 'brain', '\u{1F92B}': 'info', 'ℹ': 'info',
    '\u{1F3AC}': 'clapper', '\u{1F3A5}': 'video', '\u{1F4F9}': 'video',
    '\u{1F4BE}': 'save',
    '⚙': 'settings',
    '\u{1F396}': 'medal', '\u{1F3C5}': 'medal', '\u{1F947}': 'medal',
    '\u{1F3D7}': 'hammer', '\u{1F463}': 'footprints', '\u{1F9E9}': 'puzzle'
  };

  // ── Build an <svg> markup string ─────────────────────────────
  function svg(name, cls) {
    var body = ICONS[name] || ICONS['sparkles'];
    return '<svg class="ay-ic ay-ic-' + name + (cls ? ' ' + cls : '') +
      '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"' +
      ' stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + body + '</svg>';
  }

  // Matches a single pictographic emoji (with optional VS16),
  // or a stray VS16 selector on its own.
  var EMOJI_RE = /\p{Extended_Pictographic}️?|️/gu;

  function nameFor(match) {
    var base = match.replace(/️/g, '');
    if (!base) return null;               // stray VS16 -> just remove
    return EMOJI_MAP[base] || 'sparkles'; // unknown emoji -> neutral icon
  }

  // Replace emojis inside an HTML/text string with svg markup
  function iconify(str) {
    if (str == null) return '';
    return String(str).replace(EMOJI_RE, function (m) {
      var n = nameFor(m);
      return n ? svg(n) : '';
    });
  }

  // ── DOM sweep: convert emoji text nodes to svg elements ──────
  var SKIP_TAGS = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, OPTION: 1, TITLE: 1, SVG: 1 };

  function makeIconEl(name) {
    var span = document.createElement('span');
    span.className = 'ay-ic-wrap';
    span.innerHTML = svg(name);
    return span;
  }

  function sweepTextNode(node) {
    var text = node.nodeValue;
    EMOJI_RE.lastIndex = 0;
    if (!EMOJI_RE.test(text)) return;
    EMOJI_RE.lastIndex = 0;

    var frag = document.createDocumentFragment();
    var last = 0, m;
    while ((m = EMOJI_RE.exec(text)) !== null) {
      if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
      var n = nameFor(m[0]);
      if (n) frag.appendChild(makeIconEl(n));
      last = m.index + m[0].length;
    }
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    node.parentNode && node.parentNode.replaceChild(frag, node);
  }

  function sweep(root) {
    if (!root) return;
    if (root.nodeType === 3) { // text node
      var p = root.parentNode;
      if (p && !SKIP_TAGS[p.nodeName.toUpperCase()]) sweepTextNode(root);
      return;
    }
    if (root.nodeType !== 1 && root.nodeType !== 11) return;
    if (root.nodeType === 1 && SKIP_TAGS[root.nodeName.toUpperCase()]) return;

    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        var p = n.parentNode;
        if (!p || SKIP_TAGS[p.nodeName.toUpperCase()]) return NodeFilter.FILTER_REJECT;
        if (p.closest && p.closest('svg')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(sweepTextNode);
  }

  // ── Hydrate <i data-icon="name"> placeholders ────────────────
  function hydrate(root) {
    (root || document).querySelectorAll('[data-icon]').forEach(function (el) {
      var n = el.getAttribute('data-icon');
      if (ICONS[n] && !el.querySelector('svg')) el.innerHTML = svg(n);
    });
  }

  // ── Base styles ──────────────────────────────────────────────
  function injectStyle() {
    if (document.getElementById('ay-icons-style')) return;
    var st = document.createElement('style');
    st.id = 'ay-icons-style';
    st.textContent =
      '.ay-ic{width:1.1em;height:1.1em;display:inline-block;vertical-align:-0.18em;flex-shrink:0;}' +
      '.ay-ic-wrap{display:inline-flex;align-items:center;justify-content:center;line-height:1;}' +
      '[data-icon]{display:inline-flex;align-items:center;justify-content:center;line-height:1;font-style:normal;}';
    (document.head || document.documentElement).appendChild(st);
  }

  // ── Observe dynamic DOM changes ──────────────────────────────
  var observer = null;
  function startObserver() {
    if (observer || !document.body) return;
    observer = new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        var m = muts[i];
        if (m.type === 'characterData') { sweep(m.target); continue; }
        for (var j = 0; j < m.addedNodes.length; j++) sweep(m.addedNodes[j]);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  function init() {
    injectStyle();
    hydrate(document);
    sweep(document.body);
    startObserver();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Public API
  window.AyIcon = { svg: svg, iconify: iconify, sweep: sweep, hydrate: hydrate, ICONS: ICONS, EMOJI_MAP: EMOJI_MAP };
})();
