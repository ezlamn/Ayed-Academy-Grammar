/* ================================================================
   UNITS.JS — Units Navigation, Progress Tracking & Unit Loading
   Grammar Strategies — Ayed Academy
   ================================================================ */

// ── UNITS NAVIGATION ──────────────────────────────────────────
function buildUnitsNav() {
  const nav = $('units-nav');
  nav.innerHTML = '';
  GS.UNITS.forEach((u, i) => {
    const done = GS.student.completedUnits.includes(u.id);
    const active = i === GS.currentUnit;
    const el = document.createElement('div');
    el.className = `unit-nav-item${active ? ' active' : ''}${done ? ' completed' : ''}`;
    el.innerHTML = `
      <div class="unit-nav-num">${done ? '✓' : u.id}</div>
      <div class="unit-nav-info">
        <div class="unit-nav-ar">${u.emoji} ${u.nameAr}</div>
        <div class="unit-nav-en">${u.nameEn}</div>
      </div>
      ${done ? '<div class="unit-nav-check">✅</div>' : ''}
    `;
    el.addEventListener('click', () => {
      loadUnit(i);
      if (window.innerWidth <= 900) closePanel();
    });
    nav.appendChild(el);
  });
  updateProgress();
}

function updateProgress() {
  const total = GS.UNITS.length;
  if (total === 0) return;
  const done = GS.student.completedUnits.length;
  const pct = Math.round((done / total) * 100);
  $('progress-fill').style.width = pct + '%';
  $('progress-label').textContent = `${done} / ${total}`;
  $('panel-progress-inner').style.width = pct + '%';
  $('panel-progress-text').textContent = pct + '% مكتمل';

  // Overall progress sidebar
  $('overall-prog-sidebar').style.display = 'block';
  $('sidebar-overall-fill').style.width = pct + '%';
  $('sidebar-overall-lbl').textContent = 'الإنجاز الكلي: ' + pct + '%';

  // Refresh gamification side-effects
  if (window.checkBadges) checkBadges();
  if (window.nbUpdateReviewBadge) nbUpdateReviewBadge();
}

// ── TOPBAR BINDINGS ───────────────────────────────────────────
function bindTopbar() {
  $('btn-menu').addEventListener('click', () => {
    const panel = $('units-panel');
    if (window.innerWidth > 900) {
      // Desktop: collapse to a mini rail (numbers only) — no overlay
      panel.classList.toggle('collapsed');
    } else {
      // Mobile: slide-in drawer with overlay
      const overlay = $('overlay');
      panel.classList.toggle('open');
      overlay.classList.toggle('hidden', !panel.classList.contains('open'));
    }
  });

  $('overlay').addEventListener('click', closePanel);

  $('btn-prev-unit').addEventListener('click', () => {
    if (GS.currentUnit > 0) loadUnit(GS.currentUnit - 1);
  });
  $('btn-next-unit').addEventListener('click', () => {
    if (GS.currentUnit < GS.UNITS.length - 1) loadUnit(GS.currentUnit + 1);
  });

  $('btn-notes-top').addEventListener('click', openNotes);
}

function closePanel() {
  $('units-panel').classList.remove('open');
  $('overlay').classList.add('hidden');
}

// ── LOAD UNIT ─────────────────────────────────────────────────
function loadUnit(idx) {
  if (!GS.UNITS[idx]) return;
  GS.currentUnit = idx;
  const unit = GS.UNITS[idx];
  const pc = $('page-content');

  buildUnitsNav();
  $('bc-unit').textContent = unit.page?.tag || `الوحدة ${unit.id}`;
  $('bc-strat').textContent = unit.nameAr;
  $('bottom-unit-indicator').textContent = `${idx + 1} / ${GS.UNITS.length}`;

  const saved = GS.student.highlights[unit.id];
  if (saved) {
    pc.innerHTML = saved;
    bindInteractiveElements();
    $('btn-eraser').classList.remove('hidden');
    $('btn-clear-hl').classList.remove('hidden');
  } else {
    renderUnit(unit);
    $('btn-eraser').classList.add('hidden');
    $('btn-clear-hl').classList.add('hidden');
  }

  GS.ui.highlightMode = false;
  GS.ui.eraserMode = false;
  updateToolState();

  $('notes-unit-label').textContent = `📍 ${unit.page?.tag} — ${unit.nameAr}`;
  pc.scrollTop = 0;
}
