/* ================================================================
   PRISMA.JS — PrismaClient singleton
   ================================================================ */
const { PrismaClient } = require('@prisma/client');
const env = require('../config/env');

const prisma = new PrismaClient({
  log: env.isProduction ? ['warn', 'error'] : ['warn', 'error'],
});

async function disconnect() {
  await prisma.$disconnect();
}

module.exports = { prisma, disconnect };
