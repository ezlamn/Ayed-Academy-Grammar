/* ================================================================
   ADMIN/ANALYTICS.JS — تحليلات الأداء
   ================================================================ */
const express = require('express');
const { z } = require('zod');

const { asyncHandler } = require('../../middleware/errorHandler');
const { validate } = require('../../middleware/validate');
const analytics = require('../../services/analyticsService');

const router = express.Router();

const limitQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(15),
  minAttempts: z.coerce.number().int().min(1).max(100).default(5),
});

router.get('/weakest-units', validate(limitQuery, 'query'), asyncHandler(async (req, res) => {
  const { limit, minAttempts } = req.validatedQuery;
  res.json(await analytics.weakestUnits(limit, minAttempts));
}));

router.get('/hardest-questions', validate(limitQuery, 'query'), asyncHandler(async (req, res) => {
  const { limit, minAttempts } = req.validatedQuery;
  res.json(await analytics.hardestQuestions(limit, minAttempts));
}));

router.get('/completion', asyncHandler(async (req, res) => {
  res.json(await analytics.completionFunnel());
}));

router.get('/exams', asyncHandler(async (req, res) => {
  res.json(await analytics.examPerformance());
}));

router.get('/activity',
  validate(z.object({ days: z.coerce.number().int().min(7).max(180).default(30) }), 'query'),
  asyncHandler(async (req, res) => {
    res.json(await analytics.activity(req.validatedQuery.days));
  }));

/** كل التحليلات مرة واحدة — عشان الصفحة تعمل طلب واحد بدل خمسة. */
router.get('/', asyncHandler(async (req, res) => {
  const [weakestUnits, hardestQuestions, completion, exams, activityRows] = await Promise.all([
    analytics.weakestUnits(15, 3),
    analytics.hardestQuestions(20, 3),
    analytics.completionFunnel(),
    analytics.examPerformance(),
    analytics.activity(30),
  ]);
  res.json({ weakestUnits, hardestQuestions, completion, exams, activity: activityRows });
}));

module.exports = router;
