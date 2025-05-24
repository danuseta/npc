const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const uploadMiddleware = require('../middlewares/uploadMiddleware');

router.get('/product/:productId', reviewController.getProductReviews);

router.use(protect);
router.get('/my-product-reviews/:productId', reviewController.getUserProductReviews);
router.post(
  '/', 
  uploadMiddleware.productImages,
  reviewController.createReview
);

router.put(
  '/:id', 
  uploadMiddleware.productImages,
  reviewController.updateReview
);

router.delete('/:id', reviewController.deleteReview);

router.post('/:id/helpful', reviewController.markReviewHelpful);

router.post('/:id/report', reviewController.reportReview);

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