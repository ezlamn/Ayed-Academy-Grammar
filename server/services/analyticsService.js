/* ================================================================
   ANALYTICS-SERVICE.JS — استعلامات مجمّعة للتحليلات
   ----------------------------------------------------------------
   كلها SQL خام لأن التجميعات دي أوضح وأسرع من Prisma groupBy
   لما بتحتاج JOIN على أكتر من جدول.
   ================================================================ */
const { prisma } = require('../db/prisma');

/** أضعف الوحدات — أقل نسبة إجابات صحيحة. */
async function weakestUnits(limit = 15, minAttempts = 5) {
  return prisma.$queryRaw`
    SELECT u.id,
           u.track::text                              AS track,
           u."nameAr", u."nameEn",
           COUNT(a.id)::int                           AS answered,
           COUNT(a.id) FILTER (WHERE a."isCorrect")::int AS correct,
           ROUND(
             100.0 * COUNT(a.id) FILTER (WHERE a."isCorrect") / NULLIF(COUNT(a.id), 0)
           )::int                                     AS "accuracyPct"
    FROM "Unit" u
    JOIN "Question"        q ON q."unitId" = u.id
    JOIN "QuestionAttempt" a ON a."questionId" = q.id
    GROUP BY u.id, u.track, u."nameAr", u."nameEn"
    HAVING COUNT(a.id) >= ${minAttempts}
    ORDER BY "accuracyPct" ASC, answered DESC
    LIMIT ${limit}
  `;
}

/** أصعب الأسئلة — أعلى نسبة خطأ. */
async function hardestQuestions(limit = 20, minAttempts = 3) {
  return prisma.$queryRaw`
    SELECT q.id,
           LEFT(q.text, 160)                          AS text,
           q."unitId",
           u.track::text                              AS track,
           u."nameAr"                                 AS "unitNameAr",
           s.title                                    AS "strategyTitle",
           COUNT(a.id)::int                           AS answered,
           COUNT(a.id) FILTER (WHERE a."isCorrect")::int AS correct,
           ROUND(
             100.0 * COUNT(a.id) FILTER (WHERE a."isCorrect") / NULLIF(COUNT(a.id), 0)
           )::int                                     AS "accuracyPct"
    FROM "Question" q
    JOIN "Unit"            u ON u.id = q."unitId"
    LEFT JOIN "Strategy"   s ON s.id = q."strategyId"
    JOIN "QuestionAttempt" a ON a."questionId" = q.id
    GROUP BY q.id, q.text, q."unitId", u.track, u."nameAr", s.title
    HAVING COUNT(a.id) >= ${minAttempts}
    ORDER BY "accuracyPct" ASC, answered DESC
    LIMIT ${limit}
  `;
}

/** قمع الإكمال — كام طالب أكمل كل وحدة. */
async function completionFunnel() {
  return prisma.$queryRaw`
    SELECT u.id,
           u.track::text AS track,
           u."order",
           u."nameAr", u."nameEn",
           COUNT(p.id)::int AS "completedBy"
    FROM "Unit" u
    LEFT JOIN "UnitProgress" p ON p."unitId" = u.id
    WHERE u.published = true
    GROUP BY u.id, u.track, u."order", u."nameAr", u."nameEn"
    ORDER BY u.track, u."order"
  `;
}

/** متوسط درجات الامتحانات — إجمالاً ولكل نموذج. */
async function examPerformance() {
  const overall = await prisma.$queryRaw`
    SELECT COUNT(*)::int                                   AS attempts,
           ROUND(AVG(100.0 * score / NULLIF(total, 0)))::int AS "avgPct",
           MAX(ROUND(100.0 * score / NULLIF(total, 0)))::int AS "bestPct"
    FROM "ExamAttempt"
    WHERE "finishedAt" IS NOT NULL
  `;

  const byExam = await prisma.$queryRaw`
    SELECT COALESCE(e.title, 'امتحان عشوائي (' || COALESCE(a.preset, '—') || ')') AS title,
           a."examId",
           a.preset,
           COUNT(*)::int                                     AS attempts,
           ROUND(AVG(100.0 * a.score / NULLIF(a.total, 0)))::int AS "avgPct"
    FROM "ExamAttempt" a
    LEFT JOIN "Exam" e ON e.id = a."examId"
    WHERE a."finishedAt" IS NOT NULL
    GROUP BY e.title, a."examId", a.preset
    ORDER BY attempts DESC
  `;

  // متوسط كل قسم — sectionScores بشكل { listening: {correct, total}, ... }
  const bySection = await prisma.$queryRaw`
    SELECT sec.key                                             AS section,
           COUNT(*)::int                                       AS attempts,
           ROUND(AVG(
             100.0 * (sec.value->>'correct')::numeric
             / NULLIF((sec.value->>'total')::numeric, 0)
           ))::int                                             AS "avgPct"
    FROM "ExamAttempt" a,
         LATERAL jsonb_each(a."sectionScores") AS sec(key, value)
    WHERE a."finishedAt" IS NOT NULL
      AND (sec.value->>'total') IS NOT NULL
      AND (sec.value->>'total')::numeric > 0
    GROUP BY sec.key
    ORDER BY sec.key
  `;

  return { overall: overall[0] || { attempts: 0, avgPct: null, bestPct: null }, byExam, bySection };
}

/** النشاط اليومي آخر N يوم. */
async function activity(days = 30) {
  return prisma.$queryRaw`
    SELECT d::date                                        AS day,
           COUNT(DISTINCT a."studentId")::int             AS "activeStudents",
           COUNT(a.id)::int                               AS answers
    FROM generate_series(
           CURRENT_DATE - (${days}::int - 1) * INTERVAL '1 day',
           CURRENT_DATE,
           INTERVAL '1 day'
         ) AS d
    LEFT JOIN "QuestionAttempt" a ON a."answeredAt"::date = d::date
    GROUP BY d
    ORDER BY d
  `;
}

/** أرقام عامة للصفحة الرئيسية في لوحة التحكم. */
async function overview() {
  const [
    units, publishedUnits, strategies, questions, videos,
    exams, media, students, activeStudents, attempts, examAttempts,
  ] = await Promise.all([
    prisma.unit.count(),
    prisma.unit.count({ where: { published: true } }),
    prisma.strategy.count(),
    prisma.question.count(),
    prisma.video.count(),
    prisma.exam.count(),
    prisma.mediaAsset.count(),
    prisma.student.count(),
    prisma.student.count({
      where: { lastActiveAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    }),
    prisma.questionAttempt.count(),
    prisma.examAttempt.count({ where: { finishedAt: { not: null } } }),
  ]);

  const unitsByTrack = await prisma.unit.groupBy({
    by: ['track'],
    _count: { _all: true },
  });

  const recentStudents = await prisma.student.findMany({
    orderBy: { lastActiveAt: 'desc' },
    take: 8,
    select: {
      id: true, name: true, email: true, lastActiveAt: true,
      state: { select: { xp: true, level: true } },
    },
  });

  return {
    counts: {
      units, publishedUnits, strategies, questions, videos,
      exams, media, students, activeStudents, attempts, examAttempts,
    },
    unitsByTrack: Object.fromEntries(unitsByTrack.map(r => [r.track, r._count._all])),
    recentStudents,
  };
}

module.exports = {
  weakestUnits,
  hardestQuestions,
  completionFunnel,
  examPerformance,
  activity,
  overview,
};
