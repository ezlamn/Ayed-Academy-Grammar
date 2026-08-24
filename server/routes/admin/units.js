/* ================================================================
   ADMIN/UNITS.JS — إدارة الوحدات
   ================================================================ */
const express = require('express');
const { z } = require('zod');

const { prisma } = require('../../db/prisma');
const { asyncHandler, HttpError } = require('../../middleware/errorHandler');
const { validate } = require('../../middleware/validate');
const { invalidateContentCache, UNIT_INCLUDE } = require('../../services/contentSerializer');
const { nextOrder, applyOrder } = require('../../utils/ordering');
const {
  idParam, trackEnum, unitCreateSchema, unitUpdateSchema, reorderSchema,
} = require('../../utils/schemas');

const router = express.Router();

/** legacyId تلقائي لو الأدمن ما بعتوش: أعلى رقم + 1 داخل التراك. */
async function generateLegacyId(track) {
  const units = await prisma.unit.findMany({
    where: { track },
    select: { legacyId: true },
  });
  const prefix = track === 'reading' ? 'r' : '';
  const numbers = units
    .map(u => parseInt(String(u.legacyId).replace(/^\D+/, ''), 10))
    .filter(Number.isFinite);
  const next = (numbers.length ? Math.max(...numbers) : 0) + 1;
  return `${prefix}${next}`;
}

// ── قائمة الوحدات (ملخّص + أعداد) ─────────────────────────────
router.get('/', validate(z.object({ track: trackEnum.optional() }), 'query'),
  asyncHandler(async (req, res) => {
    const { track } = req.validatedQuery;
    const units = await prisma.unit.findMany({
      where: track ? { track } : {},
      orderBy: [{ track: 'asc' }, { order: 'asc' }],
      include: {
        _count: {
          select: { strategies: true, questions: true, videos: true, vocabCategories: true },
        },
      },
    });
    res.json(units);
  }));

// ── إعادة ترتيب داخل تراك ─────────────────────────────────────
// لازم تيجي قبل '/:id' وإلا Express هيفسّر "reorder" كـ id
router.patch('/reorder/:track',
  validate(z.object({ track: trackEnum }), 'params'),
  validate(reorderSchema),
  asyncHandler(async (req, res) => {
    const order = await applyOrder('unit', { track: req.params.track }, req.body.ids);
    invalidateContentCache();
    res.json({ order });
  }));

// ── وحدة واحدة بكل محتواها ────────────────────────────────────
router.get('/:id', validate(idParam, 'params'), asyncHandler(async (req, res) => {
  const unit = await prisma.unit.findUnique({
    where: { id: req.params.id },
    include: {
      ...UNIT_INCLUDE,
      // في المحرّر عايزين كل الأسئلة مش أسئلة الوحدة بس
      questions: {
        orderBy: { order: 'asc' },
        include: { audioAsset: true },
      },
    },
  });
  if (!unit) throw new HttpError(404, 'الوحدة غير موجودة');
  res.json(unit);
}));

// ── إنشاء ─────────────────────────────────────────────────────
router.post('/', validate(unitCreateSchema), asyncHandler(async (req, res) => {
  const { track, legacyId, ...rest } = req.body;

  const unit = await prisma.unit.create({
    data: {
      track,
      legacyId: legacyId || await generateLegacyId(track),
      order: await nextOrder('unit', { track }),
      ...rest,
    },
  });

  invalidateContentCache();
  res.status(201).json(unit);
}));

// ── تعديل ─────────────────────────────────────────────────────
router.patch('/:id', validate(idParam, 'params'), validate(unitUpdateSchema),
  asyncHandler(async (req, res) => {
    const unit = await prisma.unit.update({
      where: { id: req.params.id },
      data: req.body,
    });
    invalidateContentCache();
    res.json(unit);
  }));

// ── حذف ───────────────────────────────────────────────────────
router.delete('/:id', validate(idParam, 'params'), asyncHandler(async (req, res) => {
  // كل المحتوى التابع بيتحذف بـ onDelete: Cascade في الـ schema
  await prisma.unit.delete({ where: { id: req.params.id } });
  invalidateContentCache();
  res.json({ ok: true });
}));

module.exports = router;
