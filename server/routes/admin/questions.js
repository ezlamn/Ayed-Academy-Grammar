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
  kind: z.enum(['mcq', 'fill', 'order']).optional(),
  q: z.string().trim().max(200).optional(),
  take: z.coerce.number().int().min(1).max(200).default(50),
  skip: z.coerce.number().int().min(0).default(0),
});

router.get('/', validate(bankQuery, 'query'), asyncHandler(async (req, res) => {
  const { track, unitId, source, kind, q, take, skip } = req.validatedQuery;

  const where = {
    ...(unitId ? { unitId } : {}),
    ...(source ? { source } : {}),
    ...(kind ? { kind } : {}),
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

/**
 * حقول الإجابة الخاصة بكل نوع. الحقول اللي مش بتاعة النوع الحالي
 * بتتصفّر صراحةً — عشان سؤال اتحوّل من mcq لـ fill ما يفضلش شايل
 * opts قديمة تربك الـ serializer.
 */
function answerFields(body) {
  if (body.kind === 'fill') {
    return { answers: body.answers, opts: null, correctIndex: null, tokens: null };
  }
  if (body.kind === 'order') {
    return { tokens: body.tokens, opts: null, correctIndex: null, answers: null };
  }
  return { opts: body.opts, correctIndex: body.correctIndex, answers: null, tokens: null };
}

/** يفصل حقول الإجابة عن باقي الحقول المشتركة. */
function splitBody(body) {
  const { kind, opts, correctIndex, answers, tokens, unitId, strategyId, ...common } = body;
  return { common, answers: answerFields(body), kind };
}

router.post('/', validate(questionCreateSchema), asyncHandler(async (req, res) => {
  const { unitId, strategyId } = req.body;
  const { common, answers, kind } = splitBody(req.body);

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
      kind,
      order: await nextOrder('question', where),
      ...common,
      ...answers,
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
      select: { id: true, unitId: true },
    });
    if (!existing) throw new HttpError(404, 'السؤال غير موجود');

    const { strategyId } = req.body;
    const { common, answers, kind } = splitBody(req.body);
    const data = { kind, ...common, ...answers };

    // نقل السؤال بين استراتيجية والوحدة بيغيّر مصدره
    if ('strategyId' in req.body) {
      if (strategyId) {
        const strategy = await prisma.strategy.findUnique({
          where: { id: strategyId },
          select: { unitId: true },
        });
        if (!strategy) throw new HttpError(404, 'الاستراتيجية غير موجودة');
        if (strategy.unitId !== existing.unitId) {
          throw new HttpError(400, 'الاستراتيجية لا تنتمي لهذه الوحدة');
        }
      }
      data.strategyId = strategyId || null;
      data.source = strategyId ? 'PRACTICE' : 'QUIZ';
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
