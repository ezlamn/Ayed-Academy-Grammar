/* ================================================================
   MIGRATE-JSON-TO-DB.JS — نقل data/db.json إلى PostgreSQL
   ----------------------------------------------------------------
   يشتغل مرة واحدة. بيعمل:
   1. نسخة احتياطية من db.json بختم زمني
   2. إدخال الوحدات والاستراتيجيات والأسئلة والفيديوهات والمفردات
   3. استخراج الصوتيات base64 → ملفات على القرص + سجلات MediaAsset
   4. إنشاء حساب الأدمن من .env

   الأمان: بيرفض يشتغل لو الداتابيز فيها محتوى، إلا مع --force
   (اللي بيمسح المحتوى الموجود الأول).

     node scripts/migrate-json-to-db.js
     node scripts/migrate-json-to-db.js --force
   ================================================================ */
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const env = require('../server/config/env');
const { prisma, disconnect } = require('../server/db/prisma');
const mediaService = require('../server/services/mediaService');

const DB_FILE = path.join(env.ROOT, 'data', 'db.json');
const FORCE = process.argv.includes('--force');

const stats = {
  units: 0, strategies: 0, quizzes: 0, practice: 0,
  videos: 0, vocabCategories: 0, vocabWords: 0,
  audioExtracted: 0, audioDeduped: 0, audioBytes: 0,
  config: 0,
};

// ── مساعدات ────────────────────────────────────────────────────

/** يحوّل قيمة فاضية/غير موجودة إلى null عشان الـ serializer يحذفها. */
const nn = v => (v === undefined || v === '' ? null : v);

/**
 * يستخرج بلوكات العرض بنفس المفاتيح الموجودة فعلاً.
 * مهم: المفتاح غير الموجود ما يتحطش خالص — الـ serializer بينشر
 * blocks كما هي، والواجهة بتفحص وجود المفتاح.
 */
function extractBlocks(strategy) {
  const blocks = {};
  for (const key of ['keywords', 'formulas', 'exception', 'treeDiagram']) {
    if (key in strategy && strategy[key] !== undefined) blocks[key] = strategy[key];
  }
  return blocks;
}

/**
 * يجهّز بيانات سؤال. لو فيه صوت base64 بيستخرجه لملف ويرجّع
 * audioAssetId بدل النص الضخم.
 */
async function prepareQuestion(q, label) {
  const data = {
    text: q.q ?? '',
    opts: q.opts ?? [],
    correctIndex: typeof q.c === 'number' ? q.c : 0,
    explanation: nn(q.expl),
    imgUrl: nn(q.imgUrl),
    passageText: nn(q.passageText),
    audioUrl: null,
    audioAssetId: null,
  };

  if (typeof q.audioUrl === 'string' && q.audioUrl.trim()) {
    if (q.audioUrl.startsWith('data:')) {
      const before = await prisma.mediaAsset.count();
      const asset = await mediaService.storeDataUri(q.audioUrl, `${label}.audio`);
      if (asset) {
        data.audioAssetId = asset.id;
        const after = await prisma.mediaAsset.count();
        if (after > before) {
          stats.audioExtracted += 1;
          stats.audioBytes += asset.sizeBytes;
        } else {
          stats.audioDeduped += 1;
        }
      }
    } else {
      // رابط خارجي — يتخزن كما هو
      data.audioUrl = q.audioUrl;
    }
  }

  return data;
}

// ── النقل ──────────────────────────────────────────────────────

async function migrateTrack(track, units) {
  for (const [unitIndex, u] of units.entries()) {
    const page = u.page || {};

    const unit = await prisma.unit.create({
      data: {
        track,
        legacyId: String(u.id),
        order: unitIndex,
        emoji: nn(u.emoji),
        nameAr: u.nameAr ?? '',
        nameEn: u.nameEn ?? '',
        title: nn(u.title),
        // الريدينج بيحط type على الوحدة، والليسينينج بيحطه على page
        type: nn(u.type ?? page.type),
        tag: nn(page.tag),
        mascot: nn(page.mascot),
        published: true,
      },
    });
    stats.units += 1;

    // ── الاستراتيجيات وتمارينها ──
    for (const [si, s] of (page.strategies || []).entries()) {
      const strategy = await prisma.strategy.create({
        data: {
          unitId: unit.id,
          legacyId: String(s.id ?? `${track}-${u.id}-s${si + 1}`),
          order: si,
          theme: nn(s.theme),
          icon: nn(s.icon),
          title: s.title ?? '',
          subtitle: nn(s.subtitle),
          badge: nn(s.badge),
          usage: nn(s.usage),
          videoUrl: nn(s.videoUrl),
          tip: nn(s.tip),
          blocks: extractBlocks(s),
        },
      });
      stats.strategies += 1;

      for (const [pi, q] of (s.practice || []).entries()) {
        await prisma.question.create({
          data: {
            unitId: unit.id,
            strategyId: strategy.id,
            source: 'PRACTICE',
            order: pi,
            ...(await prepareQuestion(q, `${strategy.legacyId}-p${pi + 1}`)),
          },
        });
        stats.practice += 1;
      }
    }

    // ── كويزات الوحدة ──
    for (const [qi, q] of (page.quizzes || []).entries()) {
      await prisma.question.create({
        data: {
          unitId: unit.id,
          strategyId: null,
          source: 'QUIZ',
          order: qi,
          ...(await prepareQuestion(q, `${track}-${u.id}-q${qi + 1}`)),
        },
      });
      stats.quizzes += 1;
    }

    // ── الفيديوهات ──
    for (const [vi, v] of (page.videos || []).entries()) {
      await prisma.video.create({
        data: { unitId: unit.id, order: vi, title: nn(v.title), url: v.url ?? '' },
      });
      stats.videos += 1;
    }

    // ── المفردات ──
    for (const [ci, c] of (page.vocabCategories || []).entries()) {
      const category = await prisma.vocabCategory.create({
        data: { unitId: unit.id, order: ci, title: c.title ?? '', color: nn(c.color) },
      });
      stats.vocabCategories += 1;

      const words = (c.words || []).map((w, wi) => ({
        categoryId: category.id,
        order: wi,
        en: w.en ?? '',
        ar: w.ar ?? '',
      }));
      if (words.length) {
        await prisma.vocabWord.createMany({ data: words });
        stats.vocabWords += words.length;
      }
    }
  }
}

