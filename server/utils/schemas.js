/* ================================================================
   SCHEMAS.JS — مخططات zod مشتركة لمدخلات لوحة التحكم
   ----------------------------------------------------------------
   الحقول اللي بتقبل HTML بتتنضّف بـ transform عند التحقق نفسه،
   فما فيش طريق يوصل بيه HTML خام للداتابيز.
   ================================================================ */
const { z } = require('zod');
const { cleanHtml, stripTags, cleanDeep } = require('./sanitize');

// ── أنواع أساسية ───────────────────────────────────────────────

/** نص عادي (بدون أي HTML). */
const plain = (max = 500) =>
  z.string().trim().max(max).transform(stripTags);

/** نص يسمح بوسوم تنسيق محدودة. */
const rich = (max = 20000) =>
  z.string().max(max).transform(cleanHtml);

const idParam = z.object({
  id: z.coerce.number().int().positive(),
});

const trackEnum = z.enum(['grammar', 'reading', 'listening']);

// ── الوحدة ─────────────────────────────────────────────────────

const unitCreateSchema = z.object({
  track: trackEnum,
  legacyId: plain(50).optional(),
  emoji: plain(16).nullish(),
  nameAr: plain(200),
  nameEn: plain(200),
  title: plain(300).nullish(),
  type: plain(50).nullish(),
  tag: plain(120).nullish(),
  mascot: plain(16).nullish(),
  published: z.boolean().optional(),
});

const unitUpdateSchema = unitCreateSchema.partial().omit({ track: true });

// ── الاستراتيجية ───────────────────────────────────────────────

const keywordSchema = z.object({
  f: rich(500),
  b: rich(500),
});

const formulaSchema = z.object({
  subj: rich(500),
  form: rich(500),
  ex: rich(2000),
  note: rich(2000).optional().default(''),
});

const exceptionSchema = z.object({
  title: rich(500),
  body: rich(8000),
});

/**
 * بلوكات العرض. المفاتيح غير المرسلة **تُحذف** من الـ payload —
 * وده مقصود: الـ serializer بينشر blocks كما هي، والواجهة بتفحص
 * وجود المفتاح.
 */
const blocksSchema = z.object({
  keywords: z.array(keywordSchema).optional(),
  formulas: z.array(formulaSchema).optional(),
  exception: exceptionSchema.optional(),
  treeDiagram: z.any().optional().transform(v => (v === undefined ? undefined : cleanDeep(v))),
}).strip();

const strategyCreateSchema = z.object({
  unitId: z.coerce.number().int().positive(),
  legacyId: plain(50).optional(),
  theme: plain(60).nullish(),
  icon: plain(16).nullish(),
  title: rich(500),
  subtitle: plain(300).nullish(),
  badge: plain(120).nullish(),
  usage: rich(8000).nullish(),
  videoUrl: z.string().trim().max(1000).nullish(),
  tip: rich(4000).nullish(),
  blocks: blocksSchema.optional(),
});

const strategyUpdateSchema = strategyCreateSchema.partial().omit({ unitId: true });

// ── السؤال ─────────────────────────────────────────────────────

const questionCreateSchema = z.object({
  unitId: z.coerce.number().int().positive(),
  strategyId: z.coerce.number().int().positive().nullish(),
  text: rich(5000),
  opts: z.array(rich(1000)).min(2, 'محتاج اختيارين على الأقل').max(6, 'الحد الأقصى 6 اختيارات'),
  correctIndex: z.coerce.number().int().min(0),
  explanation: rich(5000).nullish(),
  audioUrl: z.string().trim().max(1000).nullish(),
  audioAssetId: z.coerce.number().int().positive().nullish(),
  imgUrl: z.string().trim().max(1000).nullish(),
  passageText: rich(20000).nullish(),
}).refine(d => d.correctIndex < d.opts.length, {
  message: 'رقم الإجابة الصحيحة خارج نطاق الاختيارات',
  path: ['correctIndex'],
});

