/* ================================================================
   ENV.JS — قراءة .env والتحقق منه عند الإقلاع
   ================================================================ */
const path = require('path');
const dotenv = require('dotenv');

const ROOT = path.resolve(__dirname, '..', '..');
dotenv.config({ path: path.join(ROOT, '.env') });

function required(key) {
  const value = process.env[key];
  if (!value || !value.trim()) {
    throw new Error(
      `متغير البيئة "${key}" مفقود. انسخ .env.example إلى .env واملأ القيم.`
    );
  }
  return value.trim();
}

function optional(key, fallback) {
  const value = process.env[key];
  return value && value.trim() ? value.trim() : fallback;
}

const NODE_ENV = optional('NODE_ENV', 'development');

const env = {
  ROOT,
  NODE_ENV,
  isProduction: NODE_ENV === 'production',
  PORT: parseInt(optional('PORT', '3000'), 10),

  DATABASE_URL: required('DATABASE_URL'),

  JWT_SECRET: required('JWT_SECRET'),
  JWT_EXPIRES_IN: optional('JWT_EXPIRES_IN', '7d'),

  ADMIN_EMAIL: optional('ADMIN_EMAIL', 'admin@ayedacademy.com'),
  ADMIN_PASSWORD: optional('ADMIN_PASSWORD', ''),
  ADMIN_NAME: optional('ADMIN_NAME', 'Admin'),

  UPLOAD_DIR: path.isAbsolute(optional('UPLOAD_DIR', 'uploads'))
    ? optional('UPLOAD_DIR', 'uploads')
    : path.join(ROOT, optional('UPLOAD_DIR', 'uploads')),
  MAX_UPLOAD_MB: parseInt(optional('MAX_UPLOAD_MB', '20'), 10),

  // أصول إضافية مسموح لها بالوصول للـ API (خادم Vite أثناء التطوير)
  CORS_ORIGINS: optional('CORS_ORIGIN', '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean),
};

// حارس إنتاج: السر الافتراضي ما يعديش للنشر
if (env.isProduction && env.JWT_SECRET.includes('change-me')) {
  throw new Error('JWT_SECRET لسه القيمة الافتراضية — غيّره قبل النشر.');
}

module.exports = env;
