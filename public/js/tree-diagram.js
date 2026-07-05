/* ================================================================
   TREE-DIAGRAM.JS — Infographic Grammar Poster Builder
   Renders strategy.formulas as a poster-style infographic:
   [icon] [subject chip] ⋯ [formula pill] │ [example]
   + dashed tip banner (Arabic) at the bottom.
   Grammar Strategies — Ayed Academy
   ================================================================ */

/**
 * renderTreeDiagram(strat)
 * Builds the full infographic board from strat.formulas.
 * Row types are detected from the subject label:
 *   - "Negative / نفي"   → green row with − icon
 *   - "Question / سؤال"  → purple row with ? icon
 *   - anything else       → blue subject row
 */
function renderTreeDiagram(strat) {
  const formulas = strat.formulas || [];
  if (!formulas.length) return '';

  const subjIcons = ['👥', '👤', '🗣️', '✳️', '🔹', '🔸'];
  const exIcons   = ['📖', '📅', '✏️', '🔖', '💬', '📌'];
  let subjCount = 0;

  const rows = formulas.map(f => {
    const type = tdxRowType(f.subj || '');
    let icon, exIcon, aux = '', chipSub = '';

    if (type === 'neg') {
      icon = '−'; exIcon = '❎';
      aux = tdxAuxOf(f.form);
      if (!/[؀-ۿ]/.test(f.subj)) chipSub = 'النفي';
    } else if (type === 'q') {
      icon = '?'; exIcon = '❓';
      aux = tdxAuxOf(f.form);
      if (!/[؀-ۿ]/.test(f.subj)) chipSub = 'السؤال';
    } else {
      icon = subjIcons[Math.min(subjCount, subjIcons.length - 1)];
      exIcon = exIcons[subjCount % exIcons.length];
      subjCount++;
    }

    return tdxRow({
      type, icon, exIcon, aux,
      chip: f.subj || '',
      chipSub,
      form: f.form || '',
      ex: f.ex || '',
      note: f.note || ''
    });
  }).join('');

  return `
    <div class="tdx-board">
      ${tdxHeader(strat)}
      <div class="tdx-rows" dir="ltr">${rows}</div>
      ${tdxTip(strat)}
    </div>
  `;
}

// ── Row type from the subject label ───────────────────────────
function tdxRowType(subj) {
  const s = subj.toLowerCase();
  if (s.includes('negative') || subj.includes('نفي')) return 'neg';
  if (s.includes('question') || subj.includes('سؤال') || subj.includes('استفهام')) return 'q';
  return 'subj';
}

// ── Extract the auxiliary chip (e.g. "do/does") from a formula ─
function tdxAuxOf(form) {
  const plain = tdxPlain(form);
  if (!plain.includes('+')) return '';
  const first = plain.split('+')[0].trim();
  return (first.length > 0 && first.length <= 12) ? first : '';
}

function tdxPlain(html) {
  return (html || '').replace(/<[^>]+>/g, '');
}

// ── Formula pill formatting: highlight endings, style the + ──
function tdxFormatForm(form) {
  return (form || '')
    .replace(/<span class="s">([\s\S]*?)<\/span>/g, '<b class="tdx-hl">$1</b>')
    .replace(/\+/g, '<span class="tdx-plus">+</span>');
}

// ── Poster header: "Present Simple" with accent last word ─────
function tdxHeader(strat) {
  const en = (strat.subtitle || '').trim();
  if (!en) return '';
  const words = en.split(/\s+/);
  const last = words.length > 1 ? words.pop() : '';
  return `
    <div class="tdx-header">
      <span class="tdx-flair" aria-hidden="true"><i></i><i></i><i></i></span>
      <div class="tdx-title-wrap">
        <div class="tdx-title" dir="ltr">
          ${words.join(' ')}${last ? ` <span class="accent">${last}</span>` : ''}
          <span class="tdx-spark" aria-hidden="true">✦</span>
        </div>
        <div class="tdx-title-underline"><i></i></div>
      </div>
    </div>
  `;
}

// ── One poster row ─────────────────────────────────────────────
function tdxRow(cfg) {
  const hasExample = !!cfg.ex;
  return `
    <div class="tdx-row tdx-${cfg.type}">
      <div class="tdx-left">
        <span class="tdx-badge">${cfg.icon}</span>
        <span class="tdx-chip">${cfg.chip}${cfg.chipSub ? `<small>${cfg.chipSub}</small>` : ''}</span>
        <span class="tdx-dots"></span>
        ${cfg.aux ? `<span class="tdx-aux" dir="ltr">${cfg.aux}</span><span class="tdx-dots tdx-dots-sm"></span>` : ''}
        <span class="tdx-pill" dir="ltr">${tdxFormatForm(cfg.form)}</span>
      </div>
      ${hasExample ? `
        <div class="tdx-sep"></div>
        <div class="tdx-right">
          <span class="tdx-ex-icon">${cfg.exIcon}</span>
          <div class="tdx-ex-body">
            <div class="tdx-ex" dir="ltr">${cfg.ex}</div>
            ${cfg.note ? `<div class="tdx-note">${cfg.note}</div>` : ''}
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

// ── Dashed tip banner (Arabic) — uses strat.tip or strat.usage ─
function tdxTip(strat) {
  const tip = strat.tip || strat.usage;
  if (!tip) return '';
  return `
    <div class="tdx-tip">
      <span class="tdx-tip-icon">💡</span>
      <div class="tdx-tip-text">${tip}</div>
      <span class="tdx-tip-pen" aria-hidden="true">✍️</span>
    </div>
  `;
}
