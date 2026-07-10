/* ================================================================
   server.js — Minimal static file server (no dependencies)
   التطبيق أصبح static بالكامل ويقرأ البيانات من public/data/**.json
   هذا السيرفر فقط يقدّم الملفات عبر HTTP (fetch لا يعمل مع file://).
   البديل الموثّق في README: `npx serve .` أو `python -m http.server`.
   ================================================================ */

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
let PORT = parseInt(process.env.PORT || '8000', 10);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json; charset=utf-8',
};

const server = http.createServer((req, res) => {
  try {
    let urlPath = decodeURIComponent(req.url.split('?')[0]);
    if (urlPath === '/') urlPath = '/index.html';

    // امنع الخروج خارج مجلد المشروع (path traversal)
    const filePath = path.join(ROOT, path.normalize(urlPath));
    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403); res.end('Forbidden'); return;
    }

    fs.stat(filePath, (err, stat) => {
      if (err || !stat.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found');
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    });
  } catch (e) {
    res.writeHead(500); res.end('Internal Server Error');
  }
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.warn(`Port ${PORT} is in use, trying ${PORT + 1}...`);
    PORT += 1;
    server.listen(PORT);
  } else {
    throw err;
  }
});

server.listen(PORT, () => {
  console.log(`Ayed Academy running at http://localhost:${PORT}`);
  console.log(`Admin dashboard at http://localhost:${PORT}/admin/admin.html`);
});
