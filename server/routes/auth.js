/* ================================================================
   AUTH.JS (routes) — دخول الأدمن وحسابات الطلاب
   ================================================================ */
const express = require('express');
const bcrypt = require('bcryptjs');
const { z } = require('zod');

const { prisma } = require('../db/prisma');
const { HttpError, asyncHandler } = require('../middleware/errorHandler');
const { validate } = require('../middleware/validate');
const {
  setAuthCookie,
  clearAuthCookie,
  requireAdmin,
  requireStudent,
} = require('../middleware/auth');

const router = express.Router();

const BCRYPT_ROUNDS = 12;

// ── حد بسيط لمحاولات الدخول (في الذاكرة) ──────────────────────
const attempts = new Map(); // key → { count, resetAt }
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

function rateLimit(req, res, next) {
  const key = `${req.ip}:${req.path}`;
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }
  if (entry.count >= MAX_ATTEMPTS) {
    const mins = Math.ceil((entry.resetAt - now) / 60000);
    return next(new HttpError(429, `محاولات كتيرة. حاول بعد ${mins} دقيقة.`));
  }
  entry.count += 1;
  next();
}

/** بيتنادى بعد نجاح الدخول عشان ما نعاقبش المستخدم الشرعي. */
function resetRateLimit(req) {
  attempts.delete(`${req.ip}:${req.path}`);
}

// ── مخططات ────────────────────────────────────────────────────
const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('صيغة الإيميل غير صحيحة'),
  password: z.string().min(1, 'كلمة المرور مطلوبة'),
});

const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email('صيغة الإيميل غير صحيحة'),
  password: z.string().min(8, 'كلمة المرور 8 أحرف على الأقل'),
  name: z.string().trim().min(2, 'الاسم حرفين على الأقل').max(80),
});

// ═══════════════════════════════════════════════════════════════
//  الأدمن
// ═══════════════════════════════════════════════════════════════

router.post('/admin/login', rateLimit, validate(loginSchema), asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const admin = await prisma.admin.findUnique({ where: { email } });

  // نقارن دايماً حتى لو الحساب مش موجود، عشان زمن الرد ما يفضحش الحسابات
  const hash = admin ? admin.passwordHash : '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin';
  const ok = await bcrypt.compare(password, hash);

  if (!admin || !ok) throw new HttpError(401, 'الإيميل أو كلمة المرور غير صحيحة');

  await prisma.admin.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() },
  });

  resetRateLimit(req);
  setAuthCookie(res, 'admin', admin.id);
  res.json({ id: admin.id, email: admin.email, name: admin.name });
}));

router.post('/admin/logout', (req, res) => {
  clearAuthCookie(res, 'admin');
  res.json({ ok: true });
});

router.get('/admin/me', requireAdmin, (req, res) => {
  res.json(req.admin);
});

router.post('/admin/change-password', requireAdmin, validate(z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'كلمة المرور الجديدة 8 أحرف على الأقل'),
})), asyncHandler(async (req, res) => {
  const admin = await prisma.admin.findUnique({ where: { id: req.admin.id } });
  const ok = await bcrypt.compare(req.body.currentPassword, admin.passwordHash);
  if (!ok) throw new HttpError(401, 'كلمة المرور الحالية غير صحيحة');

  await prisma.admin.update({
    where: { id: admin.id },
    data: { passwordHash: await bcrypt.hash(req.body.newPassword, BCRYPT_ROUNDS) },
  });
  res.json({ ok: true });
}));

// ═══════════════════════════════════════════════════════════════
//  الطلاب
// ═══════════════════════════════════════════════════════════════

router.post('/student/register', rateLimit, validate(registerSchema), asyncHandler(async (req, res) => {
  const { email, password, name } = req.body;

  const existing = await prisma.student.findUnique({ where: { email } });
  if (existing) throw new HttpError(409, 'الإيميل ده مسجّل بالفعل');

  const student = await prisma.student.create({
    data: {
      email,
      name,
      passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS),
      lastActiveAt: new Date(),
      state: { create: {} }, // حالة فاضية جاهزة للمزامنة
    },
    select: { id: true, email: true, name: true },
  });

  resetRateLimit(req);
  setAuthCookie(res, 'student', student.id);
  res.status(201).json(student);
}));

router.post('/student/login', rateLimit, validate(loginSchema), asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const student = await prisma.student.findUnique({ where: { email } });

  const hash = student ? student.passwordHash : '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin';
  const ok = await bcrypt.compare(password, hash);

  if (!student || !ok) throw new HttpError(401, 'الإيميل أو كلمة المرور غير صحيحة');
  if (!student.active) throw new HttpError(403, 'الحساب موقوف. تواصل مع المعلّم.');

  await prisma.student.update({
    where: { id: student.id },
    data: { lastActiveAt: new Date() },
  });

  resetRateLimit(req);
  setAuthCookie(res, 'student', student.id);
  res.json({ id: student.id, email: student.email, name: student.name });
}));

router.post('/student/logout', (req, res) => {
  clearAuthCookie(res, 'student');
  res.json({ ok: true });
});

router.get('/student/me', requireStudent, asyncHandler(async (req, res) => {
  const state = await prisma.studentState.findUnique({
    where: { studentId: req.student.id },
  });
  const progress = await prisma.unitProgress.findMany({
    where: { studentId: req.student.id },
    include: { unit: { select: { legacyId: true, track: true } } },
  });

  res.json({
    id: req.student.id,
    email: req.student.email,
    name: req.student.name,
    state: state || null,
    completedUnits: progress.map(p => p.unit.legacyId),
  });
}));

module.exports = router;
