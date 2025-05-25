const express = require('express');
const router = express.Router();
const shippingController = require('../controllers/shippingController');
const { protect } = require('../middlewares/authMiddleware');
const { restrictTo } = require('../middlewares/roleMiddleware');

router.use(protect);
router.use(restrictTo('buyer'));

router.post('/rates', shippingController.getRates);

router.get('/track/:trackingNumber', shippingController.trackShipment);

module.exports = router;