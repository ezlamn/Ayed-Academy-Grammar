/* ================================================================
   ADMIN/VOCAB.JS — تصنيفات المفردات وكلماتها (بطاقات الفلاش)
   ================================================================ */
const express = require('express');
const { z } = require('zod');

const { prisma } = require('../../db/prisma');
const { asyncHandler } = require('../../middleware/errorHandler');
const { validate } = require('../../middleware/validate');
const { invalidateContentCache } = require('../../services/contentSerializer');
const { nextOrder, applyOrder } = require('../../utils/ordering');
const {
  idParam, vocabCategorySchema, vocabCategoryUpdateSchema,
  vocabWordSchema, vocabWordUpdateSchema, reorderSchema,
} = require('../../utils/schemas');

const router = express.Router();

// ── التصنيفات ──────────────────────────────────────────────────

router.patch('/categories/reorder/:unitId',
  validate(z.object({ unitId: z.coerce.number().int().positive() }), 'params'),
  validate(reorderSchema),
  asyncHandler(async (req, res) => {
    const order = await applyOrder('vocabCategory', { unitId: req.params.unitId }, req.body.ids);
    invalidateContentCache();
    res.json({ order });
  }));

router.post('/categories', validate(vocabCategorySchema), asyncHandler(async (req, res) => {
  const { unitId, ...rest } = req.body;
  const category = await prisma.vocabCategory.create({
    data: { unitId, order: await nextOrder('vocabCategory', { unitId }), ...rest },
    include: { words: true },
  });
  invalidateContentCache();
  res.status(201).json(category);
}));

router.patch('/categories/:id', validate(idParam, 'params'), validate(vocabCategoryUpdateSchema),
  asyncHandler(async (req, res) => {
    const category = await prisma.vocabCategory.update({
      where: { id: req.params.id },
      data: req.body,
    });
    invalidateContentCache();
    res.json(category);
  }));

router.delete('/categories/:id', validate(idParam, 'params'), asyncHandler(async (req, res) => {
  await prisma.vocabCategory.delete({ where: { id: req.params.id } });
  invalidateContentCache();
  res.json({ ok: true });
}));

// ── الكلمات ────────────────────────────────────────────────────

router.patch('/words/reorder/:categoryId',
  validate(z.object({ categoryId: z.coerce.number().int().positive() }), 'params'),
  validate(reorderSchema),
  asyncHandler(async (req, res) => {
    const order = await applyOrder('vocabWord', { categoryId: req.params.categoryId }, req.body.ids);
    invalidateContentCache();
    res.json({ order });
  }));

router.post('/words', validate(vocabWordSchema), asyncHandler(async (req, res) => {
  const { categoryId, ...rest } = req.body;
  const word = await prisma.vocabWord.create({
    data: { categoryId, order: await nextOrder('vocabWord', { categoryId }), ...rest },
  });
  invalidateContentCache();
  res.status(201).json(word);
}));

/** إدخال جماعي — لصق قائمة كلمات مرة واحدة بدل واحدة واحدة. */
router.post('/words/bulk', validate(z.object({
  categoryId: z.coerce.number().int().positive(),
  words: z.array(z.object({
    en: vocabWordSchema.shape.en,
    ar: vocabWordSchema.shape.ar,
  })).min(1).max(300),
})), asyncHandler(async (req, res) => {
  const { categoryId, words } = req.body;
  const start = await nextOrder('vocabWord', { categoryId });

  await prisma.vocabWord.createMany({
    data: words.map((w, i) => ({ categoryId, order: start + i, en: w.en, ar: w.ar })),
  });

  invalidateContentCache();
  const all = await prisma.vocabWord.findMany({
    where: { categoryId },
    orderBy: { order: 'asc' },
  });
  res.status(201).json(all);
}));

router.patch('/words/:id', validate(idParam, 'params'), validate(vocabWordUpdateSchema),
  asyncHandler(async (req, res) => {
    const word = await prisma.vocabWord.update({ where: { id: req.params.id }, data: req.body });
    invalidateContentCache();
    res.json(word);
  }));

router.delete('/words/:id', validate(idParam, 'params'), asyncHandler(async (req, res) => {
  await prisma.vocabWord.delete({ where: { id: req.params.id } });
  invalidateContentCache();
  res.json({ ok: true });
}));

module.exports = router;
