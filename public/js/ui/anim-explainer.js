/* ================================================================
   ANIM-EXPLAINER.JS — Animated Grammar Explainers
   Generates an animated "explainer video" for every grammar
   strategy from its own data (usage, keywords, formulas,
   exceptions). The animation plays FIRST; the detailed rule
   unlocks automatically when it finishes (or via skip).
   Grammar Strategies — Ayed Academy
   ================================================================ */

// ── WATCHED STATE (localStorage) ──────────────────────────────
function axWatchedSet() {
  try { return new Set(JSON.parse(localStorage.getItem('axWatched') || '[]')); }
  catch (e) { return new Set(); }
}

function axIsWatched(id) {
  return axWatchedSet().has(id);
}

function axMarkWatched(id) {
  const set = axWatchedSet();
  set.add(id);
  try { localStorage.setItem('axWatched', JSON.stringify([...set])); } catch (e) {}
}

// ── HELPERS ───────────────────────────────────────────────────
function axPlainText(html) {
  const d = document.createElement('div');
  d.innerHTML = html || '';
  return (d.textContent || '').replace(/\s+/g, ' ').trim();
}

// Wrap each word in a span with a staggered animation delay
function axStaggerWords(text, step, start) {
  const words = axPlainText(text).split(' ').filter(Boolean);
  return words.map((w, i) =>
    `<span class="ax-w" style="--d:${(start || 0.3) + i * step}s">${w}</span>`
  ).join(' ');
}

const AX_CLAMP = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// ── SCENE BUILDER ─────────────────────────────────────────────
// Turns one strategy object into an ordered list of scenes:
// { cls, html, dur (ms) }. The outro scene has dur 0 = terminal.
function axBuildScenes(strat) {
  const scenes = [];

  // 1) Intro
  scenes.push({
    cls: 'ax-scene-intro',
    dur: 2600,
    html: `
      <div class="ax-big-icon">${strat.icon || '📘'}</div>
      <div class="ax-title">${strat.title || ''}</div>
      <div class="ax-sub" dir="ltr">${strat.subtitle || ''}</div>
      <div class="ax-badge-line">🎬 شرح متحرك — ركّز معايا!</div>
    `
  });

  // 2) Usage (when do we use it?)
  if (strat.usage) {
    const words = axPlainText(strat.usage).split(' ').filter(Boolean);
    scenes.push({
      cls: 'ax-scene-usage',
      dur: AX_CLAMP(1400 + words.length * 260, 3000, 8000),
      html: `
        <div class="ax-label">🎯 إمتى نستخدمها؟</div>
        <div class="ax-words">${axStaggerWords(strat.usage, 0.22)}</div>
      `
    });
  }

  // 3) Keywords
  const kws = strat.keywords || [];
  if (kws.length) {
    scenes.push({
      cls: 'ax-scene-keywords',
      dur: AX_CLAMP(1200 + kws.length * 620, 3000, 9000),
      html: `
        <div class="ax-label">🔑 الكلمات الدالة — لو شفتها في السؤال</div>
        <div class="ax-chips">
          ${kws.map((kw, i) => `
            <div class="ax-chip" style="--d:${0.35 + i * 0.55}s">
              <span class="ax-chip-en" dir="ltr">${kw.f}</span>
              <span class="ax-chip-ar">${kw.b}</span>
            </div>
          `).join('')}
        </div>
      `
    });
  }

  // 4) One scene per formula (subject + form ⇒ example)
  const fms = strat.formulas || [];
  fms.forEach((f, i) => {
    scenes.push({
      cls: 'ax-scene-formula',
      dur: 4600 + (f.note ? 900 : 0),
      html: `
        <div class="ax-label">🧩 التركيبة ${i + 1} من ${fms.length}</div>
        <div class="ax-eq" dir="ltr">
          <div class="ax-block ax-block-subj">${f.subj}</div>
          <div class="ax-plus">+</div>
          <div class="ax-block ax-block-form">${f.form}</div>
        </div>
        ${f.ex ? `<div class="ax-ex" dir="ltr">${f.ex}</div>` : ''}
        ${f.note ? `<div class="ax-note">${f.note}</div>` : ''}
      `
    });
  });

  // 5) Exception / warning
  if (strat.exception) {
    const len = axPlainText(strat.exception.body).length;
    scenes.push({
      cls: 'ax-scene-exception',
      dur: AX_CLAMP(3000 + len * 28, 4000, 9500),
      html: `
        <div class="ax-warn-title">${strat.exception.title}</div>
        <div class="ax-warn-body">${strat.exception.body}</div>
      `
    });
  }

  // 6) Outro (terminal — unlocks the rule)
  scenes.push({
    cls: 'ax-scene-outro',
    dur: 0,
    html: `
      <div class="ax-big-icon">🎉</div>
      <div class="ax-title">كده فهمت الفكرة!</div>
      <div class="ax-outro-txt">القاعدة الكاملة اتفتحت لك تحت — اقرأها وجرّب التدريبات 👇</div>
      <button class="ax-open-rule">📖 روح للقاعدة بالتفصيل</button>
    `
  });

  return scenes;
}

