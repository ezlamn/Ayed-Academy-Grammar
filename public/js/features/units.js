/* ================================================================
   UNITS.JS — Units Navigation, Progress Tracking & Unit Loading
   Grammar Strategies — Ayed Academy
   ================================================================ */

// ── UNITS NAVIGATION ──────────────────────────────────────────
function buildUnitsNav() {
  const nav = $('units-nav');
  nav.innerHTML = '';
  const isGuest = localStorage.getItem('gs_is_guest') === 'true';

  GS.UNITS.forEach((u, i) => {
    const done = GS.student.completedUnits.includes(u.id);
    const active = i === GS.currentUnit;
    const isLocked = isGuest && i >= 2;

    const el = document.createElement('div');
    el.className = `unit-nav-item${active ? ' active' : ''}${done ? ' completed' : ''}${isLocked ? ' locked' : ''}`;
    
    // Custom styling for locked units
    if (isLocked) {
      el.style.opacity = '0.5';
      el.style.cursor = 'not-allowed';
      el.style.pointerEvents = 'none'; // Optional, but let's handle clicks manually to show alert
    }

    el.innerHTML = `
      <div class="unit-nav-num">${isLocked ? '🔒' : (done ? '✓' : u.id)}</div>
      <div class="unit-nav-info">
        <div class="unit-nav-ar">${u.emoji} ${u.nameAr}</div>
        <div class="unit-nav-en">${u.nameEn}</div>
      </div>
      ${done && !isLocked ? '<div class="unit-nav-check">✅</div>' : ''}
    `;
    
    el.addEventListener('click', () => {
      if (isLocked) {
        if (typeof showToast === 'function') {
          showToast('🔒', 'هذا المحتوى متاح للمشتركين فقط. يرجى تسجيل الدخول.');
        } else {
          alert('هذا المحتوى متاح للمشتركين فقط. يرجى تسجيل الدخول بحساب مدفوع.');
        }
        return;
      }
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

  // Refresh gamification side-effects
  if (window.checkBadges) checkBadges();
  if (window.nbUpdateReviewBadge) nbUpdateReviewBadge();
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
async function loadUnit(idx) {
  const isGuest = localStorage.getItem('gs_is_guest') === 'true';
  if (isGuest && idx >= 2) {
    if (typeof showToast === 'function') {
      showToast('🔒', 'هذا المحتوى متاح للمشتركين فقط. يرجى تسجيل الدخول.');
    } else {
      alert('هذا المحتوى متاح للمشتركين فقط. يرجى تسجيل الدخول.');
    }
    return;
  }

  if (!GS.UNITS || !GS.UNITS[idx]) return;
  GS.currentUnit = idx;
  const unitMeta = GS.UNITS[idx];
  
  $('page-content').innerHTML = '<div style="padding:2rem;text-align:center;">جاري التحميل...</div>';
  
  const unit = await window.dataService.getUnitDetail(GS.currentTrack, unitMeta.id);
  if (!unit) {
    $('page-content').innerHTML = '<div style="padding:2rem;">خطأ في تحميل بيانات الوحدة.</div>';
    return;
  }

  const pc = $('page-content');

  buildUnitsNav();
  const trackNames = { grammar: 'الجرامر', reading: 'الريدينق', listening: 'الليسينيق', tests: 'النماذج' };
  $('bc-unit').textContent = trackNames[GS.currentTrack] || GS.currentTrack;
  $('bc-strat').textContent = (unit.page?.tag || `الوحدة ${unit.id}`) + ' — ' + unit.nameAr;
  $('bottom-unit-indicator').textContent = `${idx + 1} / ${GS.UNITS.length}`;

  const saved = GS.student.highlights[unit.id];
  if (saved) {
    // Basic sanitization to prevent common XSS vectors from corrupted/malicious local data
    const sanitized = saved
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/\bon[a-z]+=(["']).*?\1/gi, '')
      .replace(/javascript:/gi, '');
      
    pc.innerHTML = sanitized;
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

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    buildUnitsNav,
    updateProgress,
    loadUnit,
    bindTopbar
  };
}
