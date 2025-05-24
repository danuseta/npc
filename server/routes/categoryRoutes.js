const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const uploadMiddleware = require('../middlewares/uploadMiddleware');

router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategoryById);
router.get('/slug/:slug', categoryController.getCategoryBySlug);
router.get('/parent/:parentId', categoryController.getSubcategories);

router.post(
  '/', 
  protect, 
  authorize('admin', 'superadmin'), 
  uploadMiddleware.productImages,
  categoryController.createCategory
);

router.put(
  '/:id', 
  protect, 
  authorize('admin', 'superadmin'), 
  uploadMiddleware.productImages, 
  categoryController.updateCategory
);

router.delete(
  '/:id', 
  protect, 
  authorize('admin', 'superadmin'), 
  categoryController.deleteCategory
);

module.exports = router;