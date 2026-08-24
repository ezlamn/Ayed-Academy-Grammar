/* ================================================================
   UPLOAD.JS — استقبال الملفات في الذاكرة (multer)
   ----------------------------------------------------------------
   بنستقبل في الذاكرة مش على القرص مباشرة، لأن اسم الملف النهائي
   هو sha256 لمحتواه — ومش هنعرفه غير بعد ما نقرأ الـ buffer.
   ================================================================ */
const multer = require('multer');
const env = require('../config/env');
const { ALLOWED_MIMES } = require('../services/mediaService');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024, files: 10 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIMES.includes(file.mimetype)) {
      const err = new Error(`نوع الملف غير مدعوم: ${file.mimetype}`);
      err.status = 415;
      return cb(err);
    }
    cb(null, true);
  },
});

module.exports = { upload };
