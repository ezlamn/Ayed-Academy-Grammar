/* ================================================================
   ADMIN/OVERVIEW.JS — أرقام الصفحة الرئيسية للوحة التحكم
   ================================================================ */
const express = require('express');
const { asyncHandler } = require('../../middleware/errorHandler');
const analytics = require('../../services/analyticsService');

const router = express.Router();

router.get('/', asyncHandler(async (req, res) => {
  res.json(await analytics.overview());
}));

module.exports = router;
