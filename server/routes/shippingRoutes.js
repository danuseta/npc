const express = require('express');
const router = express.Router();
const shippingController = require('../controllers/shippingController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/rates', shippingController.getRates);

router.get('/track/:trackingNumber', shippingController.trackShipment);

router.use(protect);

module.exports = router;