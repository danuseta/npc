const express = require('express');
const router = express.Router();
const carouselController = require('../controllers/carouselController');
const { protect } = require('../middlewares/authMiddleware');
const { restrictTo } = require('../middlewares/roleMiddleware');
const uploadMiddleware = require('../middlewares/uploadMiddleware');

router.get('/', carouselController.getAllSlides);

router.get('/:id', carouselController.getSlideById);

router.use(protect);
router.use(restrictTo('admin', 'superadmin'));

router.post('/', 
  uploadMiddleware.upload.single('image'), 
  carouselController.createSlide
);

router.put('/:id', 
  uploadMiddleware.upload.single('image'), 
  carouselController.updateSlide
);

router.delete('/:id', carouselController.deleteSlide);

router.post('/order', carouselController.updateOrder);

router.patch('/:id/toggle-active', carouselController.toggleActive);

module.exports = router;