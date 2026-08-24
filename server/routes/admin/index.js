/* ================================================================
   ADMIN/INDEX.JS — تجميع راوتات لوحة التحكم (كلها محمية بـ JWT)
   ================================================================ */
const express = require('express');
const { requireAdmin } = require('../../middleware/auth');

const router = express.Router();

// كل ما تحت /api/admin يتطلب أدمن مسجّل دخول
router.use(requireAdmin);

router.use('/units', require('./units'));
router.use('/strategies', require('./strategies'));
router.use('/questions', require('./questions'));
router.use('/videos', require('./videos'));
router.use('/vocab', require('./vocab'));
router.use('/media', require('./media'));
router.use('/exams', require('./exams'));
router.use('/students', require('./students'));
router.use('/config', require('./config'));
router.use('/analytics', require('./analytics'));
router.use('/overview', require('./overview'));

module.exports = router;
