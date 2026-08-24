/* ================================================================
   MEDIA-SERVICE.JS — تخزين الملفات على القرص + سجل MediaAsset
   ----------------------------------------------------------------
   اسم الملف = sha256 للمحتوى، فرفع نفس الملف مرتين بيرجّع نفس
   السجل من غير تكرار على القرص. ده مهم بالذات في النقل من
   db.json حيث نفس المقطع الصوتي متكرر في أسئلة كتير.
   ================================================================ */
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const env = require('../config/env');
const { prisma } = require('../db/prisma');

const MIME_EXT = {
  'audio/mpeg': '.mp3',
  'audio/mp3': '.mp3',
  'audio/wav': '.wav',
  'audio/x-wav': '.wav',
  'audio/wave': '.wav',
  'audio/ogg': '.ogg',
  'audio/webm': '.webm',
  'audio/mp4': '.m4a',
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
};

const ALLOWED_MIMES = Object.keys(MIME_EXT);

function kindOf(mimeType) {
  return mimeType.startsWith('audio/') ? 'audio' : 'image';
}

function dirFor(kind) {
  return path.join(env.UPLOAD_DIR, kind === 'audio' ? 'audio' : 'images');
}

function ensureDirs() {
  for (const kind of ['audio', 'images']) {
    fs.mkdirSync(path.join(env.UPLOAD_DIR, kind), { recursive: true });
  }
}

/**
 * يخزّن buffer كملف ميديا ويرجّع سجل MediaAsset (موجود أو جديد).
 * @param {Buffer} buffer
 * @param {string} mimeType
 * @param {string} [originalName]
 */
async function storeBuffer(buffer, mimeType, originalName) {
  if (!ALLOWED_MIMES.includes(mimeType)) {
    const err = new Error(`نوع الملف غير مدعوم: ${mimeType}`);
    err.status = 415;
    throw err;
  }

  const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');

  const existing = await prisma.mediaAsset.findUnique({ where: { sha256 } });
  if (existing) return existing;

  const kind = kindOf(mimeType);
  const filename = sha256 + MIME_EXT[mimeType];
  const dir = dirFor(kind);
  await fsp.mkdir(dir, { recursive: true });
  await fsp.writeFile(path.join(dir, filename), buffer);

  const publicPath = `/uploads/${kind === 'audio' ? 'audio' : 'images'}/${filename}`;

  return prisma.mediaAsset.create({
    data: {
      kind,
      filename,
      publicPath,
      originalName: originalName || null,
      mimeType,
      sizeBytes: buffer.length,
      sha256,
    },
  });
}

/**
 * يفكّ data URI ويخزّنه كملف. يرجّع null لو النص مش data URI.
 * بيستخدمه سكريبت النقل لاستخراج الصوتيات base64 من db.json.
 */
async function storeDataUri(dataUri, originalName) {
  if (typeof dataUri !== 'string') return null;
  const match = /^data:([\w/+.-]+);base64,(.*)$/s.exec(dataUri.trim());
  if (!match) return null;

  const [, mimeType, base64] = match;
  const buffer = Buffer.from(base64, 'base64');
  if (!buffer.length) return null;

  return storeBuffer(buffer, mimeType.toLowerCase(), originalName);
}

/** يحذف الملف من القرص والسجل من الداتابيز. */
async function deleteAsset(id) {
  const asset = await prisma.mediaAsset.findUnique({ where: { id } });
  if (!asset) return null;

  const filePath = path.join(dirFor(asset.kind), asset.filename);
  await fsp.rm(filePath, { force: true });
  await prisma.mediaAsset.delete({ where: { id } });
  return asset;
}

/** يعدّ الأماكن اللي بتستخدم الملف — عشان نحذّر قبل الحذف. */
async function usageCount(id) {
  const [questions, examQuestions] = await Promise.all([
    prisma.question.count({ where: { audioAssetId: id } }),
    prisma.examQuestion.count({ where: { audioAssetId: id } }),
  ]);
  return questions + examQuestions;
}

module.exports = {
  ALLOWED_MIMES,
  MIME_EXT,
  ensureDirs,
  kindOf,
  storeBuffer,
  storeDataUri,
  deleteAsset,
  usageCount,
};
