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
      if (window.innerWidth <= 768) closePanel(); // consistent with CSS mobile breakpoint
    });
    nav.appendChild(el);
  });
  updateProgress();
}

function updateProgress() {
  const total = GS.UNITS.length;
  if (total === 0) return;
  const trackUnitIds = GS.UNITS.map(u => u.id);
  const done = GS.student.completedUnits.filter(id => trackUnitIds.includes(id)).length;
  const pct = Math.round((done / total) * 100);
  $('progress-fill').style.width = pct + '%';
  $('progress-label').textContent = `${done} / ${total}`;
  $('panel-progress-inner').style.width = pct + '%';
  $('panel-progress-text').textContent = pct + '% مكتمل';

  // Overall progress sidebar
  $('overall-prog-sidebar').style.display = 'block';
  $('sidebar-overall-fill').style.width = pct + '%';
  $('sidebar-overall-lbl').textContent = 'الإنجاز الكلي: ' + pct + '%';
}

// ── TOPBAR BINDINGS ───────────────────────────────────────────
function bindTopbar() {
  const menuBtn = $('btn-menu');
  const panel   = $('units-panel');
  const overlay = $('overlay');

  function isMobile() { return window.innerWidth <= 768; }

  function openSidebar() {
    if (isMobile()) {
      panel.classList.add('open');
      panel.classList.remove('collapsed');
      overlay.classList.remove('hidden');
    } else {
      panel.classList.remove('collapsed');
    }
    menuBtn.classList.add('sidebar-open');
  }

  function closeSidebar() {
    if (isMobile()) {
      panel.classList.remove('open');
      overlay.classList.add('hidden');
    } else {
      panel.classList.add('collapsed');
    }
    menuBtn.classList.remove('sidebar-open');
  }

  function toggleSidebar() {
    if (isMobile()) {
      panel.classList.contains('open') ? closeSidebar() : openSidebar();
    } else {
      panel.classList.contains('collapsed') ? openSidebar() : closeSidebar();
    }
  }

  menuBtn.addEventListener('click', toggleSidebar);
  overlay.addEventListener('click', closeSidebar);

  // On desktop: sidebar starts OPEN, button shows active state
  if (!isMobile()) {
    panel.classList.remove('collapsed');
    menuBtn.classList.add('sidebar-open');
  }

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
  const trackNames = { grammar: 'الجرامر', reading: 'الريدينق', listening: 'الليسينيق', tests: 'النماذج' };
  $('bc-unit').textContent = trackNames[GS.currentTrack] || GS.currentTrack;
  $('bc-strat').textContent = (unit.page?.tag || `الوحدة ${unit.id}`) + ' — ' + unit.nameAr;
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
