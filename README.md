# عايد أكاديمي — Grammar Strategies

منصة تعليمية تفاعلية لاختبار STEP، مع باك اند على PostgreSQL ولوحة تحكم لإدارة المحتوى.

---

## التشغيل السريع

```bash
# 1. الحزم
npm install
npm run admin:install

# 2. الإعدادات — انسخ المثال واملأ القيم
cp .env.example .env

# 3. قاعدة البيانات
docker compose up -d          # Postgres على المنفذ 5433
npm run db:migrate            # إنشاء الجداول

# 4. نقل المحتوى من data/db.json (مرة واحدة)
npm run migrate:json
npm run verify:parity         # لازم: صفر فروق حقيقية

# 5. بناء لوحة التحكم وتشغيل السيرفر
npm run admin:build
npm start
```

| الرابط | الوصف |
|---|---|
| http://localhost:3100 | الموقع للطلاب |
| http://localhost:3100/admin | لوحة التحكم |

> **ملاحظة عن المنافذ**: السيرفر على **3100** و Postgres على **5433** —
> المنافذ الافتراضية (3000 و 5432) محجوزة بمشاريع Docker أخرى على جهاز التطوير.
> غيّرها من `.env` و `docker-compose.yml` لو محتاج.

بيانات دخول الأدمن الأولى بتتقرا من `ADMIN_EMAIL` و `ADMIN_PASSWORD` في `.env`
وقت تشغيل `migrate:json`. **غيّر كلمة المرور من الإعدادات في اللوحة بعد أول دخول.**

---

## أوامر npm

| الأمر | الوصف |
|---|---|
| `npm start` | تشغيل السيرفر |
| `npm run dev` | تشغيل مع إعادة تحميل تلقائي |
| `npm run admin:dev` | خادم تطوير للوحة (منفذ 5173، بيمرّر الطلبات للسيرفر) |
| `npm run admin:build` | بناء اللوحة إلى `public/admin` |
| `npm run db:migrate` | إنشاء/تطبيق ترحيلات Prisma |
| `npm run db:studio` | متصفح الداتابيز |
| `npm run migrate:json` | نقل `data/db.json` للداتابيز (`--force` لإعادة النقل) |
| `npm run verify:parity` | مقارنة مخرجات الداتابيز بملف `db.json` الأصلي |

---

## البنية

```
server/               الباك اند (Express 5 + Prisma 7)
  config/env.js       قراءة .env والتحقق منه
  db/prisma.js        عميل Prisma (بـ adapter لـ Postgres)
  middleware/         auth · validate · upload · errorHandler
  routes/
    public.js         GET /api/units — الواجهة بتستهلكه
    auth.js           دخول الأدمن وحسابات الطلاب
    student.js        حالة الطالب وتقدّمه ومحاولاته
    admin/            CRUD المحتوى + الطلاب + التحليلات
  services/
    contentSerializer.js  ⭐ يبني شكل db.json من الداتابيز
    mediaService.js       تخزين الملفات (dedupe بـ sha256)
    analyticsService.js   استعلامات التحليلات

admin/                لوحة التحكم (React 19 + Vite)
public/               الواجهة للطلاب (vanilla JS — زي ما هي)
prisma/schema.prisma  نموذج البيانات
scripts/              سكريبتات النقل والتحقق
```

### حجر الزاوية: `contentSerializer.js`

الواجهة الحالية (`renderers.js` و `mock_exam.js`) بتستهلك شكل JSON محدد جداً.
الملف ده مسؤول عن إنتاج **نفس الشكل بالحرف** من الداتابيز، عشان الواجهة
ما تحتاجش تتغيّر. `verify-parity.js` بيثبت ده بمقارنة عميقة مع `db.json` الأصلي.

قواعد مثبتة بالفحص:
- `unit.id` رقم للجرامر/الليسينينج، نص للريدينج (`"r1"`, `"rv1"`)
- الحقول الفاضية **تتحذف** مش تترجع `null`
- الليسينينج بيحط `type` جوه `page`، والريدينج على مستوى الوحدة

أي راوت أدمن بيكتب لازم ينادي `invalidateContentCache()` — الكاش في
الذاكرة عشان الاستعلام المتداخل ما يتنفذش على كل طلب.

---

## نموذج البيانات

**المبدأ**: الأسئلة مفصّلة (normalized) عشان التحليلات وبناء الامتحانات،
وبلوكات العرض المتغيّرة الشكل (`keywords` / `formulas` / `exception` /
`treeDiagram`) تفضل JSONB في `Strategy.blocks`.

أنواع الأسئلة (`Question.kind`):
- `mcq` — اختيار من متعدد (`opts` + `correctIndex`)
- `fill` — إكمال فراغ (`answers[]`)
- `order` — ترتيب كلمات (`tokens[]`)

الامتحانات (`ExamQuestion`) اختيار من متعدد بس، لأن `mock_exam.js`
بيفلتر بـ `isMCQ()`.

---

## حسابات الطلاب

الطالب بيسجّل بإيميل وكلمة مرور. حالته (XP، المستوى، السلسلة، الملاحظات،
التظليل، الوحدات المكتملة) بتتحفظ على السيرفر — بيلاقي تقدّمه على أي جهاز.

`public/js/sync.js` بيرفع التغييرات بتأخير ثانيتين، والكتابة المحلية
(`localStorage`) بتفضل زي ما هي عشان الواجهة تبقى فورية والموقع يشتغل
لو الشبكة وقعت.

طالب قديم عنده بيانات في `localStorage`؟ أول ما يسجّل حساب بتترحّل
تلقائياً مرة واحدة (`POST /api/student/migrate-local`).

---

## الأمان

- كلمات المرور بـ bcrypt (12 rounds)، الجلسة JWT في httpOnly cookie
- حقول المحتوى بتقبل HTML بسيط (`<strong>`, `<span dir="ltr">`) وبتتنضّف
  بـ `sanitize-html` عند الكتابة — لأنها بتتعرض بـ `innerHTML`
- حد على محاولات الدخول (10 محاولات / 15 دقيقة)
- كل مدخلات الكتابة بتتحقق بـ zod

---

## استكشاف الأخطاء

**`ECONNREFUSED` عند تشغيل السيرفر** — Postgres مش شغال:
```bash
docker compose up -d
docker exec ayed-academy-db pg_isready -U ayed -d ayed_academy
```

**`Unknown argument` من Prisma بعد تعديل الـ schema** — العميل محتاج توليد:
```bash
npm run db:generate
```

**لوحة التحكم بتقول "لم تُبنَ بعد"** — `npm run admin:build`

**الموقع شغال بس المحتوى قديم** — الكاش. أي كتابة من اللوحة بتبطّله؛
لو عدّلت الداتابيز مباشرة، أعد تشغيل السيرفر.
