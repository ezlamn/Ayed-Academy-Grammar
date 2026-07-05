/* ================================================================
   RENDERERS.JS — Unit & Strategy HTML Renderers
   Covers: Grammar, Reading, Listening, Vocab track renderers
   Grammar Strategies — Ayed Academy
   ================================================================ */

// ── COLLAPSE CARET (strategy cards are collapsed by default) ──
function scCaret() {
  return `<span class="sc-caret">${window.AyIcon ? AyIcon.svg('chevron-left') : ''}</span>`;
}

// ── VIDEO EMBED HELPER ────────────────────────────────────────
// Supports YouTube, Vimeo, and direct uploaded files (mp4/webm/ogg).
function getVideoEmbed(url) {
  if (!url) return '';
  url = String(url).trim();

  // YouTube (watch, youtu.be, shorts, embed)
  let ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if (ytMatch) {
    return `<iframe src="https://www.youtube.com/embed/${ytMatch[1]}" title="فيديو الشرح" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>`;
  }

  // Vimeo
  let vmMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vmMatch) {
    return `<iframe src="https://player.vimeo.com/video/${vmMatch[1]}" title="فيديو الشرح" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen loading="lazy"></iframe>`;
  }

  // Direct file
  return `<video controls preload="metadata" playsinline src="${url}"></video>`;
}

// ── RENDER A LABELLED VIDEO BOX (for strategy media) ──────────
function renderVideoBox(url, label) {
  const embed = getVideoEmbed(url);
  if (!embed) return '';
  return `<div class="nb-video-box"><span class="nb-video-label">${label || '🎬 فيديو الشرح'}</span>${embed}</div>`;
}

// ── RENDER UNIT VIDEO LIBRARY ─────────────────────────────────
// Reads unit.page.videos = [{ title, url }] and renders a grid.
function renderVideoLibrary(unit) {
  const vids = (unit.page && unit.page.videos) || [];
  if (!vids.length) return '';
  const cards = vids.map(v => {
    const embed = getVideoEmbed(v.url);
    if (!embed) return '';
    return `
      <div class="nb-video-card">
        <div class="nb-video-box">${embed}</div>
        ${v.title ? `<div class="nb-video-card-title">▶ ${v.title}</div>` : ''}
      </div>`;
  }).join('');
  if (!cards) return '';
  return `
    <div class="nb-video-library animate-in">
      <div class="nb-video-library-head">
        🎥 مكتبة فيديوهات الوحدة
        <span class="nb-vl-badge">${vids.length} فيديو</span>
      </div>
      <div class="nb-video-grid">${cards}</div>
    </div>`;
}

// ── FORMAT PASSAGE TEXT ───────────────────────────────────────
function formatPassageText(text) {
  const lines = text.split(/\\n|\n/);
  return lines.map(line => {
    line = line.trim();
    if (!line) return '';
    if (line.toUpperCase().includes('PASSAGE')) {
      return `<div style="font-weight:900; color:var(--gold); font-size:1.1rem; margin-bottom:0.5rem; text-align:center;">${line}</div>`;
    }
    return `<div style="margin-bottom:0.8rem; text-align:justify; line-height:1.8;">${line}</div>`;
  }).join('');
}

// ── RENDER UNIT (dispatcher) ──────────────────────────────────
// Shared "قاعدة" card used by grammar + listening strategies.
// Splits the free-form body (lines separated by <br>) into rows;
// short <strong> tokens (e.g. "s", "es", "goes") become a badge
// pill on the trailing edge, mirroring a highlighted suffix/rule.
const RULE_ROW_ICONS = ['👍', '⭐', '✏️', '📌', '🔎'];
function renderRuleBox(exc) {
  if (!exc) return '';
  const title = (exc.title || '').replace(/^\s*⚠️\s*/, '');
  const lines = (exc.body || '').split(/<br\s*\/?>/i).map(l => l.trim()).filter(Boolean);

  const rowsHtml = lines.map((line, i) => {
    const m = line.match(/<strong>(.*?)<\/strong>/i);
    let badge = '', text = line;
    if (m && m[1].replace(/<[^>]+>/g, '').trim().length <= 14 && !/\s/.test(m[1].replace(/<[^>]+>/g, '').trim())) {
      badge = `<span class="rule-row-badge">${m[1]}</span>`;
      text = (line.slice(0, m.index) + line.slice(m.index + m[0].length)).replace(/^[\s:،]+/, '').trim();
    }
    return `
      <div class="rule-row">
        <span class="rule-row-icon">${RULE_ROW_ICONS[i % RULE_ROW_ICONS.length]}</span>
        <span class="rule-row-text">${text}</span>
        ${badge}
      </div>`;
  }).join('');

  return `
    <div class="rule-box">
      <div class="rule-box-header">
        <span class="rule-box-title">${title}</span>
        <span class="rule-box-lamp">💡</span>
      </div>
      <div class="rule-box-rows">${rowsHtml}</div>
    </div>`;
}

