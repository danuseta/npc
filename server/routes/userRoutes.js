const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { restrictTo } = require('../middlewares/roleMiddleware');
const uploadMiddleware = require('../middlewares/uploadMiddleware');

router.use(protect);

router.get('/:id', restrictTo('buyer', 'admin', 'superadmin'), userController.getUserById);
router.put('/profile', restrictTo('buyer', 'admin', 'superadmin'), uploadMiddleware.profileImage, userController.updateProfile);
router.put('/address', restrictTo('buyer', 'admin', 'superadmin'), userController.updateAddress);
router.put('/:id', restrictTo('buyer', 'admin', 'superadmin'), userController.updateUserGeneral);

router.get('/', authorize('admin', 'superadmin'), userController.getAllUsers);
router.get('/stats', authorize('admin', 'superadmin'), userController.getUserStats);

router.put(
  '/:id/status', 
  authorize('admin', 'superadmin'), 
  userController.updateUserStatus
);

router.put(
  '/:id/role', 
  authorize('superadmin'), 
  userController.updateUserRole
);

router.delete(
  '/:id', 
  authorize('superadmin'), 
  userController.deleteUser
);

router.put('/:id', userController.updateUserGeneral);

module.exports = router;