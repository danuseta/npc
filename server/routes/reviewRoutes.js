const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { restrictTo } = require('../middlewares/roleMiddleware');
const uploadMiddleware = require('../middlewares/uploadMiddleware');

router.get('/product/:productId', reviewController.getProductReviews);

router.use(protect);

router.get('/my-product-reviews/:productId', restrictTo('buyer', 'admin', 'superadmin'), reviewController.getUserProductReviews);
router.post('/', restrictTo('buyer', 'admin', 'superadmin'), uploadMiddleware.productImages, reviewController.createReview);
router.put('/:id', restrictTo('buyer', 'admin', 'superadmin'), uploadMiddleware.productImages, reviewController.updateReview);
router.delete('/:id', restrictTo('buyer', 'admin', 'superadmin'), reviewController.deleteReview);
router.post('/:id/helpful', restrictTo('buyer', 'admin', 'superadmin'), reviewController.markReviewHelpful);
router.post('/:id/report', restrictTo('buyer', 'admin', 'superadmin'), reviewController.reportReview);

router.get(
  '/', 
  authorize('admin', 'superadmin'), 
  reviewController.getAllReviews
);

router.put(
  '/:id/status', 
  authorize('admin', 'superadmin'), 
  reviewController.updateReviewStatus
);

router.post(
  '/:id/respond', 
  authorize('admin', 'superadmin'), 
  reviewController.respondToReview
);

module.exports = router;