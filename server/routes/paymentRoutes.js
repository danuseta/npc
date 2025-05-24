const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect);

router.post('/', paymentController.createPayment);

router.post('/midtrans', paymentController.createMidtransPayment);

router.post('/callback', paymentController.processPaymentCallback);

router.get('/order/:orderId', paymentController.getPaymentByOrderId);

router.post('/midtrans/token', paymentController.getSnapToken);

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