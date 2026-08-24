/* ================================================================
   PRISMA.JS — PrismaClient singleton
   ----------------------------------------------------------------
   Prisma 7 بيتطلب driver adapter للاتصال المباشر بالداتابيز
   بدل ما الرابط يتقرأ من schema.prisma.
   ================================================================ */
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const env = require('../config/env');

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

const prisma = new PrismaClient({
  adapter,
  log: ['warn', 'error'],
});

async function disconnect() {
  await prisma.$disconnect();
}

module.exports = { prisma, disconnect };
