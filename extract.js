const fs = require('fs');

const content = fs.readFileSync('public/app.js', 'utf8');
const unitsMatch = content.match(/const UNITS = (\[[\s\S]*?\]);\n\n\/\/ ── STATE ──/);

if (unitsMatch) {
  fs.writeFileSync('data/db.json', unitsMatch[1]);
  console.log('Successfully extracted UNITS to data/db.json');
} else {
  console.log('Failed to find UNITS array.');
}
