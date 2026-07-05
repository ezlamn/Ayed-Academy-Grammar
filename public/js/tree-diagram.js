/* ================================================================
   TREE-DIAGRAM.JS — Visual Grammar Formula Tree Builder
   Converts strategy.formulas data into Cambridge-style tree diagrams
   Grammar Strategies — Ayed Academy
   ================================================================ */

/**
 * renderTreeDiagram(strat)
 *
 * Reads strat.formulas (and optionally strat.treeDiagram) to build
 * a visual tree chart that mirrors the Cambridge/exam-style infographic.
 *
 * If strat.treeDiagram config exists → use it for full control.
 * Otherwise → fall back to auto-grouping the existing formulas array.
 */
function renderTreeDiagram(strat) {
  // ── 1. If there's a rich treeDiagram config, use it ──────────
  if (strat.treeDiagram) {
    return buildFromConfig(strat.treeDiagram, strat.keywords);
  }

  // ── 2. Auto-group the existing formulas array ─────────────────
  return buildFromFormulas(strat.formulas, strat.keywords);
}

// ── BUILD FROM RICH CONFIG (treeDiagram key) ──────────────────
function buildFromConfig(cfg, keywords) {
  const numGroups = (cfg.groups || []).length;
  
  const groupsHtml = (cfg.groups || []).map(group => {
    const auxWord = group.aux ? group.aux.toLowerCase().split(' ')[0] : 'generic';
    return `
      <div class="cg-group">
        <div class="cg-subj">
          <div class="cg-subj-list">${group.subjects.join('<span class="cg-comma">, </span>')}</div>
          ${group.label ? `<div class="cg-subj-label">${group.label}</div>` : ''}
        </div>
        <div class="cg-line-hz"></div>
        <div class="cg-aux aux-${auxWord}">${group.aux}</div>
      </div>
    `;
  }).join('');

  let braceHtml = '';
  if (numGroups > 1) {
    braceHtml = `
      <div class="cg-brace-wrapper">
        <div class="cg-brace"></div>
      </div>
    `;
  } else {
    braceHtml = `
      <div class="cg-brace-wrapper" style="padding:0; margin: 0 0.5rem;">
        <div class="cg-line-hz" style="width: 30px; align-self: center;"></div>
      </div>
    `;
  }

  // Formula pill
  const formulaHtml = cfg.formula ? `
    <div class="cg-formula">
      ${cfg.formula
        .replace(/\+/g, '<span class="cg-plus"> + </span>')
        .replace(/\b(ing)\b/g, '<span class="cg-hl-ing">$1</span>')
        .replace(/\b(V3|V2|ed)\b/g, '<span class="cg-hl-ed">$1</span>')}
    </div>
  ` : '';

  // Example
  const exHtml = cfg.example ? `
    <div class="cg-example">
      <span class="cg-ex-icon">💡</span>
      <span class="cg-ex-text">${cfg.example}</span>
    </div>
  ` : '';

  // Extra rows
  const extraHtml = (cfg.extraRows || []).map(row => {
    const auxWord = row.aux ? row.aux.toLowerCase() : 'generic';
    const rowFormula = (row.formula || '')
      .replace(/\+/g, '<span class="cg-plus"> + </span>')
      .replace(/\b(ing)\b/g, '<span class="cg-hl-ing">$1</span>')
      .replace(/\b(V3|V2|ed)\b/g, '<span class="cg-hl-ed">$1</span>');
      
    return `
      <div class="cg-extra-row">
        <div class="cg-extra-label">${row.label || ''}</div>
        <div class="cg-extra-content">
          <div class="cg-subj cg-small">${(row.subjects || []).join(', ')}</div>
          <div class="cg-line-hz cg-short"></div>
          <div class="cg-aux aux-${auxWord} cg-small">${row.aux}</div>
          <div class="cg-line-hz cg-short"></div>
          <div class="cg-formula cg-small">${rowFormula}</div>
        </div>
        ${row.example ? `
          <div class="cg-example cg-small">
            <span class="cg-ex-icon">💡</span>
            <span class="cg-ex-text">${row.example}</span>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');

  return `
    <div class="cg-wrapper">
      <div class="cg-header">
        <span class="cg-header-icon" data-icon="gitBranch"></span>
        <span class="cg-header-text">الخريطة الذهنية للقاعدة (Mind Map)</span>
      </div>
      
      <div class="cg-container scroll-x">
        <div class="cg-flow">
          <div class="cg-groups">
            ${groupsHtml}
          </div>
          
          ${braceHtml}
          
          <div class="cg-result">
            ${formulaHtml}
            ${exHtml}
          </div>
        </div>
        
        ${extraHtml ? `<div class="cg-extras-container">${extraHtml}</div>` : ''}
      </div>
    </div>
  `;
}

// ── BUILD AUTO FROM FORMULAS ARRAY ───────────────────────────
function buildFromFormulas(formulas, keywords) {
  if (!formulas || formulas.length === 0) return '';

  // Group formulas into tree nodes (each formula = one row)
  const rowsHtml = formulas.map(f => {
    // Extract auxiliary verb from form string (was, were, have, has, had, will, am, is, are)
    const auxMatch = f.form.match(/\b(was|were|have|has|had|will|am|is|are|did|do|does)\b/i);
    const auxWord = auxMatch ? auxMatch[1].toLowerCase() : '';
    const auxClass = auxWord || 'generic';

    // Clean up the form for display
    const formParts = f.form.replace(/<[^>]+>/g, '').split('+');
    const mainAuxPart = formParts[0].trim();
    const restOfFormula = formParts.slice(1).join(' + ').trim();
    
    // We create a uniform flex row for the mind map
    return `
      <div class="td-group-row" style="display:flex; align-items:center; gap:0.5rem; margin-bottom:1rem; width: 100%;">
        <div class="td-subject-group" style="flex:0 0 120px; font-size:0.85rem; text-align:center; padding:0.6rem; border:1px solid var(--border); border-radius:var(--r-md); background:var(--surface2);">
          ${f.subj.replace(/\//g, ' /<br>')}
        </div>
        
        <div style="flex:0 0 20px; border-top:1.5px solid var(--gold-lt); position:relative;">
          <div style="position:absolute; right:-4px; top:-4.5px; width:9px; height:9px; border-radius:50%; background:var(--gold-lt);"></div>
        </div>
        
        ${auxWord ? `
        <div class="td-aux ${auxClass}" style="flex:0 0 70px; padding:0.5rem; font-size:0.9rem; border-radius:var(--r-md);">
          ${mainAuxPart}
        </div>
        <div style="flex:0 0 20px; border-top:1.5px solid var(--gold-lt); position:relative;">
          <div style="position:absolute; right:-4px; top:-4.5px; width:9px; height:9px; border-radius:50%; background:var(--gold-lt);"></div>
        </div>
        ` : ''}
        
        <div style="flex:1; display:flex; flex-direction:column; gap:0.4rem;">
          <div class="td-formula-pill" style="font-size:0.88rem; padding:0.38rem 0.85rem; align-self:flex-start; margin:0;">
            ${f.form}
          </div>
          ${f.ex ? `<div class="td-example" style="margin:0; font-size:0.84rem;">${f.ex}</div>` : ''}
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="tree-formula-wrap">
      <div class="tree-formula-title" style="margin-bottom: 1.5rem;">📌 التكوين الجرافيكي للقاعدة (Mind Map):</div>
      <div class="tree-diagram" style="flex-direction:column; background:transparent; border:none; box-shadow:none; direction:ltr;">
        <div class="td-tree" style="flex-direction:column; gap:0.5rem; padding:0; background:transparent;">
          ${rowsHtml}
        </div>
      </div>
    </div>
  `;
}

// ── HELPER: Build a "Past Progressive" style tree (2-group split) ──
// This is the IDEAL format for tenses with was/were or have/has split.
// Teachers can use the treeDiagram key in db.json for this:
//
// "treeDiagram": {
//   "groups": [
//     { "subjects": ["I", "he", "she", "it"], "label": "المفرد", "aux": "was" },
//     { "subjects": ["you", "we", "they"],    "label": "الجمع",  "aux": "were" }
//   ],
//   "formula": "+ verb + ing",
//   "example": "While I <strong>was sleeping</strong>, he called me."
// }
