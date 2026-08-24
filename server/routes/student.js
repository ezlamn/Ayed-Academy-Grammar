/* ================================================================
   STUDENT.JS — حالة الطالب وتقدّمه (بديل الـ localStorage)
   ================================================================ */
const express = require('express');
const { z } = require('zod');

const { prisma } = require('../db/prisma');
const { asyncHandler, HttpError } = require('../middleware/errorHandler');
const { validate } = require('../middleware/validate');
const { requireStudent } = require('../middleware/auth');

const router = express.Router();

router.use(requireStudent);

/** يحدّث آخر نشاط من غير ما يعطّل الرد. */
function touch(studentId) {
  prisma.student
    .update({ where: { id: studentId }, data: { lastActiveAt: new Date() } })
    .catch(() => {});
}

/** يحوّل legacyId (زي "1" أو "r3") لـ id حقيقي في الداتابيز. */
async function resolveUnitId(legacyOrId) {
  const asNumber = Number(legacyOrId);
  if (Number.isInteger(asNumber) && asNumber > 0) {
    const byId = await prisma.unit.findUnique({ where: { id: asNumber }, select: { id: true } });
    if (byId) return byId.id;
  }
  const byLegacy = await prisma.unit.findFirst({
    where: { legacyId: String(legacyOrId) },
    select: { id: true },
  });
  return byLegacy ? byLegacy.id : null;
}

// ═══════════════════════════════════════════════════════════════
//  الحالة
// ═══════════════════════════════════════════════════════════════

router.get('/state', asyncHandler(async (req, res) => {
  const state = await prisma.studentState.upsert({
    where: { studentId: req.student.id },
    create: { studentId: req.student.id },
    update: {},
  });

  const progress = await prisma.unitProgress.findMany({
    where: { studentId: req.student.id },
    include: { unit: { select: { legacyId: true, track: true } } },
  });

  res.json({ ...state, completedUnits: progress.map(p => p.unit.legacyId) });
}));

const stateSchema = z.object({
  xp: z.coerce.number().int().min(0).max(10_000_000).optional(),
  level: z.coerce.number().int().min(1).max(1000).optional(),
  streak: z.coerce.number().int().min(0).max(10000).optional(),
  bestStreak: z.coerce.number().int().min(0).max(10000).optional(),
  lastActive: z.string().max(60).nullish(),
  notes: z.record(z.string(), z.string().max(20000)).optional(),
  highlights: z.record(z.string(), z.string().max(500000)).optional(),
  srs: z.record(z.string(), z.any()).optional(),
  analytics: z.record(z.string(), z.any()).optional(),
});

const saveState = asyncHandler(async (req, res) => {
  const state = await prisma.studentState.upsert({
    where: { studentId: req.student.id },
    create: { studentId: req.student.id, ...req.body },
    update: req.body,
  });
  touch(req.student.id);
  res.json(state);
});

router.patch('/state', validate(stateSchema), saveState);

// نفس الحفظ بـ POST — navigator.sendBeacon (اللي بنستخدمه وقت إغلاق
// الصفحة) بيبعت POST بس، فمحتاجين المسار ده عشان آخر تغيير ما يضيعش.
router.post('/state', validate(stateSchema), saveState);

// ═══════════════════════════════════════════════════════════════
//  الترحيل من localStorage (مرة واحدة لكل حساب)
// ═══════════════════════════════════════════════════════════════

router.post('/migrate-local', validate(stateSchema.extend({
  completedUnits: z.array(z.union([z.string(), z.number()])).max(500).optional(),
})), asyncHandler(async (req, res) => {
  const current = await prisma.studentState.findUnique({
    where: { studentId: req.student.id },
  });

  // الترحيل بيحصل مرة واحدة بس — بعد كده المصدر الوحيد هو السيرفر
  if (current && current.migrated) {
    return res.json({ migrated: false, reason: 'تم الترحيل قبل كده' });
  }

  const { completedUnits = [], ...stateData } = req.body;

  await prisma.studentState.upsert({
    where: { studentId: req.student.id },
    create: { studentId: req.student.id, ...stateData, migrated: true },
    update: { ...stateData, migrated: true },
  });

  let imported = 0;
  for (const legacyId of completedUnits) {
    const unitId = await resolveUnitId(legacyId);
    if (!unitId) continue;
    await prisma.unitProgress.upsert({
      where: { studentId_unitId: { studentId: req.student.id, unitId } },
      create: { studentId: req.student.id, unitId },
      update: {},
    });
    imported += 1;
  }

  touch(req.student.id);
  res.json({ migrated: true, unitsImported: imported });
}));

