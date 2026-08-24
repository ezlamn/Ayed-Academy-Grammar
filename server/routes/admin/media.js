/* ================================================================
   ADMIN/MEDIA.JS — مكتبة الميديا (رفع / عرض / حذف)
   ================================================================ */
const express = require('express');
const { z } = require('zod');

const { prisma } = require('../../db/prisma');
const { asyncHandler, HttpError } = require('../../middleware/errorHandler');
const { validate } = require('../../middleware/validate');
const { upload } = require('../../middleware/upload');
const { invalidateContentCache } = require('../../services/contentSerializer');
const mediaService = require('../../services/mediaService');
const { idParam } = require('../../utils/schemas');

const router = express.Router();

const listQuery = z.object({
  kind: z.enum(['audio', 'image']).optional(),
  q: z.string().trim().max(200).optional(),
  take: z.coerce.number().int().min(1).max(200).default(60),
  skip: z.coerce.number().int().min(0).default(0),
});

router.get('/', validate(listQuery, 'query'), asyncHandler(async (req, res) => {
  const { kind, q, take, skip } = req.validatedQuery;
  const where = {
    ...(kind ? { kind } : {}),
    ...(q ? { originalName: { contains: q, mode: 'insensitive' } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.mediaAsset.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
      skip,
      include: { _count: { select: { questions: true, examQuestions: true } } },
    }),
    prisma.mediaAsset.count({ where }),
  ]);

  res.json({ items, total, take, skip });
}));

// ── رفع ملف واحد أو أكتر ──────────────────────────────────────
router.post('/', upload.array('files', 10), asyncHandler(async (req, res) => {
  if (!req.files || !req.files.length) throw new HttpError(400, 'مفيش ملفات مرفوعة');

  const assets = [];
  for (const file of req.files) {
    // storeBuffer بيعمل dedupe بالـ sha256 — رفع نفس الملف تاني بيرجّع نفس السجل
    assets.push(await mediaService.storeBuffer(file.buffer, file.mimetype, file.originalname));
  }

  res.status(201).json(assets);
}));

// ── حذف ───────────────────────────────────────────────────────
router.delete('/:id', validate(idParam, 'params'),
  validate(z.object({ force: z.coerce.boolean().default(false) }), 'query'),
  asyncHandler(async (req, res) => {
    const used = await mediaService.usageCount(req.params.id);
    if (used > 0 && !req.validatedQuery.force) {
      throw new HttpError(409, `الملف مستخدم في ${used} سؤال. أضف force=true للحذف رغم ذلك.`);
    }

    const asset = await mediaService.deleteAsset(req.params.id);
    if (!asset) throw new HttpError(404, 'الملف غير موجود');

    // لو كان مستخدماً، الروابط بقت null (onDelete: SetNull) فالمحتوى اتغيّر
    if (used > 0) invalidateContentCache();
    res.json({ ok: true, unlinkedFrom: used });
  }));

module.exports = router;
