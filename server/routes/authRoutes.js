const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const uploadMiddleware = require('../middlewares/uploadMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerification);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

router.get('/me', protect, authController.getCurrentUser);
router.put('/update-profile', protect, uploadMiddleware.profileImage, authController.updateProfile);
router.put('/change-password', protect, authController.changePassword);
router.delete('/delete-account', protect, authController.deleteAccount);

module.exports = router;