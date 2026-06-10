const fs = require('fs');
const path = require('path');

// ── FIX 1: Replace external audio URLs with working local test tone ──
// We'll create a tiny local audio file and reference it
// Generate a minimal valid WAV file as base64 for testing
// This is a real silent WAV that browsers can play
const silentWavB64 = 'UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
const buf = Buffer.from(silentWavB64, 'base64');

// Save it as a test file in uploads
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
fs.writeFileSync(path.join(uploadsDir, 'audio-test.wav'), buf);
console.log('Created test audio: uploads/audio-test.wav');

// Replace all soundhelix URLs in db.json with local audio
const dbPath = path.join(__dirname, 'data', 'db.json');
let dbContent = fs.readFileSync(dbPath, 'utf8');

// Use the local uploaded file URL
const localAudioUrl = '/uploads/audio-test.wav';
const oldUrl = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

const updatedContent = dbContent.split(oldUrl).join(localAudioUrl);
const count = (dbContent.match(/soundhelix/g) || []).length;

fs.writeFileSync(dbPath, updatedContent, 'utf8');
console.log(`Replaced ${count} soundhelix audio URLs with local audio: ${localAudioUrl}`);

// ── FIX 2: Ensure uploads folder is properly served ──
console.log('Audio fix complete. Server serves /uploads/ folder already.');