function renderUnit(unit) {
  const pc = $('page-content');
  if (GS.currentTrack === 'listening') {
    pc.innerHTML = renderListeningUnit(unit);
    bindInteractiveElements();
    return;
  }
  if (GS.currentTrack === 'reading') {
    pc.innerHTML = renderReadingUnit(unit);
    bindInteractiveElements();
    return;
  }

  const p = unit.page || {};
  let html = `
    <div class="unit-header animate-in">
      <div>
        <div class="unit-tag">${p.tag || ''}</div>
        <div class="unit-h-title">${unit.emoji} ${unit.nameAr}</div>
        <div class="unit-h-en">${unit.nameEn}</div>
      </div>
      <div class="unit-h-mascot">${p.mascot || ''}</div>
    </div>
  `;

  html += renderVideoLibrary(unit);

  (p.strategies || []).forEach((s, si) => {
    html += renderStrategy(s, si);
  });

  const quizzes = p.quizzes || [];
  if (quizzes.length > 0) {
    html += `
      <div class="unit-end-cta animate-in">
        <h3>هل أنت مستعد للاختبار الشامل؟</h3>
        <p>تم تغطية جميع الاستراتيجيات. أجب عن الأسئلة لتتحقق من فهمك.</p>
        <button id="open-big-quiz">🎯 بدء الاختبار الشامل للوحدة (${quizzes.length} أسئلة)</button>
      </div>
    `;
  }

  pc.innerHTML = html;
  bindInteractiveElements();
}

