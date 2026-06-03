const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DB_FILE = path.join(__dirname, 'data', 'db.json');

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
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

// Ensure data and uploads dirs exist
if (!fs.existsSync(path.join(__dirname, 'data'))) fs.mkdirSync(path.join(__dirname, 'data'));
if (!fs.existsSync(path.join(__dirname, 'uploads'))) fs.mkdirSync(path.join(__dirname, 'uploads'));
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, '[]');

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Read DB helper
const readDB = () => JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
const writeDB = (data) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));

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

// Update all units (simplest way to handle full CRUD for local app)
app.post('/api/units', (req, res) => {
  try {
    writeDB(req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save database' });
  }
});

// Upload media endpoint
app.post('/api/upload', upload.single('media'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ url: `/uploads/${req.file.filename}` });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
  console.log(`Admin dashboard at http://localhost:${PORT}/public/admin.html`);
});
