const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const productRoutes = require('./productRoutes');
const categoryRoutes = require('./categoryRoutes');
const cartRoutes = require('./cartRoutes');
const orderRoutes = require('./orderRoutes');
const paymentRoutes = require('./paymentRoutes');
const reviewRoutes = require('./reviewRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const superadminRoutes = require('./superadminRoutes');
const midtransRoutes = require('./midtransRoutes');
const regionRoutes = require('./regionRoutes');
const shippingRoutes = require('./shippingRoutes');
const storeInfoRoutes = require('./storeInfoRoutes');
const carouselRoutes = require('./carouselRoutes');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);
router.use('/reviews', reviewRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/superadmin', superadminRoutes);
router.use('/midtrans', midtransRoutes);
router.use('/', regionRoutes);
router.use('/shipping', shippingRoutes);
router.use('/store-info', storeInfoRoutes);
router.use('/carousel', carouselRoutes);

router.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

module.exports = router;