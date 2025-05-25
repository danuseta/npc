const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { restrictTo } = require('../middlewares/roleMiddleware');

router.use(protect);

router.post('/', restrictTo('buyer', 'admin', 'superadmin'), paymentController.createPayment);
router.post('/midtrans', restrictTo('buyer', 'admin', 'superadmin'), paymentController.createMidtransPayment);
router.get('/order/:orderId', restrictTo('buyer', 'admin', 'superadmin'), paymentController.getPaymentByOrderId);
router.post('/midtrans/token', restrictTo('buyer', 'admin', 'superadmin'), paymentController.getSnapToken);

router.post('/callback', paymentController.processPaymentCallback);

router.get(
  '/', 
  authorize('admin', 'superadmin'), 
  paymentController.getAllPayments
);

router.put(
  '/:id/status', 
  authorize('admin', 'superadmin'), 
  paymentController.updatePaymentStatus
);

router.post(
  '/:id/refund', 
  authorize('admin', 'superadmin'), 
  paymentController.processRefund
);


module.exports = router;