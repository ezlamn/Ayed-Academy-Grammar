/* ================================================================
   VERIFY-PARITY.JS — يقارن مخرجات الداتابيز بـ db.json الأصلي
   ----------------------------------------------------------------
   اختبار القبول للمرحلة 2: لازم يطلع صفر فروق حقيقية قبل ما نعتمد
   على الداتابيز كمصدر للمحتوى.

   الفروق بتتقسم نوعين:
   • حقيقية  → قيمة اختلفت أو اتفقدت. لازم تبقى صفر.
   • مقبولة  → "مصفوفة فاضية" مقابل "مفتاح غير موجود". كل مستهلكي
              البيانات في الواجهة بيستخدموا (x || []) فالحالتين
              متطابقتين سلوكياً. بتتعرض للعلم بس.

     node scripts/verify-parity.js
   ================================================================ */
const fs = require('fs');
const path = require('path');

const env = require('../server/config/env');
const { disconnect } = require('../server/db/prisma');
const { buildContentPayload } = require('../server/services/contentSerializer');

const DB_FILE = path.join(env.ROOT, 'data', 'db.json');

const realDiffs = [];
const benignDiffs = [];

const isEmptyArray = v => Array.isArray(v) && v.length === 0;
const isObject = v => v !== null && typeof v === 'object' && !Array.isArray(v);

/** "مفتاح ناقص" ≡ "مصفوفة فاضية" — الواجهة بتعامل الاتنين بنفس الشكل. */
function benignAbsence(a, b) {
  return (a === undefined && isEmptyArray(b)) || (isEmptyArray(a) && b === undefined);
}

function compare(expected, actual, pathStr) {
  if (benignAbsence(expected, actual)) {
    benignDiffs.push(pathStr);
    return;
  }

  if (expected === undefined || actual === undefined) {
    realDiffs.push({
      path: pathStr,
      issue: expected === undefined ? 'مفتاح زائد في الداتابيز' : 'مفتاح ناقص من الداتابيز',
      expected: preview(expected),
      actual: preview(actual),
    });
    return;
  }

  if (Array.isArray(expected) || Array.isArray(actual)) {
    if (!Array.isArray(expected) || !Array.isArray(actual)) {
      realDiffs.push({ path: pathStr, issue: 'النوع مختلف', expected: preview(expected), actual: preview(actual) });
      return;
    }
    if (expected.length !== actual.length) {
      realDiffs.push({
        path: pathStr,
        issue: 'طول المصفوفة مختلف',
        expected: expected.length,
        actual: actual.length,
      });
    }
    const len = Math.max(expected.length, actual.length);
    for (let i = 0; i < len; i++) compare(expected[i], actual[i], `${pathStr}[${i}]`);
    return;
  }

  if (isObject(expected) || isObject(actual)) {
    if (!isObject(expected) || !isObject(actual)) {
      realDiffs.push({ path: pathStr, issue: 'النوع مختلف', expected: preview(expected), actual: preview(actual) });
      return;
    }
    const keys = new Set([...Object.keys(expected), ...Object.keys(actual)]);
    for (const key of keys) compare(expected[key], actual[key], `${pathStr}.${key}`);
    return;
  }

  if (expected !== actual) {
    realDiffs.push({ path: pathStr, issue: 'قيمة مختلفة', expected: preview(expected), actual: preview(actual) });
  }
}

function preview(v) {
  if (v === undefined) return '(غير موجود)';
  const s = typeof v === 'string' ? v : JSON.stringify(v);
  if (s === undefined) return String(v);
  return s.length > 100 ? s.slice(0, 100) + '…' : s;
}

/**
 * الصوتيات اتحوّلت من base64 لملفات — الفرق ده مقصود، مش خطأ.
 * بنستبدل أي data URI في الأصل بعلامة، ونستبدل مسار /uploads/audio/
 * في المخرجات بنفس العلامة، عشان المقارنة تركّز على المحتوى.
 */
