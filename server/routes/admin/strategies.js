/* ================================================================
   ADMIN/STRATEGIES.JS — إدارة الاستراتيجيات
   ================================================================ */
const express = require('express');
const { z } = require('zod');

const { prisma } = require('../../db/prisma');
const { asyncHandler, HttpError } = require('../../middleware/errorHandler');
const { validate } = require('../../middleware/validate');
const { invalidateContentCache } = require('../../services/contentSerializer');
const { nextOrder, applyOrder } = require('../../utils/ordering');
const {
  idParam, strategyCreateSchema, strategyUpdateSchema, reorderSchema,
} = require('../../utils/schemas');

const router = express.Router();

/** legacyId تلقائي: بادئة التراك + رقم الوحدة + رقم الاستراتيجية. */
async function generateLegacyId(unitId) {
  const unit = await prisma.unit.findUnique({
    where: { id: unitId },
    select: { track: true, legacyId: true, _count: { select: { strategies: true } } },
  });
  if (!unit) throw new HttpError(404, 'الوحدة غير موجودة');

  const prefix = { grammar: 'u', reading: 'r', listening: 'L' }[unit.track];
  const unitNum = String(unit.legacyId).replace(/^\D+/, '');
  return `${prefix}${unitNum}s${unit._count.strategies + 1}`;
}

// إعادة الترتيب داخل وحدة — قبل '/:id'
router.patch('/reorder/:unitId',
  validate(z.object({ unitId: z.coerce.number().int().positive() }), 'params'),
  validate(reorderSchema),
  asyncHandler(async (req, res) => {
    const order = await applyOrder('strategy', { unitId: req.params.unitId }, req.body.ids);
    invalidateContentCache();
    res.json({ order });
  }));

router.get('/:id', validate(idParam, 'params'), asyncHandler(async (req, res) => {
  const strategy = await prisma.strategy.findUnique({
    where: { id: req.params.id },
    include: {
      questions: { orderBy: { order: 'asc' }, include: { audioAsset: true } },
    },
  });
  if (!strategy) throw new HttpError(404, 'الاستراتيجية غير موجودة');
  res.json(strategy);
}));

router.post('/', validate(strategyCreateSchema), asyncHandler(async (req, res) => {
  const { unitId, legacyId, blocks, ...rest } = req.body;

  const strategy = await prisma.strategy.create({
    data: {
      unitId,
      legacyId: legacyId || await generateLegacyId(unitId),
      order: await nextOrder('strategy', { unitId }),
      blocks: blocks || {},
      ...rest,
    },
  });

  invalidateContentCache();
  res.status(201).json(strategy);
}));

router.patch('/:id', validate(idParam, 'params'), validate(strategyUpdateSchema),
  asyncHandler(async (req, res) => {
    const strategy = await prisma.strategy.update({
      where: { id: req.params.id },
      data: req.body,
    });
    invalidateContentCache();
    res.json(strategy);
  }));

router.delete('/:id', validate(idParam, 'params'), asyncHandler(async (req, res) => {
  await prisma.strategy.delete({ where: { id: req.params.id } });
  invalidateContentCache();
  res.json({ ok: true });
}));

module.exports = router;
