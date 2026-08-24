/* ================================================================
   ADMIN/CONFIG.JS — إعدادات الموقع العامة (introVideoUrl ...)
   ================================================================ */
const express = require('express');
const { z } = require('zod');

const { prisma } = require('../../db/prisma');
const { asyncHandler } = require('../../middleware/errorHandler');
const { validate } = require('../../middleware/validate');
const { invalidateContentCache } = require('../../services/contentSerializer');

const router = express.Router();

router.get('/', asyncHandler(async (req, res) => {
  const rows = await prisma.siteConfig.findMany({ orderBy: { key: 'asc' } });
  res.json(Object.fromEntries(rows.map(r => [r.key, r.value])));
}));

// تحديث دفعة واحدة: { introVideoUrl: "...", ... }
router.patch('/', validate(z.record(
  z.string().min(1).max(100),
  z.union([z.string().max(2000), z.number(), z.boolean(), z.null()])
)), asyncHandler(async (req, res) => {
  const entries = Object.entries(req.body);

  await prisma.$transaction(entries.map(([key, value]) =>
    prisma.siteConfig.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    })
  ));

  invalidateContentCache();
  const rows = await prisma.siteConfig.findMany({ orderBy: { key: 'asc' } });
  res.json(Object.fromEntries(rows.map(r => [r.key, r.value])));
}));

router.delete('/:key', asyncHandler(async (req, res) => {
  await prisma.siteConfig.delete({ where: { key: req.params.key } });
  invalidateContentCache();
  res.json({ ok: true });
}));

module.exports = router;
