const { SystemSettings } = require('../models');

exports.getStoreInfo = async (req, res) => {
  try {
    const storeSettings = await SystemSettings.findOne();
    const defaultStoreInfo = {
      storeName: 'NPC Nusantara Computer',
      address: 'Jl. Raya Kuta No. 123',
      city: 'Denpasar',
      province: 'Bali',
      postalCode: '80361',
      country: 'Indonesia'
    };
    res.status(200).json({
      success: true,
      data: storeSettings || defaultStoreInfo
    });
  } catch (error) {
    console.error('Error fetching store information:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching store information',
      error: error.message
    });
  }
};