// ── RENDER GRAMMAR STRATEGY ───────────────────────────────────
function renderStrategy(strat, si) {
  const mediaHtml = `
    ${strat.videoUrl ? renderVideoBox(strat.videoUrl, '🎬 شرح بالفيديو') : ''}
    ${strat.imageUrl ? `<div class="media-box"><img src="${strat.imageUrl}" alt="صورة توضيحية"></div>` : ''}
    ${strat.audioUrl ? `<div class="media-box"><audio controls src="${strat.audioUrl}"></audio></div>` : ''}
  `;

  const kwHtml = (strat.keywords || []).map(kw => `
    <div class="kw-reveal" onclick="this.classList.toggle('expanded')">
      <div class="kw-en-box">${kw.f}</div>
      <div class="kw-ar-box">${kw.b}</div>
    </div>
  `).join('');

  const formulaHtml = (strat.formulas && strat.formulas.length > 0) ? renderTreeDiagram(strat) : '';

  const exHtml = strat.exception ? `
    <div class="exception-box">
      <div class="ex-title">${strat.exception.title}</div>
      <div class="ex-body">${strat.exception.body}</div>
    </div>
  ` : '';

  const letters = ['A', 'B', 'C', 'D'];
  const practiceHtml = (strat.practice && strat.practice.length > 0) ? `
    <div class="mini-quiz-wrap">
      <div class="mini-quiz-header">
        <span>💡</span> جرّب بنفسك!
        <span class="mq-badge">تدريب</span>
      </div>
      ${strat.practice.map((pq, pi) => {
        const qid = `${strat.id}-p${pi}`;
        // Dispatch to creative question types
        if (pq.type === 'order' && typeof renderOrderQuestion === 'function') return renderOrderQuestion(pq, qid);
        if (pq.type === 'fill'  && typeof renderFillQuestion  === 'function') return renderFillQuestion(pq, qid);
        return `
          <div class="mini-q" id="mq-wrap-${qid}">
            ${pq.audioUrl ? `
              <div class="listening-audio-wrap">
                <span class="listening-audio-label">🎧 استمع للمقطع أولاً</span>
                <audio controls src="${pq.audioUrl}"></audio>
              </div>
            ` : ''}
            <div class="mini-q-text">${pq.q}</div>
            <div class="mini-opts">
              ${pq.opts.map((o, oi) => `
                <button class="mini-opt" data-qid="${qid}" data-idx="${oi}" dir="ltr" style="text-align:left;">
                  <span class="opt-letter">${letters[oi]}</span>${o}
                </button>
              `).join('')}
            </div>
            <div class="mini-q-actions">
              <button class="btn btn-primary btn-check-ans hidden" id="check-${qid}" data-qid="${qid}" data-correct="${pq.c}">تحقق من الإجابة</button>
            </div>
            <div class="mini-expl" id="mq-expl-${qid}">
              <div class="expl-text">${pq.expl}</div>
              <button class="btn btn-secondary btn-sm return-rule-btn" onclick="document.getElementById('${strat.id}').scrollIntoView({behavior:'smooth'})">↩️ العودة لشرح القاعدة</button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  ` : '';

  // Animated explainer plays first; the rule stays locked until it
  // finishes (or the user skips). Already-watched rules start open.
  const hasAnim = typeof renderAnimExplainer === 'function';
  const animHtml = hasAnim ? renderAnimExplainer(strat) : '';
  const ruleLocked = hasAnim && typeof axIsWatched === 'function' && !axIsWatched(strat.id);

  return `
    <div class="strategy-card ${strat.theme} animate-in sc-collapsed" id="${strat.id}" style="animation-delay:${si * 0.07}s">
      <div class="sc-header" title="اضغط للفتح / الإغلاق">
        <span class="sc-header-icon">${strat.icon}</span>
        <div class="sc-header-texts">
          <div class="sc-title">${strat.title}</div>
          <div class="sc-subtitle">${strat.subtitle}</div>
        </div>
        <span class="sc-badge">${strat.badge}</span>
        ${scCaret()}
      </div>
      ${animHtml}
      <div class="sc-body${ruleLocked ? ' ax-locked' : ''}">
        <div class="sc-keywords">
          <div class="kw-grid">
            <div class="sc-keywords-title">🔑 الكلمات الدالة <small style="font-weight:400;color:rgba(255,255,255,0.4);font-size:0.65rem">(انقر للترجمة)</small></div>
            ${kwHtml}
          </div>
        </div>
        <div class="sc-content">
          ${mediaHtml}
          ${formulaHtml ? '' : `<div class="usage-banner">${strat.usage}</div>`}
          ${formulaHtml}
          ${exHtml}
          ${practiceHtml}
        </div>
      </div>
    </div>
  `;
}

// ── RENDER READING UNIT ───────────────────────────────────────
function renderReadingUnit(unit) {
  const p = unit.page || {};

  if (unit.type === 'vocab' && p.vocabCategories) {
    return renderVocabUnit(unit);
  }

  let html = `
    <div class="reading-unit animate-in">
      <div class="rd-section-header">
        <div class="rd-header-ar">${unit.title.split(':')[1] || unit.title}</div>
        <div class="rd-header-en">( READING STRATEGY )</div>
        <div class="rd-header-icon">📖</div>
      </div>
  `;

  html += renderVideoLibrary(unit);

  (p.strategies || []).forEach((s, si) => {
    html += `
      <div class="rd-strategy-section sc-collapsed" id="${s.id}" style="animation-delay:${si * 0.07}s">
        <div class="rd-strategy-banner ${s.theme}" title="اضغط للفتح / الإغلاق">
          <span>${s.icon}</span> ${s.title}
          <span class="rd-strategy-subtitle">${s.subtitle}</span>
          ${scCaret()}
        </div>
        ${s.videoUrl ? renderVideoBox(s.videoUrl, '🎬 شرح بالفيديو') : ''}
        <div class="rd-usage-box">${s.usage.replace(/\\n/g, '<br>')}</div>
        ${s.keywords && s.keywords.length > 0 ? `
          <div class="rd-keywords-grid">
            ${s.keywords.map(kw => `
              <div class="rd-kw-row">
                <span class="rd-kw-en" dir="ltr">${kw.f}</span>
                <span class="rd-arrow">←</span>
                <span class="rd-kw-ar">${kw.b}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}
        ${s.practice && s.practice.length > 0 ? `
          <div class="mini-quiz-wrap" style="margin-top:1.5rem;">
            <div class="mini-quiz-header"><span>💡</span> تدريب تطبيقي <span class="mq-badge">تدريب</span></div>
            ${s.practice.map((pq, pi) => {
              const qid = `${s.id}-p${pi}`;
              return `
                <div class="rd-split-wrap mini-q" id="mq-wrap-${qid}">
                  <div class="rd-split-left">
                    ${pq.imgUrl ? `<img src="${pq.imgUrl}" alt="Reading Passage Image" class="rd-passage-img" />` : ''}
                    <div class="rd-passage-text" dir="ltr">${formatPassageText(pq.passageText)}</div>
                  </div>
                  <div class="rd-split-right">
                    <div class="rd-split-qnum" dir="ltr" style="text-align:left;">${pi + 1} - ${pq.q}</div>
                    <div class="ls-radio-opts">
                      ${pq.opts.map((o, oi) => `
                        <label class="ls-radio-opt">
                          <input type="radio" name="rd-q-${qid}" data-qid="${qid}" data-idx="${oi}" style="display:none">
                          <span class="ls-radio-letter">${['A', 'B', 'C', 'D'][oi]}</span>
                          <span class="ls-radio-text" dir="ltr" style="text-align:left;">${o}</span>
                        </label>
                      `).join('')}
                    </div>
                    <button class="btn btn-primary btn-check-ans hidden" id="check-${qid}" data-qid="${qid}" data-correct="${pq.c}">تحقق من الإجابة</button>
                    <div class="mini-expl" id="mq-expl-${qid}" style="direction:rtl; text-align:right;">
                      <div class="expl-text">${pq.expl}</div>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        ` : ''}
      </div>
    `;
  });

  html += `</div>`;
  return html;
}

