# 📚 أكاديمية عايد — كتاب STEP التفاعلي الشامل

منصة تعليمية تفاعلية لتعليم قواعد اللغة الإنجليزية (Grammar Strategies)، مبنية بـ Node.js + Express مع واجهة مستخدم متكاملة.

---

## 🚀 تشغيل المشروع (Quick Start)

### المتطلبات
- [Node.js](https://nodejs.org/) v18 أو أحدث

### خطوات التشغيل

```bash
# 1. استنساخ المشروع
git clone https://github.com/ezlamn/Ayed-Academy-Grammar.git
cd Ayed-Academy-Grammar

# 2. تثبيت الاعتماديات
npm install

# 3. تشغيل السيرفر
npm start
```

ثم افتح المتصفح على: **http://localhost:3000**

---

## 🗂️ هيكل المشروع

```
Ayed-Academy-Grammar/
├── server.js             # السيرفر الرئيسي (Express)
├── package.json          # الاعتماديات والسكريبتات
├── index.html            # الصفحة الرئيسية
├── data/
│   └── db.json           # قاعدة البيانات (تُنشأ تلقائياً عند التشغيل)
├── uploads/              # ملفات الصوت والصور (تُنشأ تلقائياً)
├── public/
│   ├── admin.html        # لوحة تحكم الأدمن
│   ├── app.js            # المنطق الرئيسي للتطبيق
│   ├── style.css         # الستايل الرئيسي
│   ├── firebase-config.js # نظام المصادقة المحلي (بدون Firebase)
│   ├── js/               # ملفات JavaScript المساعدة
│   │   ├── auth.js
│   │   ├── renderers.js
│   │   ├── icons.js
│   │   ├── state.js
│   │   └── tree-diagram.js
│   ├── css/              # ملفات CSS المساعدة
│   └── assets/           # صور وأصول ثابتة
└── scripts/              # سكريبتات الصيانة والبناء
```

---

## 🔗 الروابط المهمة

| الرابط | الوصف |
|--------|-------|
| http://localhost:3000 | الواجهة الرئيسية للطالب |
| http://localhost:3000/public/admin.html | لوحة تحكم الأدمن |

---

## 🛠️ API Endpoints

| Method | Endpoint | الوصف |
|--------|----------|-------|
| GET | `/api/units` | جلب كل الوحدات |
| POST | `/api/units` | حفظ/تحديث الوحدات |
| POST | `/api/upload` | رفع ملف صوتي أو صورة |
| GET | `/data/db.json` | قراءة قاعدة البيانات |

---

## 📝 ملاحظات

- **قاعدة البيانات** (`data/db.json`) تُنشأ تلقائياً عند أول تشغيل — لا تحتاج لأي إعداد.
- **المصادقة** تعمل محلياً بدون Firebase أو أي مفاتيح API خارجية.
- **مجلد uploads/** يُنشأ تلقائياً ومفيش ملفات فيه مرفوعة في الـ repo.
- المشروع يعمل **أوفلاين** بالكامل — لا يحتاج إنترنت.

---

## 👨‍💻 التطوير

```bash
# تشغيل في وضع التطوير (نفس الأمر)
npm run dev
```

---

## 📄 الترخيص

هذا المشروع خاص بأكاديمية عايد © 2026
