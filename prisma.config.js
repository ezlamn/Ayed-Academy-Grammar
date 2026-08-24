/* ================================================================
   PRISMA.CONFIG.JS — إعداد Prisma CLI
   ----------------------------------------------------------------
   من Prisma 7، رابط الاتصال بقى هنا مش في schema.prisma.
   الملف ده بيستخدمه الـ CLI (migrate / studio) بس — التطبيق نفسه
   بيوصل للداتابيز عن طريق الـ adapter في server/db/prisma.js.
   ================================================================ */
const path = require('node:path');
const { defineConfig } = require('@prisma/config');

require('dotenv').config({ path: path.join(__dirname, '.env') });

module.exports = defineConfig({
  schema: path.join(__dirname, 'prisma', 'schema.prisma'),
  migrations: {
    path: path.join(__dirname, 'prisma', 'migrations'),
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
