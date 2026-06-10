const fs = require('fs');

const rawData = fs.readFileSync('data/db.json', 'utf8');

try {
  // Use Function to evaluate the JS array and return it
  const data = new Function('return ' + rawData)();
  fs.writeFileSync('data/db.json', JSON.stringify(data, null, 2), 'utf8');
  console.log('Successfully converted db.json to valid JSON');
} catch (e) {
  console.error('Error converting:', e);
}
