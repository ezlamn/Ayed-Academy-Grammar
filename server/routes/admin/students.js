/* ================================================================
   ADMIN/STUDENTS.JS — إدارة الطلاب ومتابعة تقدّمهم
   ================================================================ */
const express = require('express');
const bcrypt = require('bcryptjs');
const { z } = require('zod');

const { prisma } = require('../../db/prisma');
const { asyncHandler, HttpError } = require('../../middleware/errorHandler');
const { validate } = require('../../middleware/validate');
const { idParam, plain } = require('../../utils/schemas');

const router = express.Router();

const listQuery = z.object({
  q: z.string().trim().max(200).optional(),
  active: z.enum(['true', 'false']).optional(),
  sort: z.enum(['recent', 'name', 'xp', 'joined']).default('recent'),
  take: z.coerce.number().int().min(1).max(200).default(50),
  skip: z.coerce.number().int().min(0).default(0),
});

const ORDER_BY = {
  recent: { lastActiveAt: 'desc' },
  name: { name: 'asc' },
  joined: { createdAt: 'desc' },
  // XP في جدول تاني — بنرتّب بعد الجلب
  xp: { createdAt: 'desc' },
};

router.get('/', validate(listQuery, 'query'), asyncHandler(async (req, res) => {
  const { q, active, sort, take, skip } = req.validatedQuery;

  const where = {
    ...(active ? { active: active === 'true' } : {}),
    ...(q ? {
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ],
    } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.student.findMany({
      where,
      orderBy: ORDER_BY[sort],
      take,
      skip,
      select: {
        id: true, email: true, name: true, active: true,
        createdAt: true, lastActiveAt: true,
        state: { select: { xp: true, level: true, streak: true, bestStreak: true } },
        _count: { select: { progress: true, attempts: true, examAttempts: true } },
      },
    }),
    prisma.student.count({ where }),
  ]);

  if (sort === 'xp') {
    items.sort((a, b) => (b.state?.xp || 0) - (a.state?.xp || 0));
  }

  res.json({ items, total, take, skip });
}));

// ── ملف الطالب التفصيلي ───────────────────────────────────────
router.get('/:id', validate(idParam, 'params'), asyncHandler(async (req, res) => {
  const student = await prisma.student.findUnique({
    where: { id: req.params.id },
    select: {
      id: true, email: true, name: true, active: true,
      createdAt: true, lastActiveAt: true,
      state: true,
      progress: {
        orderBy: { completedAt: 'desc' },
        include: {
          unit: { select: { id: true, track: true, legacyId: true, nameAr: true, nameEn: true } },
        },
      },
      examAttempts: {
        orderBy: { startedAt: 'desc' },
        take: 20,
        include: { exam: { select: { id: true, title: true } } },
      },
    },
  });
  if (!student) throw new HttpError(404, 'الطالب غير موجود');

  // أداء الطالب لكل تراك — من محاولات الأسئلة
  const perTrack = await prisma.$queryRaw`
    SELECT u.track::text                            AS track,
           COUNT(*)::int                            AS answered,
           COUNT(*) FILTER (WHERE a."isCorrect")::int AS correct
    FROM "QuestionAttempt" a
    JOIN "Question" q ON q.id = a."questionId"
    JOIN "Unit"     u ON u.id = q."unitId"
    WHERE a."studentId" = ${req.params.id}
    GROUP BY u.track
  `;

  res.json({ ...student, perTrack });
}));

// ── إيقاف / تفعيل الحساب ──────────────────────────────────────
router.patch('/:id', validate(idParam, 'params'), validate(z.object({
  name: plain(80).optional(),
  active: z.boolean().optional(),
})), asyncHandler(async (req, res) => {
  const student = await prisma.student.update({
    where: { id: req.params.id },
    data: req.body,
    select: { id: true, email: true, name: true, active: true },
  });
  res.json(student);
}));

// ── إعادة تعيين كلمة المرور (المعلّم بيعملها للطالب) ──────────
router.post('/:id/reset-password', validate(idParam, 'params'), validate(z.object({
  newPassword: z.string().min(8, 'كلمة المرور 8 أحرف على الأقل'),
})), asyncHandler(async (req, res) => {
  await prisma.student.update({
    where: { id: req.params.id },
    data: { passwordHash: await bcrypt.hash(req.body.newPassword, 12) },
  });
  res.json({ ok: true });
}));

router.delete('/:id', validate(idParam, 'params'), asyncHandler(async (req, res) => {
  await prisma.student.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
}));

module.exports = router;
