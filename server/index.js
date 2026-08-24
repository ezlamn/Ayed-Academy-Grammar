/* ================================================================
   INDEX.JS — نقطة تشغيل السيرفر
   ================================================================ */
const env = require('./config/env');
const { createApp } = require('./app');
const { prisma, disconnect } = require('./db/prisma');

async function main() {
  // نتأكد إن الاتصال بالداتابيز شغال قبل ما نستقبل طلبات
  try {
    await prisma.$connect();
  } catch (err) {
    console.error('\n❌ فشل الاتصال بقاعدة البيانات.');
    console.error('   تأكد إن Postgres شغال:  docker compose up -d');
    console.error('   ثم:                      npm run db:migrate\n');
    console.error(err.message);
    process.exit(1);
  }

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    console.log(`\n✅ السيرفر شغال على http://localhost:${env.PORT}`);
    console.log(`   الموقع        → http://localhost:${env.PORT}/`);
    console.log(`   لوحة التحكم   → http://localhost:${env.PORT}/admin`);
    console.log(`   البيئة        → ${env.NODE_ENV}\n`);
  });

  const shutdown = async signal => {
    console.log(`\n${signal} — جاري الإغلاق...`);
    server.close(async () => {
      await disconnect();
      process.exit(0);
    });
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main();
