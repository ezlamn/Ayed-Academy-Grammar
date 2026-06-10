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
  // Build the main groups tree (was/were split, etc.)
  const groupsHtml = (cfg.groups || []).map(group => {
    const auxWord = group.aux ? group.aux.toLowerCase().split(' ')[0] : 'generic';
    return `
      <div class="td-group-row" style="display:flex; align-items:center; gap:0; margin-bottom:0.6rem;">
        <div class="td-subject-group">
          ${group.subjects.join('<br>')}
          ${group.label ? `<small>${group.label}</small>` : ''}
        </div>
        <div style="width:22px; border-top:2px dashed rgba(10,25,41,0.25); align-self:center;"></div>
        <div class="td-aux ${auxWord}">${group.aux}</div>
      </div>
    `;
  }).join('');

  // Main formula pill
  const formulaHtml = cfg.formula ? `
    <div class="td-formula-pill">
      ${cfg.formula
        .replace(/\+/g, '<span class="td-formula-plus"> + </span>')
        .replace(/\b(ing)\b/g, '<span class="hl">$1</span>')
        .replace(/\b(V3|V2|ed)\b/g, '<span class="hl">$1</span>')}
    </div>
  ` : '';

  // Main example
  const exHtml = cfg.example ? `<div class="td-example">${cfg.example}</div>` : '';

  // Extra rows (e.g. Past Perfect "had + V3")
  const extraHtml = (cfg.extraRows || []).map(row => {
    const auxWord = row.aux ? row.aux.toLowerCase() : 'generic';
    const rowFormula = (row.formula || '')
      .replace(/\+/g, '<span class="td-formula-plus"> + </span>')
      .replace(/\b(ing)\b/g, '<span class="hl">$1</span>')
      .replace(/\b(V3|V2|ed)\b/g, '<span class="hl">$1</span>');
    return `
      <div class="td-extra-row">
        <div class="td-extra-label">${row.label || ''}</div>
        <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap; margin-top:0.4rem;">
          <div class="td-subject-group" style="font-size:0.78rem; min-width:100px;">${(row.subjects || []).join(', ')}</div>
          <div style="width:14px; border-top:2px dashed rgba(10,25,41,0.2); align-self:center;"></div>
          <div class="td-aux ${auxWord}" style="padding:0.3rem 0.7rem; font-size:0.88rem;">${row.aux}</div>
          <div class="td-formula-pill" style="font-size:0.85rem; padding:0.3rem 0.8rem;">${rowFormula}</div>
        </div>
        ${row.example ? `<div class="td-example" style="margin-top:0.4rem;">${row.example}</div>` : ''}
      </div>
    `;
  }).join('');

  return `
    <div class="tree-formula-wrap">
      <div class="tree-formula-title">📌 التكوين الجرافيكي للقاعدة:</div>
      <div class="tree-diagram">
        <div class="td-tree">
          <div style="display:flex; flex-direction:column; gap:0.2rem; flex-shrink:0;">
            ${groupsHtml}
          </div>
          <div style="width:18px; border-top:2px dashed rgba(10,25,41,0.2); align-self:center; flex-shrink:0;"></div>
          <div class="td-right" style="border-right:none; gap:0.5rem;">
            ${formulaHtml}
            ${exHtml}
            ${extraHtml}
          </div>
        </div>
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

    // Clean up the form for display (strip html tags for the pill display)
    const cleanForm = f.form
      .replace(/<span class="s">(.*?)<\/span>/g, '<span class="hl">$1</span>')
      .replace(/<[^>]+>/g, '');

    return `
      <div class="td-group-row" style="display:flex; align-items:center; gap:0; margin-bottom:0.5rem;">
        <div class="td-subject-group" style="min-width:130px; font-size:0.78rem;">
          ${f.subj.replace(/\//g, ' /<br>')}
        </div>
        <div style="width:16px; border-top:2px dashed rgba(10,25,41,0.2); align-self:center; flex-shrink:0;"></div>
        ${auxWord ? `<div class="td-aux ${auxClass}" style="flex:0; padding:0.4rem 0.7rem; min-width:52px; font-size:0.88rem;">${f.form.replace(/<[^>]+>/g, '').split('+')[0].trim()}</div>` : ''}
        <div style="width:12px; border-top:2px dashed rgba(10,25,41,0.2); align-self:center; flex-shrink:0;"></div>
        <div style="font-family:var(--ff-en); font-weight:700; font-size:0.85rem; color:var(--text-sec); padding:0 0.4rem; flex:1;">
          <div class="td-formula-pill" style="font-size:0.85rem; padding:0.3rem 0.7rem; margin-bottom:0.3rem;">
            ${f.form}
          </div>
          <div class="td-example">${f.ex}</div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="tree-formula-wrap">
      <div class="tree-formula-title">📌 التكوين الجرافيكي للقاعدة:</div>
      <div class="tree-diagram" style="flex-direction:column;">
        <div class="td-tree" style="flex-direction:column; gap:0; padding:1rem;">
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
