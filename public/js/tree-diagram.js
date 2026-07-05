/**
 * tree-diagram.js
 * Generates the Premium Cambridge-style syntax tree infographic.
 */

// ── MAIN RENDERER ─────────────────────────────────────────
function renderTreeDiagram(content) {
  let html = `<div class="cg-wrapper">`;

  // Optional Header
  if (content.title) {
    html += `
      <div class="cg-header">
        <span class="cg-header-icon" data-icon="git-merge"></span>
        <span>${content.title}</span>
      </div>`;
  }

  // Scroll container for mobile swipeability
  html += `<div class="cg-container scroll-x snap-scroll">`;

  if (content.treeDiagram) {
    html += buildFromConfig(content.treeDiagram, content.keywords || []);
  } else {
    // Legacy fallback for old data structures
    html += buildLegacyFallback(content);
  }

  html += `</div></div>`;
  return html;
}

// ── BUILD FROM RICH CONFIG (treeDiagram key) ──────────────────
function buildFromConfig(cfg, keywords) {
  const numGroups = (cfg.groups || []).length;
  // Make the brace height dynamic but constrained
  const braceHeight = numGroups > 1 ? `calc(100% - 3rem)` : '0';

  let flowHtml = `<div class="cg-flow">`;

  // 1. LEFT SIDE: Groups (Subjects + Auxiliaries)
  flowHtml += `<div class="cg-groups">`;
  (cfg.groups || []).forEach(group => {
    flowHtml += `<div class="cg-group">`;
    
    // Subject Node
    flowHtml += `<div class="cg-node cg-node-subj">`;
    flowHtml += `<div class="cg-subj-list">` + group.subjects.join('<span class="cg-comma">, </span>') + `</div>`;
    if (group.label) {
      flowHtml += `<div class="cg-subj-label">${group.label}</div>`;
    }
    flowHtml += `</div>`; // .cg-node-subj

    // Horizontal Line connecting Subj to Aux
    flowHtml += `<div class="cg-connector-hz"></div>`;

    // Auxiliary Node
    const auxLower = group.auxiliary.toLowerCase().trim();
    let auxClass = 'aux-generic';
    if (['was','were','have','has','had','will','am','is','are','do','does','did'].includes(auxLower)) {
      auxClass = `aux-${auxLower}`;
    }
    flowHtml += `<div class="cg-node cg-node-aux ${auxClass}">${group.auxiliary}</div>`;

    flowHtml += `</div>`; // .cg-group
  });
  flowHtml += `</div>`; // .cg-groups

  // 2. MIDDLE: Brace Connector (Pure CSS curves)
  if (numGroups > 1) {
    flowHtml += `
      <div class="cg-brace-wrapper">
        <div class="cg-brace-top"></div>
        <div class="cg-brace-mid" style="height: ${braceHeight};"></div>
        <div class="cg-brace-bot"></div>
        <div class="cg-brace-join"></div>
      </div>
    `;
  } else {
    // Single row, just a straight line
    flowHtml += `
      <div class="cg-brace-wrapper single">
        <div class="cg-connector-hz long"></div>
      </div>
    `;
  }

  // 3. RIGHT SIDE: Result (Formula + Example)
  flowHtml += `<div class="cg-result">`;
  
  if (cfg.result) {
    // Formula Node
    if (cfg.result.formula) {
      let fHtml = cfg.result.formula.replace(/\+/g, '<span class="cg-plus">+</span>');
      if (fHtml.includes('ing')) fHtml = fHtml.replace('ing', '<span class="cg-hl-ing">ing</span>');
      if (fHtml.includes('ed')) fHtml = fHtml.replace('ed', '<span class="cg-hl-ed">ed</span>');
      flowHtml += `<div class="cg-node cg-node-formula">${fHtml}</div>`;
    }

    // Example Box
    if (cfg.result.example) {
      let exText = cfg.result.example;
      keywords.forEach(kw => {
        const regex = new RegExp(`\\b${kw}\\b`, 'gi');
        exText = exText.replace(regex, `<strong>${kw}</strong>`);
      });

      flowHtml += `
        <div class="cg-node cg-node-example">
          <div class="cg-ex-icon" data-icon="lightbulb"></div>
          <div class="cg-ex-text">${exText}</div>
        </div>
      `;
    }
  }

  flowHtml += `</div>`; // .cg-result
  flowHtml += `</div>`; // .cg-flow

  // 4. EXTRAS (Exceptions / Notes at the bottom)
  if (cfg.extras && cfg.extras.length > 0) {
    flowHtml += `<div class="cg-extras-container">`;
    cfg.extras.forEach(extra => {
      let fHtml = extra.formula.replace(/\+/g, '<span class="cg-plus">+</span>');
      flowHtml += `
        <div class="cg-extra-row">
          <div class="cg-extra-label">${extra.label}</div>
          <div class="cg-extra-content">
            <div class="cg-node cg-node-aux cg-small">${extra.auxiliary}</div>
            <div class="cg-connector-hz cg-short"></div>
            <div class="cg-node cg-node-formula cg-small">${fHtml}</div>
          </div>
        </div>
      `;
    });
    flowHtml += `</div>`;
  }

  return flowHtml;
}

// ── FALLBACK FOR OLDER DATA ───────────────────────────────────────
function buildLegacyFallback(content) {
  if (!content.tree) return '';
  let html = `<div class="cg-flow legacy-flow">`;
  html += `<div class="td-tree">`;
  
  Object.keys(content.tree).forEach(subj => {
    let aux = content.tree[subj];
    let subjList = subj.split(',').join('<span class="cg-comma">, </span>');
    html += `
      <div class="td-subject-group">
        <div class="cg-node cg-node-subj td-subject-label">${subjList}</div>
        <div class="td-connector">
          <div class="td-connector-dot"></div>
          <div class="td-connector-line"></div>
        </div>
        <div class="td-aux-col">
          <div class="cg-node cg-node-aux td-aux">${aux}</div>
        </div>
      </div>
    `;
  });
  
  html += `</div>`; // .td-tree
  
  // Right Box
  let rHtml = content.formula.replace(/\+/g, '<span class="cg-plus">+</span>');
  html += `
    <div class="td-right">
      <div class="cg-node cg-node-formula td-formula-pill">${rHtml}</div>
      <div class="cg-node cg-node-example td-example">${content.example}</div>
    </div>
  `;
  
  html += `</div>`; // .legacy-flow
  return html;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { renderTreeDiagram };
}
