const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DB_FILE = path.join(__dirname, 'data', 'db.json');

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
app.use('/tests', express.static(path.join(__dirname, 'public', 'tests')));

// Expose db.json read-only for test runners
app.get('/data/db.json', (req, res) => {
  try { res.json(JSON.parse(fs.readFileSync(DB_FILE, 'utf8'))); }
  catch (err) { res.status(500).json({ error: 'Failed to read database' }); }
});

// Serve index.html from root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Each track lives on its own route — the client reads the path and opens that track directly
['/dashboard', '/grammar', '/reading', '/listening', '/mock-exam'].forEach(route => {
  app.get(route, (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
  });
});

// Ensure data and uploads dirs exist
if (!fs.existsSync(path.join(__dirname, 'data'))) fs.mkdirSync(path.join(__dirname, 'data'));
if (!fs.existsSync(path.join(__dirname, 'uploads'))) fs.mkdirSync(path.join(__dirname, 'uploads'));
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, '[]');

// Read DB helper
const readDB = () => JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));

// API Routes

// Get all units
app.get('/api/units', (req, res) => {
  try {
    const data = readDB();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read database' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
