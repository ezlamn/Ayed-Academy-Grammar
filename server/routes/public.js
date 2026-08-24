/* ================================================================
   PUBLIC.JS — الـ API العام اللي الواجهة الحالية بتستهلكه
   ----------------------------------------------------------------
   ⚠️ GET /api/units لازم يفضل بنفس الشكل بالحرف — أي تغيير هنا
   بيكسر renderers.js و mock_exam.js.
   ================================================================ */
const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { getContentPayload } = require('../services/contentSerializer');
const { prisma } = require('../db/prisma');

const router = express.Router();

// كل المحتوى — نفس شكل db.json
router.get('/units', asyncHandler(async (req, res) => {
  res.json(await getContentPayload());
}));

// إعدادات الموقع لوحدها
router.get('/config', asyncHandler(async (req, res) => {
  const payload = await getContentPayload();
  res.json(payload.config);
}));

// النماذج المنشورة لوحدها — يستخدمها mock_exam.js
router.get('/exams', asyncHandler(async (req, res) => {
  const payload = await getContentPayload();
  res.json(payload.tests);
}));

router.get('/health', asyncHandler(async (req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ ok: true, time: new Date().toISOString() });
}));

module.exports = router;