// ── RENDER PLAYER SHELL (called from renderStrategy) ─────────
function renderAnimExplainer(strat) {
  const scenes = axBuildScenes(strat);
  const watched = axIsWatched(strat.id);
  const totalSec = Math.round(scenes.reduce((a, s) => a + s.dur, 0) / 1000);

  return `
    <div class="ax-player" id="ax-${strat.id}" data-strat="${strat.id}">
      <div class="ax-head">
        <span class="ax-head-title">🎬 الشرح المتحرك</span>
        <span class="ax-head-en" dir="ltr">ANIMATED EXPLAINER</span>
        <span class="ax-head-count"></span>
      </div>
      <div class="ax-screen">
        ${scenes.map(s => `
          <div class="ax-scene ${s.cls}" data-dur="${s.dur}">${s.html}</div>
        `).join('')}
        <div class="ax-poster">
          <button class="ax-play-big" aria-label="تشغيل الشرح">▶</button>
          <div class="ax-poster-txt">${watched ? '🔁 شاهد الشرح مرة تانية' : 'اتفرج على الشرح الأول وبعدين القاعدة'}</div>
          <div class="ax-poster-dur">⏱ حوالي ${totalSec} ثانية</div>
        </div>
      </div>
      <div class="ax-segs">
        ${scenes.map(() => `<div class="ax-seg"><div class="ax-seg-fill"></div></div>`).join('')}
      </div>
      <div class="ax-controls">
        <button class="ax-btn ax-btn-toggle" disabled>⏸ إيقاف</button>
        <button class="ax-btn ax-btn-replay">🔁 من الأول</button>
        <button class="ax-btn ax-btn-skip">⏭ افتح القاعدة على طول</button>
      </div>
    </div>
  `;
}

// ── PLAYER ENGINE ─────────────────────────────────────────────
function axSetupPlayer(playerEl) {
  const sceneEls = [...playerEl.querySelectorAll('.ax-scene')];
  const segFills = [...playerEl.querySelectorAll('.ax-seg-fill')];
  const durs     = sceneEls.map(el => parseInt(el.dataset.dur, 10));
  const poster   = playerEl.querySelector('.ax-poster');
  const btnTog   = playerEl.querySelector('.ax-btn-toggle');
  const btnRep   = playerEl.querySelector('.ax-btn-replay');
  const btnSkip  = playerEl.querySelector('.ax-btn-skip');
  const counter  = playerEl.querySelector('.ax-head-count');
  const card     = playerEl.closest('.strategy-card');
  const ruleBody = card ? card.querySelector('.sc-body') : null;
  const stratId  = playerEl.dataset.strat;

  let idx = -1, playing = false, elapsed = 0, last = 0, raf = null;

  function openRule(scroll) {
    if (ruleBody && ruleBody.classList.contains('ax-locked')) {
      ruleBody.classList.remove('ax-locked');
      ruleBody.classList.add('ax-unlocked');
    }
    axMarkWatched(stratId);
    if (scroll && ruleBody) {
      setTimeout(() => ruleBody.scrollIntoView({ behavior: 'smooth', block: 'start' }), 250);
    }
  }

  function paint() {
    segFills.forEach((f, i) => {
      f.style.width = i < idx ? '100%'
                    : i > idx ? '0%'
                    : durs[i] ? `${AX_CLAMP(elapsed / durs[i] * 100, 0, 100)}%` : '100%';
    });
  }

  function show(i) {
    idx = i;
    elapsed = 0;
    sceneEls.forEach((el, j) => el.classList.toggle('active', j === i));
    counter.textContent = `${i + 1} / ${sceneEls.length}`;
    paint();
    if (durs[i] === 0) { // terminal outro scene
      stop();
      btnTog.disabled = true;
      btnTog.textContent = '✅ خلص الشرح';
      openRule(false);
    }
  }

  function tick(ts) {
    if (!playing) return;
    elapsed += ts - last;
    last = ts;
    if (elapsed >= durs[idx]) {
      show(idx + 1);
      if (durs[idx] === 0) return; // landed on outro
      last = ts;
    }
    paint();
    raf = requestAnimationFrame(tick);
  }

  function play() {
    if (playing || (idx >= 0 && durs[idx] === 0)) return;
    poster.classList.add('hidden');
    playing = true;
    btnTog.disabled = false;
    btnTog.textContent = '⏸ إيقاف';
    playerEl.classList.add('ax-playing');
    if (idx < 0) show(0);
    last = performance.now();
    raf = requestAnimationFrame(tick);
  }

  function stop() {
    playing = false;
    playerEl.classList.remove('ax-playing');
    if (raf) cancelAnimationFrame(raf);
  }

  function pause() {
    stop();
    btnTog.textContent = '▶ كمّل';
  }

  function replay() {
    stop();
    btnTog.disabled = false;
    sceneEls.forEach(el => el.classList.remove('active'));
    idx = -1;
    poster.classList.add('hidden');
    play();
  }

  poster.addEventListener('click', play);
  btnTog.addEventListener('click', () => (playing ? pause() : play()));
  btnRep.addEventListener('click', replay);
  btnSkip.addEventListener('click', () => {
    stop();
    show(sceneEls.length - 1);
    poster.classList.add('hidden');
    openRule(true);
  });

  // Tap the screen to pause/resume mid-playback
  playerEl.querySelector('.ax-screen').addEventListener('click', (e) => {
    if (e.target.closest('.ax-poster') || e.target.closest('.ax-open-rule')) return;
    if (idx >= 0 && durs[idx] !== 0) (playing ? pause() : play());
  });

  const openBtn = playerEl.querySelector('.ax-open-rule');
  if (openBtn) openBtn.addEventListener('click', () => openRule(true));
}

// ── INIT (called from bindInteractiveElements) ────────────────
function initAnimExplainers(root) {
  (root || document).querySelectorAll('.ax-player').forEach(axSetupPlayer);
}
