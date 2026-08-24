/* ================================================================
   AUTH.JS — JWT في httpOnly cookie + حرّاس الصلاحيات
   ================================================================ */
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { prisma } = require('../db/prisma');
const { HttpError, asyncHandler } = require('./errorHandler');

const ADMIN_COOKIE = 'ayed_admin';
const STUDENT_COOKIE = 'ayed_student';

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.isProduction,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 أيام
  };
}

function signToken(payload) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

function setAuthCookie(res, role, id) {
  const name = role === 'admin' ? ADMIN_COOKIE : STUDENT_COOKIE;
  res.cookie(name, signToken({ id, role }), cookieOptions());
}

function clearAuthCookie(res, role) {
  const name = role === 'admin' ? ADMIN_COOKIE : STUDENT_COOKIE;
  res.clearCookie(name, { ...cookieOptions(), maxAge: undefined });
}

/** يقرأ التوكن من الكوكي، وكـ fallback من ترويسة Authorization. */
function readToken(req, cookieName) {
  if (req.cookies && req.cookies[cookieName]) return req.cookies[cookieName];
  const header = req.get('authorization');
  if (header && header.startsWith('Bearer ')) return header.slice(7);
  return null;
}

function verify(token, expectedRole) {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    if (payload.role !== expectedRole) return null;
    return payload;
  } catch {
    return null;
  }
}

// ── حرّاس ──────────────────────────────────────────────────────

const requireAdmin = asyncHandler(async (req, res, next) => {
  const token = readToken(req, ADMIN_COOKIE);
  const payload = token && verify(token, 'admin');
  if (!payload) throw new HttpError(401, 'يلزم تسجيل دخول الأدمن');

  const admin = await prisma.admin.findUnique({
    where: { id: payload.id },
    select: { id: true, email: true, name: true },
  });
  if (!admin) throw new HttpError(401, 'حساب الأدمن غير موجود');

  req.admin = admin;
  next();
});

const requireStudent = asyncHandler(async (req, res, next) => {
  const token = readToken(req, STUDENT_COOKIE);
  const payload = token && verify(token, 'student');
  if (!payload) throw new HttpError(401, 'يلزم تسجيل الدخول');

  const student = await prisma.student.findUnique({
    where: { id: payload.id },
    select: { id: true, email: true, name: true, active: true },
  });
  if (!student) throw new HttpError(401, 'الحساب غير موجود');
  if (!student.active) throw new HttpError(403, 'الحساب موقوف');

  req.student = student;
  next();
});

/** يقرأ الطالب لو مسجّل دخول، من غير ما يمنع الطلب لو مش مسجّل. */
const optionalStudent = asyncHandler(async (req, res, next) => {
  const token = readToken(req, STUDENT_COOKIE);
  const payload = token && verify(token, 'student');
  if (payload) {
    req.student = await prisma.student.findUnique({
      where: { id: payload.id },
      select: { id: true, email: true, name: true, active: true },
    });
  }
  next();
});

module.exports = {
  ADMIN_COOKIE,
  STUDENT_COOKIE,
  signToken,
  setAuthCookie,
  clearAuthCookie,
  requireAdmin,
  requireStudent,
  optionalStudent,
};
