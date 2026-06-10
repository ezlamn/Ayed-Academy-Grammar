const fs = require('fs');
const dbPath = 'data/db.json';
let db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

let s1 = db.reading.find(u => u.id === 'r1').page.strategies[0];
let p = s1.practice;

// Map questions to images
const imgMap = {
  "r1-p1-q1": "public/uploads/charts/chart_4_1.jpeg",
  "r1-p1-q2": "public/uploads/charts/chart_4_1.jpeg",
  "r1-p2-q1": "public/uploads/charts/chart_5_1.jpeg",
  "r1-p2-q2": "public/uploads/charts/chart_5_1.jpeg",
  "r1-p3-q1": "public/uploads/charts/chart_6_1.jpeg",
  "r1-p4-q1": "public/uploads/charts/chart_6_2.jpeg",
  "r1-p4-q2": "public/uploads/charts/chart_6_2.jpeg",
  "r1-p5-q1": "public/uploads/charts/chart_7_1.jpeg",
  "r1-p5-q2": "public/uploads/charts/chart_7_1.jpeg",
  "r1-p6-q1": "public/uploads/charts/chart_7_2.jpeg",
  "r1-p7-q1": "public/uploads/charts/chart_8_1.jpeg",
  "r1-p7-q2": "public/uploads/charts/chart_8_1.jpeg",
  "r1-p8-q1": "public/uploads/charts/chart_8_2.jpeg"
};

p.forEach(q => {
  if (imgMap[q.passageId]) {
    q.imgUrl = imgMap[q.passageId].replace('public/', ''); // Relative to index.html
  }
  // Remove the note about the PDF
  q.passageText = q.passageText.replace(/\n\(يرجى الرجوع إلى صفحة \d+ في ملف الـ PDF.*?\)/, '');
});

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
console.log('Updated db.json with chart images.');
