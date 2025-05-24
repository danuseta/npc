const express = require('express');
const router = express.Router();
const storeInfoController = require('../controllers/storeInfoController');

router.get('/', storeInfoController.getStoreInfo);

module.exports = router;