async function migrateConfig(config) {
  for (const [key, value] of Object.entries(config || {})) {
    await prisma.siteConfig.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
    stats.config += 1;
  }
}

async function ensureAdmin() {
  if (!env.ADMIN_PASSWORD) {
    console.log('⚠️  ADMIN_PASSWORD فاضي في .env — تخطّي إنشاء حساب الأدمن.');
    return;
  }

  const existing = await prisma.admin.findUnique({ where: { email: env.ADMIN_EMAIL } });
  if (existing) {
    console.log(`ℹ️  حساب الأدمن موجود بالفعل: ${env.ADMIN_EMAIL}`);
    return;
  }

  await prisma.admin.create({
    data: {
      email: env.ADMIN_EMAIL,
      name: env.ADMIN_NAME,
      passwordHash: await bcrypt.hash(env.ADMIN_PASSWORD, 12),
    },
  });
  console.log(`✅ اتعمل حساب أدمن: ${env.ADMIN_EMAIL}`);
}

async function clearContent() {
  // الترتيب مهم بسبب المفاتيح الأجنبية (رغم الـ cascade، بنكون صريحين)
  await prisma.questionAttempt.deleteMany();
  await prisma.question.deleteMany();
  await prisma.strategy.deleteMany();
  await prisma.video.deleteMany();
  await prisma.vocabWord.deleteMany();
  await prisma.vocabCategory.deleteMany();
  await prisma.unitProgress.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.siteConfig.deleteMany();
  console.log('🗑️  المحتوى القديم اتمسح (--force).');
}

// ── التشغيل ────────────────────────────────────────────────────

async function main() {
  if (!fs.existsSync(DB_FILE)) {
    console.error(`❌ الملف مش موجود: ${DB_FILE}`);
    process.exit(1);
  }

  const existingUnits = await prisma.unit.count();
  if (existingUnits > 0 && !FORCE) {
    console.error(`❌ الداتابيز فيها ${existingUnits} وحدة بالفعل.`);
    console.error('   شغّل بـ --force لمسحها وإعادة النقل من الأول.');
    process.exit(1);
  }

  // 1. نسخة احتياطية
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backup = path.join(env.ROOT, 'data', `db.backup-before-postgres-${stamp}.json`);
  fs.copyFileSync(DB_FILE, backup);
  console.log(`📦 نسخة احتياطية: ${path.basename(backup)}`);

  const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));

  if (existingUnits > 0) await clearContent();

  mediaService.ensureDirs();

  // 2. النقل
  console.log('\n⏳ جاري النقل...\n');
  for (const track of ['grammar', 'reading', 'listening']) {
    if (!Array.isArray(data[track])) continue;
    await migrateTrack(track, data[track]);
    console.log(`   ✓ ${track}: ${data[track].length} وحدة`);
  }

  await migrateConfig(data.config);
  await ensureAdmin();

  // 3. الملخّص
  console.log('\n📊 الملخّص:');
  console.log(`   الوحدات            ${stats.units}`);
  console.log(`   الاستراتيجيات      ${stats.strategies}`);
  console.log(`   أسئلة التمارين     ${stats.practice}`);
  console.log(`   أسئلة الكويزات     ${stats.quizzes}`);
  console.log(`   الفيديوهات         ${stats.videos}`);
  console.log(`   تصنيفات المفردات   ${stats.vocabCategories}`);
  console.log(`   الكلمات            ${stats.vocabWords}`);
  console.log(`   الإعدادات          ${stats.config}`);
  console.log(`   ملفات صوت مستخرجة  ${stats.audioExtracted} (${(stats.audioBytes / 1024).toFixed(0)} KB)`);
  console.log(`   صوتيات مكرّرة      ${stats.audioDeduped} (اتخزنت مرة واحدة)`);

  console.log('\n✅ خلص النقل. الخطوة الجاية:  npm run verify:parity\n');
}

main()
  .catch(err => {
    console.error('\n❌ فشل النقل:', err);
    process.exitCode = 1;
  })
  .finally(disconnect);
