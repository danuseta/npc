const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect);
router.use(authorize('admin', 'superadmin'));

router.get('/summary', dashboardController.getDashboardSummary);
router.get('/sales', dashboardController.getSalesData);

module.exports = router;