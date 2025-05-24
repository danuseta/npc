const express = require('express');
const router = express.Router();
const superadminController = require('../controllers/superadminController');
const systemSettingsController = require('../controllers/systemSettingsController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect);
router.use(authorize('superadmin'));

router.get('/admins', superadminController.getAdmins);
router.get('/admins/:id', superadminController.getAdminById);
router.post('/admins', superadminController.createAdmin);
router.put('/admins/:id', superadminController.updateAdmin);
router.delete('/admins/:id', superadminController.deleteAdmin);
router.put('/admins/:id/status', superadminController.updateAdminStatus);
router.get('/admins/:id/activities', superadminController.getAdminActivities);

router.get('/dashboard/top-admins', superadminController.getTopAdmins);
router.get('/dashboard/summary', superadminController.getDashboardSummary);
router.get('/dashboard/sales', superadminController.getSalesData);

router.get('/settings', systemSettingsController.getSystemSettings);
router.put('/settings', systemSettingsController.updateSystemSettings);
router.get('/logs', systemSettingsController.getSystemLogs);
router.delete('/logs', systemSettingsController.clearSystemLogs);
router.post('/backup', systemSettingsController.createSystemBackup);
router.post('/cache/clear', systemSettingsController.clearSystemCache);

module.exports = router;