const questionUpdateSchema = z.object({
  text: rich(5000).optional(),
  opts: z.array(rich(1000)).min(2).max(6).optional(),
  correctIndex: z.coerce.number().int().min(0).optional(),
  explanation: rich(5000).nullish(),
  audioUrl: z.string().trim().max(1000).nullish(),
  audioAssetId: z.coerce.number().int().positive().nullish(),
  imgUrl: z.string().trim().max(1000).nullish(),
  passageText: rich(20000).nullish(),
  strategyId: z.coerce.number().int().positive().nullish(),
});

// ── فيديو / مفردات ─────────────────────────────────────────────

const videoSchema = z.object({
  unitId: z.coerce.number().int().positive(),
  title: plain(300).nullish(),
  url: z.string().trim().min(1, 'الرابط مطلوب').max(1000),
});

const videoUpdateSchema = videoSchema.partial().omit({ unitId: true });

const vocabCategorySchema = z.object({
  unitId: z.coerce.number().int().positive(),
  title: plain(200),
  color: plain(30).nullish(),
});

const vocabCategoryUpdateSchema = vocabCategorySchema.partial().omit({ unitId: true });

const vocabWordSchema = z.object({
  categoryId: z.coerce.number().int().positive(),
  en: plain(200),
  ar: plain(200),
});

const vocabWordUpdateSchema = vocabWordSchema.partial().omit({ categoryId: true });

// ── إعادة الترتيب ──────────────────────────────────────────────

const reorderSchema = z.object({
  ids: z.array(z.coerce.number().int().positive()).min(1),
});

// ── الامتحانات ─────────────────────────────────────────────────

const examSchema = z.object({
  title: plain(300),
  description: rich(2000).nullish(),
  durationMin: z.coerce.number().int().min(1).max(600).optional(),
  published: z.boolean().optional(),
});

const examUpdateSchema = examSchema.partial();

const examQuestionSchema = z.object({
  examId: z.coerce.number().int().positive(),
  section: z.enum(['listening', 'reading', 'grammar', 'writing']),
  sourceQuestionId: z.coerce.number().int().positive().nullish(),
  text: rich(5000),
  opts: z.array(rich(1000)).min(2).max(6),
  correctIndex: z.coerce.number().int().min(0),
  explanation: rich(5000).nullish(),
  audioUrl: z.string().trim().max(1000).nullish(),
  audioAssetId: z.coerce.number().int().positive().nullish(),
  imgUrl: z.string().trim().max(1000).nullish(),
  passageText: rich(20000).nullish(),
}).refine(d => d.correctIndex < d.opts.length, {
  message: 'رقم الإجابة الصحيحة خارج نطاق الاختيارات',
  path: ['correctIndex'],
});

const examQuestionUpdateSchema = z.object({
  section: z.enum(['listening', 'reading', 'grammar', 'writing']).optional(),
  text: rich(5000).optional(),
  opts: z.array(rich(1000)).min(2).max(6).optional(),
  correctIndex: z.coerce.number().int().min(0).optional(),
  explanation: rich(5000).nullish(),
  audioUrl: z.string().trim().max(1000).nullish(),
  audioAssetId: z.coerce.number().int().positive().nullish(),
  imgUrl: z.string().trim().max(1000).nullish(),
  passageText: rich(20000).nullish(),
});

module.exports = {
  plain,
  rich,
  idParam,
  trackEnum,
  unitCreateSchema,
  unitUpdateSchema,
  strategyCreateSchema,
  strategyUpdateSchema,
  blocksSchema,
  questionCreateSchema,
  questionUpdateSchema,
  videoSchema,
  videoUpdateSchema,
  vocabCategorySchema,
  vocabCategoryUpdateSchema,
  vocabWordSchema,
  vocabWordUpdateSchema,
  reorderSchema,
  examSchema,
  examUpdateSchema,
  examQuestionSchema,
  examQuestionUpdateSchema,
};
