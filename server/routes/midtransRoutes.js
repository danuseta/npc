const express = require('express');
const router = express.Router();
const midtransController = require('../controllers/midtransController');

router.post('/notification', midtransController.handleNotification);
router.post('/recurring-notification', midtransController.handleRecurringNotification);
router.post('/pay-account-notification', midtransController.handlePayAccountNotification);

router.get('/finish', midtransController.finishPayment);
router.get('/unfinish', midtransController.unfinishPayment);
router.get('/error', midtransController.errorPayment);

module.exports = router;