/* ================================================================
   ADMIN/EXAMS.JS — بناء نماذج الاختبارات
   ================================================================ */
const express = require('express');
const { z } = require('zod');

const { prisma } = require('../../db/prisma');
const { asyncHandler, HttpError } = require('../../middleware/errorHandler');
const { validate } = require('../../middleware/validate');
const { invalidateContentCache } = require('../../services/contentSerializer');
const { nextOrder, applyOrder } = require('../../utils/ordering');
const {
  idParam, examSchema, examUpdateSchema,
  examQuestionSchema, examQuestionUpdateSchema, reorderSchema,
} = require('../../utils/schemas');

const router = express.Router();

/** يحدّد قسم الامتحان لسؤال جاي من بنك أسئلة الوحدات. */
function sectionForUnit(unit) {
  if (unit.track === 'listening') return 'listening';
  if (unit.track === 'reading') return 'reading';
  // نفس منطق mock_exam.js: وحدة الكتابة تروح لقسم writing
  const isWriting = /writing/i.test(unit.nameEn || '') || /كتاب/.test(unit.nameAr || '');
  return isWriting ? 'writing' : 'grammar';
}

// ── النماذج ────────────────────────────────────────────────────

router.get('/', asyncHandler(async (req, res) => {
  const exams = await prisma.exam.findMany({
    orderBy: { order: 'asc' },
    include: {
      _count: { select: { questions: true, attempts: true } },
    },
  });
  res.json(exams);
}));

router.patch('/reorder', validate(reorderSchema), asyncHandler(async (req, res) => {
  const order = await applyOrder('exam', {}, req.body.ids);
  invalidateContentCache();
  res.json({ order });
}));

router.get('/:id', validate(idParam, 'params'), asyncHandler(async (req, res) => {
  const exam = await prisma.exam.findUnique({
    where: { id: req.params.id },
    include: {
      questions: {
        orderBy: [{ section: 'asc' }, { order: 'asc' }],
        include: { audioAsset: true },
      },
    },
  });
  if (!exam) throw new HttpError(404, 'النموذج غير موجود');
  res.json(exam);
}));

router.post('/', validate(examSchema), asyncHandler(async (req, res) => {
  const exam = await prisma.exam.create({
    data: { ...req.body, order: await nextOrder('exam', {}) },
  });
  invalidateContentCache();
  res.status(201).json(exam);
}));

router.patch('/:id', validate(idParam, 'params'), validate(examUpdateSchema),
  asyncHandler(async (req, res) => {
    const exam = await prisma.exam.update({ where: { id: req.params.id }, data: req.body });
    invalidateContentCache();
    res.json(exam);
  }));

router.delete('/:id', validate(idParam, 'params'), asyncHandler(async (req, res) => {
  await prisma.exam.delete({ where: { id: req.params.id } });
  invalidateContentCache();
  res.json({ ok: true });
}));

// ── أسئلة النموذج ──────────────────────────────────────────────

router.patch('/questions/reorder',
  validate(z.object({
    examId: z.coerce.number().int().positive(),
    section: z.enum(['listening', 'reading', 'grammar', 'writing']),
    ids: reorderSchema.shape.ids,
  })),
  asyncHandler(async (req, res) => {
    const { examId, section, ids } = req.body;
    const order = await applyOrder('examQuestion', { examId, section }, ids);
    invalidateContentCache();
    res.json({ order });
  }));

router.post('/questions', validate(examQuestionSchema), asyncHandler(async (req, res) => {
  const { examId, section, ...rest } = req.body;
  const question = await prisma.examQuestion.create({
    data: {
      examId,
      section,
      order: await nextOrder('examQuestion', { examId, section }),
      ...rest,
    },
    include: { audioAsset: true },
  });
  invalidateContentCache();
  res.status(201).json(question);
}));

/**
 * استيراد أسئلة من بنك أسئلة الوحدات.
 * بينسخ المحتوى (مش بيربطه) عشان تعديل الوحدة بعدين ما يغيّرش
 * نموذج امتحان محفوظ — sourceQuestionId للتتبّع بس.
 */
router.post('/questions/import', validate(z.object({
  examId: z.coerce.number().int().positive(),
  questionIds: z.array(z.coerce.number().int().positive()).min(1).max(200),
  section: z.enum(['listening', 'reading', 'grammar', 'writing']).optional(),
})), asyncHandler(async (req, res) => {
  const { examId, questionIds, section: forcedSection } = req.body;

  const exam = await prisma.exam.findUnique({ where: { id: examId }, select: { id: true } });
  if (!exam) throw new HttpError(404, 'النموذج غير موجود');

  // الامتحانات اختيار من متعدد بس — mock_exam.js بيفلتر بـ isMCQ()
  const sourceQuestions = await prisma.question.findMany({
    where: { id: { in: questionIds }, kind: 'mcq' },
    include: { unit: { select: { track: true, nameAr: true, nameEn: true } } },
  });
  if (!sourceQuestions.length) {
    throw new HttpError(404, 'مفيش أسئلة اختيار من متعدد بالمعرّفات دي');
  }

  // نحافظ على الترتيب اللي الأدمن اختاره مش ترتيب الداتابيز
  const byId = new Map(sourceQuestions.map(q => [q.id, q]));
  const ordered = questionIds.map(id => byId.get(id)).filter(Boolean);

  // عدّاد ترتيب لكل قسم، مبدوء من آخر ترتيب موجود
  const counters = {};
  const created = [];

  for (const q of ordered) {
    const section = forcedSection || sectionForUnit(q.unit);
    if (counters[section] === undefined) {
      counters[section] = await nextOrder('examQuestion', { examId, section });
    }

    created.push(await prisma.examQuestion.create({
      data: {
        examId,
        section,
        order: counters[section]++,
        sourceQuestionId: q.id,
        text: q.text,
        opts: q.opts,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
        audioUrl: q.audioUrl,
        audioAssetId: q.audioAssetId,
        imgUrl: q.imgUrl,
        passageText: q.passageText,
      },
      include: { audioAsset: true },
    }));
  }

  invalidateContentCache();
  res.status(201).json(created);
}));

router.patch('/questions/:id', validate(idParam, 'params'), validate(examQuestionUpdateSchema),
  asyncHandler(async (req, res) => {
    const existing = await prisma.examQuestion.findUnique({
      where: { id: req.params.id },
      select: { opts: true, correctIndex: true },
    });
    if (!existing) throw new HttpError(404, 'السؤال غير موجود');

    const opts = req.body.opts ?? existing.opts;
    const correctIndex = req.body.correctIndex ?? existing.correctIndex;
    if (correctIndex >= opts.length) {
      throw new HttpError(400, 'رقم الإجابة الصحيحة خارج نطاق الاختيارات');
    }

    const question = await prisma.examQuestion.update({
      where: { id: req.params.id },
      data: req.body,
      include: { audioAsset: true },
    });
    invalidateContentCache();
    res.json(question);
  }));

router.delete('/questions/:id', validate(idParam, 'params'), asyncHandler(async (req, res) => {
  await prisma.examQuestion.delete({ where: { id: req.params.id } });
  invalidateContentCache();
  res.json({ ok: true });
}));

module.exports = router;