// ── RENDER LISTENING UNIT ─────────────────────────────────────
function renderListeningUnit(unit) {
  const p = unit.page || {};

  if (p.type === 'vocabulary' && p.vocabCategories) {
    return renderVocabUnit(unit);
  }

  const isFirstUnit = unit.id === 1;

  let html = `
    <div class="listening-unit animate-in">
      <div class="ls-section-header">
        <div class="ls-header-ar">قسم الإستماع</div>
        <div class="ls-header-en">( LISTENING )</div>
        <div class="ls-header-icon">🎧</div>
      </div>
  `;

  if (isFirstUnit) {
    html += `
      <div class="ls-info-box animate-in">
        <div class="ls-info-title">معلومات عامة عن قسم الاستماع</div>
        <div class="ls-info-rows">
          <div class="ls-info-row"><span class="ls-info-icon">🎧</span><span class="ls-info-label">ترتيب القسم:</span><span class="ls-info-val">الأول من الاختبار</span></div>
          <div class="ls-info-row"><span class="ls-info-icon">🎧</span><span class="ls-info-label">عدد الأسئلة:</span><span class="ls-info-val">٢٠ سؤال</span></div>
          <div class="ls-info-row"><span class="ls-info-icon">🎧</span><span class="ls-info-label">الدرجة الكلية:</span><span class="ls-info-val">٢٠ درجة</span></div>
          <div class="ls-info-row"><span class="ls-info-icon">🎧</span><span class="ls-info-label">مدة القسم:</span><span class="ls-info-val">٢٥ دقيقة</span></div>
        </div>
        <div class="ls-format-title">شكل الاختبار:</div>
        <div class="ls-format-body">الشاشة مقسمة لجزئين:</div>
        <div class="ls-format-row"><span class="ls-format-icon">📋</span><span><b>الجزء الأيسر</b> يوجد به المقطع الصوتي مع مجموعة تعليمات</span></div>
        <div class="ls-format-row"><span class="ls-format-icon">📋</span><span><b>الجزء الأيمن</b> يوجد به الأسئلة و الاختيارات</span></div>
      </div>
    `;
  }

  html += renderVideoLibrary(unit);

  (p.strategies || []).forEach((s, si) => {
    html += renderListeningStrategy(s, si);
  });

  const quizzes = p.quizzes || [];
  if (quizzes.length > 0) {
    html += `
      <div class="unit-end-cta animate-in" style="margin-top:2rem;">
        <h3>هل أنت مستعد للاختبار الشامل؟</h3>
        <p>أجب عن أسئلة الاستماع بعد الاستماع لكل مقطع.</p>
        <button id="open-big-quiz">🎯 بدء الاختبار الشامل للوحدة (${quizzes.length} أسئلة)</button>
      </div>
    `;
  }

  html += `</div>`;
  return html;
}

