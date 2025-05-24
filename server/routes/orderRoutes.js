const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect);

router.get(
  '/stats', 
  authorize('admin', 'superadmin'), 
  orderController.getOrderStats
);

router.put('/:id/update-payment', orderController.updateOrderStatusAfterPayment);

router.get(
  '/recent', 
  authorize('admin', 'superadmin'), 
  orderController.getRecentOrders
);

router.get(
  '/sales', 
  authorize('admin', 'superadmin'), 
  orderController.getSalesData
);

router.get(
  '/history', 
  authorize('admin', 'superadmin'), 
  orderController.getOrderHistory
);

router.post('/fallback', orderController.createFallbackOrder);

router.get('/by-number/:orderNumber', orderController.getOrderByNumber);

router.post('/', orderController.createOrder);
router.get('/my-orders', orderController.getMyOrders);
router.get('/my-orders/:id', orderController.getMyOrderById);
router.post('/:id/cancel', orderController.cancelOrder);

router.get(
  '/', 
  authorize('admin', 'superadmin'), 
  orderController.getAllOrders
);

router.get(
  '/:id', 
  authorize('admin', 'superadmin'), 
  orderController.getOrderById
);

router.put(
  '/:id/status', 
  authorize('admin', 'superadmin'), 
  orderController.updateOrderStatus
);

router.put(
  '/:id/payment-status', 
  authorize('admin', 'superadmin'), 
  orderController.updatePaymentStatus
);

router.put(
  '/:id/tracking', 
  authorize('admin', 'superadmin'), 
  orderController.updateTrackingInfo
);

router.put('/:id/update-status', orderController.updateOrderStatusAfterPayment);

module.exports = router;