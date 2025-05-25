const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { restrictTo } = require('../middlewares/roleMiddleware');

router.use(protect);

router.post('/', restrictTo('buyer', 'admin', 'superadmin'), orderController.createOrder);
router.get('/my-orders', restrictTo('buyer', 'admin', 'superadmin'), orderController.getMyOrders);
router.get('/my-orders/:id', restrictTo('buyer', 'admin', 'superadmin'), orderController.getMyOrderById);
router.post('/:id/cancel', restrictTo('buyer', 'admin', 'superadmin'), orderController.cancelOrder);
router.get('/by-number/:orderNumber', restrictTo('buyer', 'admin', 'superadmin'), orderController.getOrderByNumber);

router.post('/fallback', orderController.createFallbackOrder);
router.put('/:id/update-payment', orderController.updateOrderStatusAfterPayment);
router.put('/:id/update-status', orderController.updateOrderStatusAfterPayment);

router.get('/stats', authorize('admin', 'superadmin'), orderController.getOrderStats);
router.get('/recent', authorize('admin', 'superadmin'), orderController.getRecentOrders);
router.get('/sales', authorize('admin', 'superadmin'), orderController.getSalesData);
router.get('/history', authorize('admin', 'superadmin'), orderController.getOrderHistory);
router.get('/', authorize('admin', 'superadmin'), orderController.getAllOrders);
router.get('/:id', authorize('admin', 'superadmin'), orderController.getOrderById);
router.put('/:id/status', authorize('admin', 'superadmin'), orderController.updateOrderStatus);
router.put('/:id/payment-status', authorize('admin', 'superadmin'), orderController.updatePaymentStatus);
router.put('/:id/tracking', authorize('admin', 'superadmin'), orderController.updateTrackingInfo);

module.exports = router;