// ═══════════════════════════════════════════════════════════════
//  التقدّم في الوحدات
// ═══════════════════════════════════════════════════════════════

router.post('/progress/:unitId/complete', asyncHandler(async (req, res) => {
  const unitId = await resolveUnitId(req.params.unitId);
  if (!unitId) throw new HttpError(404, 'الوحدة غير موجودة');

  const progress = await prisma.unitProgress.upsert({
    where: { studentId_unitId: { studentId: req.student.id, unitId } },
    create: { studentId: req.student.id, unitId },
    update: {},
  });
  touch(req.student.id);
  res.json(progress);
}));

router.delete('/progress/:unitId', asyncHandler(async (req, res) => {
  const unitId = await resolveUnitId(req.params.unitId);
  if (!unitId) throw new HttpError(404, 'الوحدة غير موجودة');

  await prisma.unitProgress.deleteMany({
    where: { studentId: req.student.id, unitId },
  });
  res.json({ ok: true });
}));

// ═══════════════════════════════════════════════════════════════
//  محاولات الأسئلة — مصدر التحليلات
// ═══════════════════════════════════════════════════════════════

router.post('/attempts', validate(z.object({
  attempts: z.array(z.object({
    questionId: z.coerce.number().int().positive(),
    selectedIndex: z.coerce.number().int().min(0).max(10),
  })).min(1).max(100),
})), asyncHandler(async (req, res) => {
  const ids = req.body.attempts.map(a => a.questionId);
  // الاختيار من متعدد بس — أسئلة fill/order مالهاش correctIndex نقارن بيه
  const questions = await prisma.question.findMany({
    where: { id: { in: ids }, kind: 'mcq', correctIndex: { not: null } },
    select: { id: true, correctIndex: true },
  });
  const correctById = new Map(questions.map(q => [q.id, q.correctIndex]));

  // الأسئلة اللي مش موجودة بنتجاهلها بدل ما نرفض الدفعة كلها —
  // ممكن الأدمن يكون حذف سؤال والطالب لسه فاتح الصفحة القديمة
  const rows = req.body.attempts
    .filter(a => correctById.has(a.questionId))
    .map(a => ({
      studentId: req.student.id,
      questionId: a.questionId,
      selectedIndex: a.selectedIndex,
      isCorrect: correctById.get(a.questionId) === a.selectedIndex,
    }));

  if (rows.length) await prisma.questionAttempt.createMany({ data: rows });

  touch(req.student.id);
  res.status(201).json({ saved: rows.length, skipped: req.body.attempts.length - rows.length });
}));

// ═══════════════════════════════════════════════════════════════
//  محاولات الامتحانات
// ═══════════════════════════════════════════════════════════════

router.get('/exam-attempts', asyncHandler(async (req, res) => {
  const attempts = await prisma.examAttempt.findMany({
    where: { studentId: req.student.id },
    orderBy: { startedAt: 'desc' },
    take: 20,
    include: { exam: { select: { id: true, title: true } } },
  });
  res.json(attempts);
}));

router.post('/exam-attempts', validate(z.object({
  examId: z.coerce.number().int().positive().nullish(),
  preset: z.string().trim().max(60).nullish(),
  score: z.coerce.number().int().min(0),
  total: z.coerce.number().int().min(1),
  sectionScores: z.record(z.string(), z.object({
    correct: z.coerce.number().int().min(0),
    total: z.coerce.number().int().min(0),
  })).optional(),
  answers: z.record(z.string(), z.any()).optional(),
  startedAt: z.coerce.date().optional(),
}).refine(d => d.score <= d.total, {
  message: 'الدرجة أكبر من الإجمالي',
  path: ['score'],
})), asyncHandler(async (req, res) => {
  const { startedAt, ...rest } = req.body;

  const attempt = await prisma.examAttempt.create({
    data: {
      studentId: req.student.id,
      ...rest,
      sectionScores: rest.sectionScores || {},
      answers: rest.answers || {},
      startedAt: startedAt || new Date(),
      finishedAt: new Date(),
    },
  });

  touch(req.student.id);
  res.status(201).json(attempt);
}));

module.exports = router;
