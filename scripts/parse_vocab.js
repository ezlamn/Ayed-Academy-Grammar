const fs = require('fs');

const raw = fs.readFileSync('raw_vocab.txt', 'utf8').trim().split('\n');
const dbPath = 'data/db.json';
let db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

let vocabCategories = [];
let currentCategory = null;

const colorPalette = ["#0891b2", "#059669", "#dc2626", "#2563eb", "#d97706", "#7c3aed", "#4f46e5"];
let colorIndex = 0;

for (let line of raw) {
  line = line.trim();
  if (!line) continue;
  
  if (line.startsWith('Model ')) {
    if (currentCategory && currentCategory.words.length > 0) {
      vocabCategories.push(currentCategory);
    }
    currentCategory = {
      title: line,
      color: colorPalette[colorIndex % colorPalette.length],
      words: []
    };
    colorIndex++;
  } else {
    // English words are typically ASCII, Arabic are Arabic characters
    // The format is: [English1] [English2...] [Arabic1...]
    const parts = line.split(' ');
    let enParts = [];
    let arParts = [];
    
    for (let part of parts) {
      if (!part) continue;
      // If it contains Arabic letters
      if (/[\u0600-\u06FF]/.test(part)) {
        arParts.push(part);
      } else {
        enParts.push(part);
      }
    }
    
    // In many cases, it's: Word | Meaning | المعنى
    // Example: Cartographer Map maker صانع الخرائط
    // Which means enParts = ["Cartographer", "Map", "maker"]
    // arParts = ["صانع", "الخرائط"]
    
    if (enParts.length >= 2 && arParts.length > 0) {
      const mainWord = enParts[0];
      const arMeaning = arParts.join(' ');
      currentCategory.words.push({ en: mainWord, ar: arMeaning });
    }
  }
}

if (currentCategory && currentCategory.words.length > 0) {
  vocabCategories.push(currentCategory);
}

// Update the reading array at index 2 (vocab unit)
if (db.reading && db.reading.length >= 3) {
  // Let's replace the vocab categories
  db.reading[2].page.vocabCategories = vocabCategories;
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
  console.log('Successfully updated vocabulary in db.json. Models imported:', vocabCategories.length);
} else {
  console.log('Error: reading array structure not as expected.');
}
