const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { protect } = require('../middlewares/authMiddleware');
const { restrictTo } = require('../middlewares/roleMiddleware');

router.use(protect);
router.use(restrictTo('buyer'));

router.get('/', cartController.getCart);

router.post('/items', cartController.addItemToCart);

router.put('/items/:itemId', cartController.updateCartItem);

router.delete('/items/:itemId', cartController.removeCartItem);

router.delete('/', cartController.clearCart);

// router.post('/apply-coupon', cartController.applyCoupon);

module.exports = router;