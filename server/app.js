/* ================================================================
   APP.JS — إعداد Express
   ----------------------------------------------------------------
   بديل server.js القديم. كل الراوتات الساكنة ومسارات التراكات
   محفوظة كما هي عشان الواجهة الحالية ما تتأثرش.
   ================================================================ */
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const env = require('./config/env');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { ensureDirs } = require('./services/mediaService');

const publicRoutes = require('./routes/public');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const studentRoutes = require('./routes/student');

const ROOT = env.ROOT;

function createApp() {
  const app = express();

  ensureDirs();

  // ── Middleware أساسي ────────────────────────────────────────
  app.use(cors({
    origin: (origin, cb) => {
      // طلبات نفس الأصل (بدون origin) دايماً مسموحة
      if (!origin || env.CORS_ORIGINS.includes(origin)) return cb(null, true);
      cb(null, false);
    },
    credentials: true,
  }));
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));
  app.use(cookieParser());

  // ── ملفات ساكنة (نفس إعداد server.js القديم) ────────────────
  app.use('/public', express.static(path.join(ROOT, 'public')));
  app.use('/uploads', express.static(env.UPLOAD_DIR));
  app.use('/uploads', express.static(path.join(ROOT, 'public', 'uploads')));
  app.use('/tests', express.static(path.join(ROOT, 'public', 'tests')));

  // نسخة db.json الساكنة — تفضل موجودة كـ fallback للواجهة
  app.get('/data/db.json', (req, res, next) => {
    const file = path.join(ROOT, 'data', 'db.json');
    if (!fs.existsSync(file)) return next();
    res.sendFile(file);
  });

  // ── API ─────────────────────────────────────────────────────
  app.use('/api', publicRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/student', studentRoutes);

  // ── داشبورد الأدمن (React build) ────────────────────────────
  const adminDist = path.join(ROOT, 'public', 'admin');
  app.use('/admin', express.static(adminDist));
  app.get(/^\/admin(\/.*)?$/, (req, res, next) => {
    const indexFile = path.join(adminDist, 'index.html');
    if (!fs.existsSync(indexFile)) {
      return res.status(503).send(
        '<div style="font-family:system-ui;padding:2rem;direction:rtl">' +
        '<h2>لوحة التحكم لم تُبنَ بعد</h2>' +
        '<p>شغّل <code>npm run admin:build</code> للبناء، أو ' +
        '<code>npm run admin:dev</code> للتطوير على المنفذ 5173.</p></div>'
      );
    }
    res.sendFile(indexFile);
  });

  // ── الواجهة العامة ──────────────────────────────────────────
  const SITE_ROUTES = ['/', '/dashboard', '/grammar', '/reading', '/listening', '/mock-exam'];
  SITE_ROUTES.forEach(route => {
    app.get(route, (req, res) => res.sendFile(path.join(ROOT, 'index.html')));
  });

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
