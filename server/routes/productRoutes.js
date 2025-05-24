const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const uploadMiddleware = require('../middlewares/uploadMiddleware');

router.get('/', productController.getAllProducts);
router.get('/popular', productController.getPopularProducts);
router.get('/featured', productController.getFeaturedProducts);
router.get('/search', productController.searchProducts);
router.get('/category/:categoryId', productController.getProductsByCategory);

router.get('/stats', protect, authorize('admin', 'superadmin'), productController.getProductStats);
router.get('/top', protect, authorize('admin', 'superadmin'), productController.getTopProducts);

router.get('/:id', productController.getProductById);

router.post(
  '/', 
  protect, 
  authorize('admin', 'superadmin'), 
  uploadMiddleware.productImagesEnhanced,
  productController.createProduct
);

router.put(
  '/:id', 
  protect, 
  authorize('admin', 'superadmin'), 
  uploadMiddleware.productImagesEnhanced,
  productController.updateProduct
);

router.delete(
  '/:id', 
  protect, 
  authorize('admin', 'superadmin'), 
  productController.deleteProduct
);

module.exports = router;