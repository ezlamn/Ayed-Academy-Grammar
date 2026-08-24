/* ================================================================
   ERROR-HANDLER.JS — معالج أخطاء موحّد
   ================================================================ */
const env = require('../config/env');

/** خطأ بحالة HTTP معروفة — نرميه من الـ controllers. */
class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

/** يلفّ async controller عشان أي رمية توصل للمعالج تلقائياً. */
const asyncHandler = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

function notFound(req, res) {
  res.status(404).json({ error: 'المسار غير موجود', path: req.originalUrl });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // أخطاء Prisma المعروفة
  if (err.code === 'P2002') {
    return res.status(409).json({
      error: 'القيمة موجودة بالفعل',
      fields: err.meta && err.meta.target,
    });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'السجل غير موجود' });
  }
  // multer
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: `حجم الملف أكبر من ${env.MAX_UPLOAD_MB}MB` });
  }

  const status = err.status || 500;
  if (status >= 500) console.error('[error]', err);

  res.status(status).json({
    error: status >= 500 && env.isProduction ? 'خطأ في السيرفر' : err.message,
    ...(err.details ? { details: err.details } : {}),
  });
}

module.exports = { HttpError, asyncHandler, notFound, errorHandler };