// ── RENDER LISTENING STRATEGY ─────────────────────────────────
function renderListeningStrategy(s, si) {
  const letters = ['a', 'b', 'c', 'd'];

  if (s.practice && s.practice.length > 0 && s.practice[0].audioUrl) {
    const practiceQs = s.practice.map((pq, pi) => {
      const qid = `${s.id}-p${pi}`;
      return `
        <div class="ls-split-wrap mini-q" id="mq-wrap-${qid}">
          <div class="ls-split-left">
            <div class="ls-split-instructions">
              You will hear a conversation. Listen carefully and answer the question. You will hear it only once. You now have 15 seconds.
            </div>
            <div class="listening-audio-wrap">
              <audio controls src="${pq.audioUrl}"></audio>
            </div>
          </div>
          <div class="ls-split-right">
            <div class="ls-split-qnum" dir="ltr" style="text-align:left;">${pi + 1} - ${pq.q}</div>
            <div class="ls-radio-opts">
              ${pq.opts.map((o, oi) => `
                <label class="ls-radio-opt">
                  <input type="radio" name="ls-q-${qid}" data-qid="${qid}" data-idx="${oi}" style="display:none">
                  <span class="ls-radio-letter">${letters[oi]}</span>
                  <span class="ls-radio-text" dir="ltr">${o}</span>
                </label>
              `).join('')}
            </div>
            <button class="btn btn-primary btn-check-ans hidden" id="check-${qid}" data-qid="${qid}" data-correct="${pq.c}">تحقق من الإجابة</button>
            <div class="mini-expl" id="mq-expl-${qid}">
              <div class="expl-text">${pq.expl}</div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="ls-strategy-section animate-in sc-collapsed" id="${s.id}" style="animation-delay:${si * 0.07}s">
        <div class="ls-strategy-banner ${s.theme}" title="اضغط للفتح / الإغلاق">
          <span>${s.icon}</span> ${s.title}
          <span class="ls-strategy-subtitle">${s.subtitle}</span>
          ${scCaret()}
        </div>
        ${s.videoUrl ? renderVideoBox(s.videoUrl, '🎬 شرح بالفيديو') : ''}
        <div class="ls-usage-box">${s.usage}</div>
        ${s.exception ? `
          <div class="ls-exception-box">
            <div class="ls-exception-title">${s.exception.title}</div>
            <div class="ls-exception-body">${s.exception.body}</div>
          </div>
        ` : ''}
        ${practiceQs}
      </div>
    `;
  }

  return `
    <div class="ls-strategy-section animate-in sc-collapsed" id="${s.id}" style="animation-delay:${si * 0.07}s">
      <div class="ls-strategy-banner ${s.theme}" title="اضغط للفتح / الإغلاق">
        <span>${s.icon}</span> ${s.title}
        <span class="ls-strategy-subtitle">${s.subtitle}</span>
        ${scCaret()}
      </div>
      <div class="ls-usage-box">${s.usage}</div>
      ${s.keywords && s.keywords.length > 0 ? `
        <div class="ls-keywords-grid">
          ${s.keywords.map(kw => `
            <div class="ls-kw-row">
              <span class="ls-kw-en" dir="ltr">${kw.f}</span>
              <span class="ls-arrow">←</span>
              <span class="ls-kw-ar">${kw.b}</span>
            </div>
          `).join('')}
        </div>
      ` : ''}
      ${s.exception ? `
        <div class="ls-exception-box">
          <div class="ls-exception-title">${s.exception.title}</div>
          <div class="ls-exception-body">${s.exception.body}</div>
        </div>
      ` : ''}
      ${s.practice && s.practice.length > 0 ? `
        <div class="mini-quiz-wrap" style="margin-top:1.5rem;">
          <div class="mini-quiz-header"><span>💡</span> جرّب بنفسك! <span class="mq-badge">تدريب</span></div>
          ${s.practice.map((pq, pi) => {
            const qid = `${s.id}-p${pi}`;
            return `
              <div class="mini-q" id="mq-wrap-${qid}">
                ${pq.audioUrl ? `<div class="listening-audio-wrap"><span class="listening-audio-label">🎧 استمع للمقطع أولاً</span><audio controls src="${pq.audioUrl}"></audio></div>` : ''}
                <div class="mini-q-text" dir="ltr" style="text-align:left;">${pq.q}</div>
                <div class="ls-radio-opts">
                  ${pq.opts.map((o, oi) => `
                    <label class="ls-radio-opt">
                      <input type="radio" name="ls-q-${qid}" data-qid="${qid}" data-idx="${oi}" style="display:none">
                      <span class="ls-radio-letter">${letters[oi]}</span>
                      <span class="ls-radio-text" dir="ltr">${o}</span>
                    </label>
                  `).join('')}
                </div>
                <button class="btn btn-primary btn-check-ans hidden" id="check-${qid}" data-qid="${qid}" data-correct="${pq.c}">تحقق من الإجابة</button>
                <div class="mini-expl" id="mq-expl-${qid}"><div class="expl-text">${pq.expl}</div></div>
              </div>
            `;
          }).join('')}
        </div>
      ` : ''}
    </div>
  `;
}

// ── RENDER VOCAB UNIT ─────────────────────────────────────────
function renderVocabUnit(unit) {
  const p = unit.page || {};
  let html = `
    <div class="listening-unit animate-in">
      <div class="ls-section-header">
        <div class="ls-header-ar">كلمات الأماكن</div>
        <div class="ls-header-en">( PLACES WORDS )</div>
        <div class="ls-header-icon">🗺️</div>
      </div>
  `;

  (p.vocabCategories || []).forEach(cat => {
    html += `
      <div class="ls-vocab-section animate-in">
        <div class="ls-vocab-category-title" style="color: ${cat.color}">${cat.title}</div>
        <div class="flashcard-grid">
          ${cat.words.map((w) => `
            <div class="flashcard" onclick="this.classList.toggle('flipped')">
              <div class="flashcard-inner">
                <div class="flashcard-front" style="border-bottom-color: ${cat.color}">
                  <span class="fc-en" dir="ltr">${w.en}</span>
                  <span class="fc-hint">اضغط للترجمة 👆</span>
                </div>
                <div class="flashcard-back" style="background: ${cat.color}15">
                  <span class="fc-ar">${w.ar}</span>
                  <div class="srs-buttons">
                    <button class="srs-btn srs-hard" onclick="event.stopPropagation(); processSRS('${w.en}', 'hard')">صعب</button>
                    <button class="srs-btn srs-good" onclick="event.stopPropagation(); processSRS('${w.en}', 'good')">جيد</button>
                    <button class="srs-btn srs-easy" onclick="event.stopPropagation(); processSRS('${w.en}', 'easy')">سهل</button>
                  </div>
                  <button class="fc-sound-btn" onclick="event.stopPropagation(); playVocabSound('${w.en.replace(/'/g, "\\'")}')">🔊</button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  });

  html += `</div>`;
  return html;
}

// ── VOCAB PRONUNCIATION ───────────────────────────────────────
function playVocabSound(text) {
  const msg = new SpeechSynthesisUtterance(text);
  msg.lang = 'en-US';
  window.speechSynthesis.speak(msg);
  addXP(1, null);
}

// ── BIND INTERACTIVE ELEMENTS ─────────────────────────────────
function bindInteractiveElements() {
  const pc = $('page-content');

  // Mini quiz option selection
  pc.querySelectorAll('.mini-opt').forEach(btn => {
    btn.addEventListener('click', function () {
      const qid = this.dataset.qid;
      const wrap = $(`mq-wrap-${qid}`);
      if (wrap.dataset.answered) return;

      wrap.querySelectorAll('.mini-opt').forEach(b => b.classList.remove('selected'));
      this.classList.add('selected');
      wrap.dataset.selectedIdx = this.dataset.idx;
      $(`check-${qid}`).classList.remove('hidden');
    });
  });

  // Listening Radio Option selection
  pc.querySelectorAll('.ls-radio-opt input').forEach(radio => {
    radio.addEventListener('change', function () {
      const qid = this.dataset.qid;
      const oi = parseInt(this.dataset.idx);
      const wrap = $(`mq-wrap-${qid}`);
      if (wrap && wrap.dataset.answered) return;

      pc.querySelectorAll(`input[name="${this.name}"]`).forEach(r => {
        r.closest('.ls-radio-opt').classList.remove('selected');
      });
      this.closest('.ls-radio-opt').classList.add('selected');

      if (wrap) wrap.dataset.selectedIdx = oi;
      const checkBtn = $(`check-${qid}`);
      if (checkBtn) checkBtn.classList.remove('hidden');
    });
  });

  // Check Answer logic
  pc.querySelectorAll('.btn-check-ans').forEach(btn => {
    btn.addEventListener('click', function () {
      const qid = this.dataset.qid;
      const wrap = $(`mq-wrap-${qid}`);
      const correct = parseInt(this.dataset.correct);
      const selected = parseInt(wrap.dataset.selectedIdx);

      wrap.dataset.answered = '1';
      this.classList.add('hidden');

      wrap.querySelectorAll('.mini-opt').forEach((b, i) => {
        b.disabled = true;
        b.classList.remove('selected');
        if (i === correct) b.classList.add('opt-correct');
        else if (i === selected) b.classList.add('opt-wrong');
      });

      wrap.querySelectorAll('.ls-radio-opt').forEach((label, i) => {
        label.style.pointerEvents = 'none';
        label.classList.remove('selected');
        if (i === correct) label.classList.add('correct');
        else if (i === selected) label.classList.add('wrong');
        const letter = label.querySelector('.ls-radio-letter');
        if (letter) {
          if (i === correct) letter.style.background = 'var(--green)';
          else if (i === selected) letter.style.background = 'var(--red)';
        }
      });

      $(`mq-expl-${qid}`).classList.add('show');

      if (selected === correct) {
        FX.correct.currentTime = 0;
        FX.correct.play().catch(e => console.log(e));
        registerAnswer(true, event);
        if (typeof nbAwardSpeed === 'function') nbAwardSpeed(wrap, event);
        if (window.SmartAnalytics) window.SmartAnalytics.record(GS.currentTrack, true);
      } else {
        FX.wrong.currentTime = 0;
        FX.wrong.play().catch(e => console.log(e));
        registerAnswer(false, event);
        wrap.classList.remove('shake'); void wrap.offsetWidth; wrap.classList.add('shake');
        if (window.SmartAnalytics) window.SmartAnalytics.record(GS.currentTrack, false);
      }
    });
  });

  // Animated grammar explainers (play before the rule unlocks)
  if (typeof initAnimExplainers === 'function') initAnimExplainers(pc);

  // New interactive question types (arrange / fill-in)
  if (typeof bindNewQuestionTypes === 'function') bindNewQuestionTypes(pc);
  // Start per-question speed timers when they scroll into view
  if (typeof nbObserveQuestions === 'function') nbObserveQuestions(pc);

  const bigBtn = $('open-big-quiz');
  if (bigBtn) bigBtn.addEventListener('click', openBigQuiz);
}
