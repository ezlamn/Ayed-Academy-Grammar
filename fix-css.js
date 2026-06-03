const fs = require('fs');

let css = fs.readFileSync('public/style.css');
// Find where the UTF-16 corruption starts, or just cut it off manually
// The corruption started after "/* Score screen */" at line 800.
// Let's just restore the file up to line 800 and re-add the styles properly in JS.
const originalText = fs.readFileSync('public/style.css', 'utf8');

// The corrupted part starts around /* MEDIA STYLES */ which I appended earlier
const cutIndex = originalText.indexOf('/* MEDIA STYLES */');
let cleanCss = originalText;
if(cutIndex > -1) {
  cleanCss = originalText.substring(0, cutIndex);
} else {
  // If we can't find it easily because of encoding, let's read as buffer and search for the comment
  const idx = css.indexOf(Buffer.from('/* MEDIA STYLES */', 'utf16le'));
  if (idx > -1) {
    cleanCss = css.slice(0, idx).toString('utf8');
  }
}

// Ensure the end of the file is clean
// The last valid block was the score screen
const newCSS = `
/* MEDIA STYLES */
.media-box { margin: 1rem 0; border-radius: 8px; overflow: hidden; max-width: 100%; border: 1px solid rgba(255,255,255,0.1); }
.media-box img { max-width: 100%; height: auto; display: block; }
.media-box audio { width: 100%; display: block; outline: none; background: rgba(255,255,255,0.05); }
.mini-q-actions { margin-top: 1rem; }
.return-rule-btn { margin-top: 0.5rem; display: inline-block; }
.btn-check-ans { width: 100%; }
.q-opt.correct, .mini-opt.opt-correct { background: rgba(16, 185, 129, 0.2); border-color: #10B981; color: #fff; }
.q-opt.wrong, .mini-opt.opt-wrong { background: rgba(239, 68, 68, 0.2); border-color: #EF4444; color: #fff; text-decoration: line-through; }

/* NEW KEYWORDS REVEAL */
.kw-reveal {
  display: flex; flex-direction: column; 
  background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1);
  border-radius: var(--r-sm); overflow: hidden; cursor: pointer; transition: all 0.3s;
  margin-bottom: 8px;
}
.kw-en-box {
  padding: 0.8rem 1rem; font-family: var(--ff-en); font-weight: 700; color: #fff;
  display: flex; justify-content: space-between; align-items: center;
}
.kw-en-box::after { content: '+'; color: var(--gold); font-size: 1.4rem; transition: transform 0.3s; font-weight: normal; }
.kw-reveal.expanded .kw-en-box::after { transform: rotate(45deg); color: var(--red); }
.kw-ar-box {
  background: linear-gradient(135deg, rgba(245,166,35,0.15), rgba(245,166,35,0.05));
  color: var(--gold-lt); font-size: 0.95rem; font-weight: 700;
  padding: 0 1rem; max-height: 0; opacity: 0; transition: all 0.3s ease-out; text-align: right; line-height: 1.5;
}
.kw-reveal.expanded .kw-ar-box {
  padding: 0.5rem 1rem 0.8rem 1rem; max-height: 200px; opacity: 1; border-top: 1px dashed rgba(245,166,35,0.3);
}

/* NEW FORMULA VISUAL BLOCKS */
.formula-visual-wrap { display: flex; flex-direction: column; gap: 1rem; margin-top: 0.5rem; }
.formula-v-title { font-weight: 800; color: var(--navy); margin-bottom: -0.5rem; font-size: 1.05rem; }
.formula-block {
  display: flex; align-items: stretch; background: var(--surface2);
  border: 1.5px solid var(--border); border-radius: var(--r-md); overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04); position: relative;
}
@media (max-width: 768px) {
  .formula-block { flex-direction: column; }
}
.fb-subj {
  background: linear-gradient(135deg, var(--navy), var(--navy-mid)); color: #fff;
  padding: 1.25rem 1rem; font-weight: 800; display: flex; align-items: center; justify-content: center;
  text-align: center; min-width: 160px; border-left: 4px solid var(--gold); font-size: 1.05rem;
}
.fb-form {
  padding: 1.25rem 1.5rem; font-family: var(--ff-en); font-weight: 800; font-size: 1.15rem;
  color: var(--teal); background: rgba(0,180,216,0.05); border-left: 1px dashed var(--border);
  border-right: 1px dashed var(--border); display: flex; align-items: center; justify-content: center;
  min-width: 250px; position: relative;
}
.fb-form::before {
  content: '➔'; position: absolute; left: -12px; top: 50%; transform: translateY(-50%);
  font-size: 1.2rem; color: var(--gold); background: var(--surface2); border-radius: 50%;
  width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; z-index: 2; border: 1px solid var(--border);
}
@media (max-width: 768px) {
  .fb-form::before { content: '⬇'; left: 50%; top: -12px; transform: translateX(-50%); }
  .fb-form { border-left: none; border-right: none; border-top: 1px dashed var(--border); border-bottom: 1px dashed var(--border); min-width: 0; }
}
.fb-form .s { color: var(--red); font-size: 1.15em; font-weight: 900; }
.fb-ex {
  padding: 1.25rem; font-size: 0.98rem; color: var(--text-sec); display: flex; align-items: center; flex: 1; line-height: 1.6;
}
.fb-ex strong { color: var(--navy); font-weight: 900; }
.fb-ex em { color: var(--purple); font-style: normal; font-weight: 700; }
`;

// Now let's try to grab just the valid CSS using regex or splitting
const validParts = originalText.split('/* Score screen */');
let finalClean = validParts[0] + '/* Score screen */\n' + validParts[1].split('}')[0] + '}\n' + validParts[1].split('}')[1] + '}\n' + validParts[1].split('}')[2] + '}\n' + validParts[1].split('}')[3] + '}\n' + validParts[1].split('}')[4] + '}\n';

// Let's just grab up to .score-donut::before {} block
const scoreMatch = originalText.match(/(\.score-donut::before\s*\{[\s\S]*?\})/);
if (scoreMatch) {
    const validIdx = originalText.indexOf(scoreMatch[1]) + scoreMatch[1].length;
    finalClean = originalText.substring(0, validIdx);
}

fs.writeFileSync('public/style.css', finalClean + '\n' + newCSS, 'utf8');
console.log('Fixed CSS encoding issues!');
