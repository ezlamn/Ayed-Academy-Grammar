/* ================================================================
   ORDERING.JS — مساعدات ترتيب العناصر داخل الأب
   ================================================================ */
const { prisma } = require('../db/prisma');

/** يرجّع الترتيب التالي (آخر واحد + 1) لعنصر جديد. */
async function nextOrder(model, where) {
  const last = await prisma[model].findFirst({
    where,
    orderBy: { order: 'desc' },
    select: { order: true },
  });
  return last ? last.order + 1 : 0;
}

/**
 * يعيد ترتيب عناصر حسب مصفوفة ids، ويرفض لو فيه id مش تابع للأب.
 * @param {string} model اسم الموديل في Prisma
 * @param {object} where شرط الأب — عشان ما نرتّبش عناصر أب تاني
 * @param {number[]} ids الترتيب الجديد
 */
async function applyOrder(model, where, ids) {
  const owned = await prisma[model].findMany({ where, select: { id: true } });
  const ownedIds = new Set(owned.map(r => r.id));

  const invalid = ids.filter(id => !ownedIds.has(id));
  if (invalid.length) {
    const err = new Error(`عناصر لا تنتمي لهذا الأب: ${invalid.join(', ')}`);
    err.status = 400;
    throw err;
  }

  // العناصر غير المذكورة تتحط بعد المذكورة بترتيبها الحالي
  const rest = owned.map(r => r.id).filter(id => !ids.includes(id));
  const finalOrder = [...ids, ...rest];

  await prisma.$transaction(
    finalOrder.map((id, index) =>
      prisma[model].update({ where: { id }, data: { order: index } })
    )
  );
  return finalOrder;
}

module.exports = { nextOrder, applyOrder };