function normalizeAudio(node) {
  if (Array.isArray(node)) return node.map(normalizeAudio);
  if (isObject(node)) {
    const out = {};
    for (const [k, v] of Object.entries(node)) {
      if (k === 'audioUrl' && typeof v === 'string') {
        out[k] = v.startsWith('data:') || v.startsWith('/uploads/audio/')
          ? '<AUDIO>'
          : v;
      } else {
        out[k] = normalizeAudio(v);
      }
    }
    return out;
  }
  return node;
}

/** يعدّ الصوتيات في كل جانب — لازم يتطابقوا حتى لو الشكل اتغيّر. */
function countAudio(node, counter = { data: 0, file: 0, external: 0 }) {
  if (Array.isArray(node)) {
    node.forEach(n => countAudio(n, counter));
  } else if (isObject(node)) {
    for (const [k, v] of Object.entries(node)) {
      if (k === 'audioUrl' && typeof v === 'string') {
        if (v.startsWith('data:')) counter.data += 1;
        else if (v.startsWith('/uploads/')) counter.file += 1;
        else counter.external += 1;
      } else {
        countAudio(v, counter);
      }
    }
  }
  return counter;
}

async function main() {
  if (!fs.existsSync(DB_FILE)) {
    console.error(`❌ الملف المرجعي مش موجود: ${DB_FILE}`);
    process.exit(1);
  }

  const original = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  const fromDb = await buildContentPayload({ includeUnpublished: true });

  const originalAudio = countAudio(original);
  const dbAudio = countAudio(fromDb);

  compare(normalizeAudio(original), normalizeAudio(fromDb), '$');

  // ── التقرير ──
  console.log('\n══════════ تقرير المطابقة ══════════\n');

  for (const track of ['grammar', 'reading', 'listening', 'tests']) {
    const a = (original[track] || []).length;
    const b = (fromDb[track] || []).length;
    console.log(`  ${track.padEnd(12)} الأصل: ${String(a).padStart(3)}   الداتابيز: ${String(b).padStart(3)}  ${a === b ? '✓' : '✗'}`);
  }

  console.log('\n  الصوتيات:');
  console.log(`    base64 في الأصل      ${originalAudio.data}`);
  console.log(`    ملفات في الداتابيز   ${dbAudio.file}`);
  console.log(`    روابط خارجية         ${originalAudio.external} → ${dbAudio.external}`);

  const audioOk = originalAudio.data === dbAudio.file && originalAudio.external === dbAudio.external;
  console.log(`    ${audioOk ? '✓ كل الصوتيات اتنقلت' : '✗ عدد الصوتيات مش متطابق'}`);

  if (benignDiffs.length) {
    console.log(`\n  ℹ️  ${benignDiffs.length} فرق مقبول (مصفوفة فاضية ↔ مفتاح غير موجود):`);
    benignDiffs.slice(0, 10).forEach(p => console.log(`     ${p}`));
    if (benignDiffs.length > 10) console.log(`     … و${benignDiffs.length - 10} غيرها`);
    console.log('     الواجهة بتقرأ الحالتين بـ (x || []) فالسلوك واحد.');
  }

  if (realDiffs.length) {
    console.log(`\n  ❌ ${realDiffs.length} فرق حقيقي:\n`);
    realDiffs.slice(0, 40).forEach(d => {
      console.log(`     ${d.path}`);
      console.log(`       ${d.issue}`);
      console.log(`       الأصل     : ${d.expected}`);
      console.log(`       الداتابيز : ${d.actual}\n`);
    });
    if (realDiffs.length > 40) console.log(`     … و${realDiffs.length - 40} فرق آخر`);
    console.log('\n═══════════════════════════════════\n');
    process.exitCode = 1;
    return;
  }

  if (!audioOk) {
    console.log('\n═══════════════════════════════════\n');
    process.exitCode = 1;
    return;
  }

  console.log('\n  ✅ صفر فروق حقيقية — الداتابيز بتنتج نفس المحتوى بالضبط.');
  console.log('\n═══════════════════════════════════\n');
}

main()
  .catch(err => {
    console.error('\n❌ فشل التحقق:', err);
    process.exitCode = 1;
  })
  .finally(disconnect);
