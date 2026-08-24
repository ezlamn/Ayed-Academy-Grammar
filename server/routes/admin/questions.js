/* ================================================================
   ADMIN/QUESTIONS.JS — إدارة الأسئلة (كويزات الوحدة + تمارين الاستراتيجيات)
   ================================================================ */
const express = require('express');
const { z } = require('zod');

const { prisma } = require('../../db/prisma');
const { asyncHandler, HttpError } = require('../../middleware/errorHandler');
const { validate } = require('../../middleware/validate');
const { invalidateContentCache } = require('../../services/contentSerializer');
const { nextOrder, applyOrder } = require('../../utils/ordering');
const { idParam, questionCreateSchema, questionUpdateSchema, reorderSchema } = require('../../utils/schemas');

const router = express.Router();

// ── بنك الأسئلة (للبحث وبناء الامتحانات) ──────────────────────
const bankQuery = z.object({
  track: z.enum(['grammar', 'reading', 'listening']).optional(),
  unitId: z.coerce.number().int().positive().optional(),
  source: z.enum(['QUIZ', 'PRACTICE']).optional(),
  q: z.string().trim().max(200).optional(),
  take: z.coerce.number().int().min(1).max(200).default(50),
  skip: z.coerce.number().int().min(0).default(0),
});

router.get('/', validate(bankQuery, 'query'), asyncHandler(async (req, res) => {
  const { track, unitId, source, q, take, skip } = req.validatedQuery;

  const where = {
    ...(unitId ? { unitId } : {}),
    ...(source ? { source } : {}),
    ...(track ? { unit: { track } } : {}),
    ...(q ? { text: { contains: q, mode: 'insensitive' } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.question.findMany({
      where,
      orderBy: [{ unitId: 'asc' }, { order: 'asc' }],
      take,
      skip,
      include: {
        audioAsset: true,
        unit: { select: { id: true, track: true, nameAr: true, nameEn: true } },
        strategy: { select: { id: true, title: true } },
      },
    }),
    prisma.question.count({ where }),
  ]);

  res.json({ items, total, take, skip });
}));

// إعادة الترتيب — قبل '/:id'.
// الأب إما استراتيجية (تمارين) أو وحدة (كويزات).
router.patch('/reorder',
  validate(z.object({
    strategyId: z.coerce.number().int().positive().optional(),
    unitId: z.coerce.number().int().positive().optional(),
    ids: reorderSchema.shape.ids,
  }).refine(d => d.strategyId || d.unitId, {
    message: 'لازم تبعت strategyId أو unitId',
  })),
  asyncHandler(async (req, res) => {
    const { strategyId, unitId, ids } = req.body;
    const where = strategyId ? { strategyId } : { unitId, strategyId: null };
    const order = await applyOrder('question', where, ids);
    invalidateContentCache();
    res.json({ order });
  }));

router.get('/:id', validate(idParam, 'params'), asyncHandler(async (req, res) => {
  const question = await prisma.question.findUnique({
    where: { id: req.params.id },
    include: { audioAsset: true },
  });
  if (!question) throw new HttpError(404, 'السؤال غير موجود');
  res.json(question);
}));

router.post('/', validate(questionCreateSchema), asyncHandler(async (req, res) => {
  const { unitId, strategyId, ...rest } = req.body;

  // السؤال التابع لاستراتيجية = PRACTICE، والتابع للوحدة مباشرة = QUIZ
  const source = strategyId ? 'PRACTICE' : 'QUIZ';
  const where = strategyId ? { strategyId } : { unitId, strategyId: null };

  if (strategyId) {
    const strategy = await prisma.strategy.findUnique({
      where: { id: strategyId },
      select: { unitId: true },
    });
    if (!strategy) throw new HttpError(404, 'الاستراتيجية غير موجودة');
    if (strategy.unitId !== unitId) {
      throw new HttpError(400, 'الاستراتيجية لا تنتمي لهذه الوحدة');
    }
  }

  const question = await prisma.question.create({
    data: {
      unitId,
      strategyId: strategyId || null,
      source,
      order: await nextOrder('question', where),
      ...rest,
    },
    include: { audioAsset: true },
  });

  invalidateContentCache();
  res.status(201).json(question);
}));

router.patch('/:id', validate(idParam, 'params'), validate(questionUpdateSchema),
  asyncHandler(async (req, res) => {
    const existing = await prisma.question.findUnique({
      where: { id: req.params.id },
      select: { opts: true, correctIndex: true },
    });
    if (!existing) throw new HttpError(404, 'السؤال غير موجود');

    // التحقق المتقاطع: correctIndex لازم يبقى داخل الاختيارات النهائية
    const opts = req.body.opts ?? existing.opts;
    const correctIndex = req.body.correctIndex ?? existing.correctIndex;
    if (correctIndex >= opts.length) {
      throw new HttpError(400, 'رقم الإجابة الصحيحة خارج نطاق الاختيارات');
    }

    const data = { ...req.body };
    // نقل السؤال بين استراتيجية والوحدة بيغيّر نوعه
    if ('strategyId' in data) {
      data.source = data.strategyId ? 'PRACTICE' : 'QUIZ';
    }

    const question = await prisma.question.update({
      where: { id: req.params.id },
      data,
      include: { audioAsset: true },
    });

    invalidateContentCache();
    res.json(question);
  }));

router.delete('/:id', validate(idParam, 'params'), asyncHandler(async (req, res) => {
  await prisma.question.delete({ where: { id: req.params.id } });
  invalidateContentCache();
  res.json({ ok: true });
}));

module.exports = router;
