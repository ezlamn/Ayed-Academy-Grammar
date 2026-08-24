/* ================================================================
   CONTENT-SERIALIZER.JS — يعيد بناء شكل db.json من الداتابيز
   ----------------------------------------------------------------
   ⭐ حجر الزاوية في المشروع: الواجهة الحالية (renderers.js,
   mock_exam.js, units.js) بتستهلك شكل محدد جداً. الملف ده مسؤول
   عن إنتاج نفس الشكل بالضبط عشان الواجهة ما تتغيّرش.

   قواعد مثبتة بالفحص على db.json الأصلي:
   • unit.id رقم للجرامر/الليسينينج، ونص للريدينج ("r1", "rv1").
   • الحقول الفاضية تتحذف مش تترجع null — الواجهة بتفحص
     `s.keywords && s.keywords.length` مش `!== null`.
   • المصفوفات الفاضية تتحذف: كل المستهلكين بيستخدموا `(x || [])`
     فـ "مفتاح ناقص" و "مصفوفة فاضية" متطابقين سلوكياً.
   • listening بيحط type على page، والريدينج بيحطه على الوحدة.
   ================================================================ */
const { prisma } = require('../db/prisma');

// ── كاش في الذاكرة ─────────────────────────────────────────────
// الاستعلام المتداخل تقيل، والمحتوى بيتغيّر نادراً (كتابة أدمن بس).
let cache = null;
let cachePromise = null;

function invalidateContentCache() {
  cache = null;
  cachePromise = null;
}

// ── مساعدات ────────────────────────────────────────────────────

/** يضيف المفتاح فقط لو القيمة مش null/undefined. */
function put(target, key, value) {
  if (value !== null && value !== undefined) target[key] = value;
  return target;
}

/** يضيف المصفوفة فقط لو فيها عناصر. */
function putArray(target, key, arr) {
  if (Array.isArray(arr) && arr.length > 0) target[key] = arr;
  return target;
}

/** id الوحدة: رقم للتراكات الرقمية، نص زي ما هو للريدينج. */
function serializeUnitId(track, legacyId) {
  if (track === 'reading') return legacyId;
  const n = Number(legacyId);
  return Number.isFinite(n) ? n : legacyId;
}

/** رابط الصوت: الملف المرفوع له الأولوية على الرابط الخارجي. */
function audioUrlOf(row) {
  if (row.audioAsset) return row.audioAsset.publicPath;
  return row.audioUrl || null;
}

// ── تحويل السؤال ───────────────────────────────────────────────
// الشكل المتوقع: { q, opts, c, expl } + audioUrl/imgUrl/passageText
function serializeQuestion(row) {
  const out = { q: row.text, opts: row.opts, c: row.correctIndex };
  put(out, 'expl', row.explanation);
  put(out, 'audioUrl', audioUrlOf(row));
  put(out, 'imgUrl', row.imgUrl);
  put(out, 'passageText', row.passageText);
  return out;
}

// ── تحويل الاستراتيجية ─────────────────────────────────────────
// blocks (JSONB) بيتنشر في المستوى الأعلى: keywords / formulas /
// exception / treeDiagram — بنفس ترتيب ومحتوى الأصل.
function serializeStrategy(row) {
  const out = {};
  put(out, 'id', row.legacyId);
  put(out, 'theme', row.theme);
  put(out, 'icon', row.icon);
  put(out, 'title', row.title);
  put(out, 'subtitle', row.subtitle);
  put(out, 'badge', row.badge);
  put(out, 'usage', row.usage);

  const blocks = row.blocks && typeof row.blocks === 'object' ? row.blocks : {};
  for (const [key, value] of Object.entries(blocks)) put(out, key, value);

  put(out, 'videoUrl', row.videoUrl);
  put(out, 'tip', row.tip);
  putArray(out, 'practice', (row.questions || []).map(serializeQuestion));
  return out;
}

