const express = require('express');
const router = express.Router();
const regionController = require('../controllers/regionController');

router.get('/region-test', (req, res) => {
  res.status(200).json({ message: 'Region routes are working!' });
});

router.get('/provinsi', regionController.getAllProvinces);
router.get('/kota/:kode_provinsi', regionController.getCitiesByProvince);

module.exports = router;