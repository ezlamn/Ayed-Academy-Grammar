/* ================================================================
   ADMIN/VIDEOS.JS — مكتبة فيديوهات الوحدة
   ================================================================ */
const express = require('express');
const { z } = require('zod');

const { prisma } = require('../../db/prisma');
const { asyncHandler } = require('../../middleware/errorHandler');
const { validate } = require('../../middleware/validate');
const { invalidateContentCache } = require('../../services/contentSerializer');
const { nextOrder, applyOrder } = require('../../utils/ordering');
const { idParam, videoSchema, videoUpdateSchema, reorderSchema } = require('../../utils/schemas');

const router = express.Router();

router.patch('/reorder/:unitId',
  validate(z.object({ unitId: z.coerce.number().int().positive() }), 'params'),
  validate(reorderSchema),
  asyncHandler(async (req, res) => {
    const order = await applyOrder('video', { unitId: req.params.unitId }, req.body.ids);
    invalidateContentCache();
    res.json({ order });
  }));

router.post('/', validate(videoSchema), asyncHandler(async (req, res) => {
  const { unitId, ...rest } = req.body;
  const video = await prisma.video.create({
    data: { unitId, order: await nextOrder('video', { unitId }), ...rest },
  });
  invalidateContentCache();
  res.status(201).json(video);
}));

router.patch('/:id', validate(idParam, 'params'), validate(videoUpdateSchema),
  asyncHandler(async (req, res) => {
    const video = await prisma.video.update({ where: { id: req.params.id }, data: req.body });
    invalidateContentCache();
    res.json(video);
  }));

router.delete('/:id', validate(idParam, 'params'), asyncHandler(async (req, res) => {
  await prisma.video.delete({ where: { id: req.params.id } });
  invalidateContentCache();
  res.json({ ok: true });
}));

module.exports = router;