// ── تحويل الوحدة ───────────────────────────────────────────────
function serializeUnit(row) {
  const track = row.track;
  const unit = { id: serializeUnitId(track, row.legacyId) };

  // الريدينج بيحمل title و type على مستوى الوحدة
  if (track === 'reading') {
    put(unit, 'title', row.title);
    put(unit, 'type', row.type);
  }

  put(unit, 'emoji', row.emoji);
  put(unit, 'nameAr', row.nameAr);
  put(unit, 'nameEn', row.nameEn);

  // ── page ──
  const page = {};
  put(page, 'tag', row.tag);
  put(page, 'mascot', row.mascot);
  // الليسينينج بيحط type جوه page (renderListeningUnit بيفحص p.type === 'vocabulary')
  if (track === 'listening') put(page, 'type', row.type);

  putArray(page, 'strategies', (row.strategies || []).map(serializeStrategy));

  const quizzes = (row.questions || [])
    .filter(q => q.strategyId === null)
    .map(serializeQuestion);
  putArray(page, 'quizzes', quizzes);

  putArray(page, 'videos', (row.videos || []).map(v => {
    const out = {};
    put(out, 'title', v.title);
    put(out, 'url', v.url);
    return out;
  }));

  putArray(page, 'vocabCategories', (row.vocabCategories || []).map(c => {
    const out = { title: c.title };
    put(out, 'color', c.color);
    out.words = (c.words || []).map(w => ({ en: w.en, ar: w.ar }));
    return out;
  }));

  unit.page = page;
  return unit;
}

// ── تحويل نموذج الامتحان ───────────────────────────────────────
// الشكل بيطابق ما بيرجّعه MockExam.buildExam() في mock_exam.js
function serializeExam(row) {
  return {
    id: row.id,
    title: row.title,
    durationMin: row.durationMin,
    questions: (row.questions || []).map(q => {
      const out = {
        section: q.section,
        q: q.text,
        opts: q.opts,
        c: q.correctIndex,
      };
      put(out, 'expl', q.explanation);
      put(out, 'audioUrl', audioUrlOf(q));
      put(out, 'imgUrl', q.imgUrl);
      // mock_exam.js بيسمّيه passage مش passageText في مخرجات buildExam
      put(out, 'passage', q.passageText);
      return out;
    }),
  };
}

// ── الاستعلام ──────────────────────────────────────────────────

const UNIT_INCLUDE = {
  strategies: {
    orderBy: { order: 'asc' },
    include: {
      questions: {
        orderBy: { order: 'asc' },
        include: { audioAsset: true },
      },
    },
  },
  questions: {
    where: { strategyId: null },
    orderBy: { order: 'asc' },
    include: { audioAsset: true },
  },
  videos: { orderBy: { order: 'asc' } },
  vocabCategories: {
    orderBy: { order: 'asc' },
    include: { words: { orderBy: { order: 'asc' } } },
  },
};

/**
 * يبني الـ payload الكامل للـ API العام.
 * @param {{ includeUnpublished?: boolean }} opts
 */
async function buildContentPayload(opts = {}) {
  const { includeUnpublished = false } = opts;

  const [units, exams, configRows] = await Promise.all([
    prisma.unit.findMany({
      where: includeUnpublished ? {} : { published: true },
      orderBy: [{ track: 'asc' }, { order: 'asc' }],
      include: UNIT_INCLUDE,
    }),
    prisma.exam.findMany({
      where: includeUnpublished ? {} : { published: true },
      orderBy: { order: 'asc' },
      include: {
        questions: {
          orderBy: [{ section: 'asc' }, { order: 'asc' }],
          include: { audioAsset: true },
        },
      },
    }),
    prisma.siteConfig.findMany(),
  ]);

  const payload = { grammar: [], reading: [], listening: [], tests: [], config: {} };

  for (const unit of units) {
    payload[unit.track].push(serializeUnit(unit));
  }

  payload.tests = exams.map(serializeExam);

  for (const row of configRows) payload.config[row.key] = row.value;

  return payload;
}

/** نسخة مكاشة — دي اللي الـ API العام بينادي عليها. */
async function getContentPayload() {
  if (cache) return cache;
  // لو في طلبين جم مع بعض، الاتنين يستنوا نفس الوعد بدل ما نستعلم مرتين
  if (!cachePromise) {
    cachePromise = buildContentPayload()
      .then(result => {
        cache = result;
        return result;
      })
      .finally(() => {
        cachePromise = null;
      });
  }
  return cachePromise;
}

module.exports = {
  buildContentPayload,
  getContentPayload,
  invalidateContentCache,
  serializeUnit,
  serializeStrategy,
  serializeQuestion,
  serializeExam,
  UNIT_INCLUDE,
};
