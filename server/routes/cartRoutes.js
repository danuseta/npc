const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/', cartController.getCart);

router.post('/items', cartController.addItemToCart);

router.put('/items/:itemId', cartController.updateCartItem);

router.delete('/items/:itemId', cartController.removeCartItem);

router.delete('/', cartController.clearCart);

// router.post('/apply-coupon', cartController.applyCoupon);

module.exports = router;