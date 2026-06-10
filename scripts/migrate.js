const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'db.json');
try {
  const rawData = fs.readFileSync(dbPath, 'utf8');
  const data = JSON.parse(rawData);
  
  if (Array.isArray(data)) {
    // Current db is an array (Grammar units)
    const newDb = {
      grammar: data,
      reading: [],
      listening: [],
      tests: []
    };
    fs.writeFileSync(dbPath, JSON.stringify(newDb, null, 2));
    console.log('Database successfully migrated to multi-track format.');
  } else {
    console.log('Database is already in object format. No migration needed.');
  }
} catch(err) {
  console.error('Migration failed:', err);
}
