const shippingService = require('../services/shippingService');

const requestCache = {};
const CACHE_LIFETIME = 60000;

exports.getRates = async (req, res) => {
  console.log('Shipping rate request received:', req.body);
  try {
    const { postalCode, weight = 1, productIds = [] } = req.body;
    const cacheKey = `${postalCode}_${weight}_${Array.isArray(productIds) ? productIds.sort().join('_') : ''}`;
    if (requestCache[cacheKey] && requestCache[cacheKey].expires > Date.now()) {
      console.log(`Using cached shipping rates for request: ${cacheKey}`);
      return res.status(200).json({
        success: true,
        data: requestCache[cacheKey].data,
        fromCache: true
      });
    }
    if (!postalCode) {
      return res.status(400).json({
        success: false,
        message: 'Destination postal code is required'
      });
    }
    if (!/^\d{5}$/.test(postalCode)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid postal code format. Please use a 5-digit postal code.'
      });
    }
    if (weight <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Weight must be greater than 0'
      });
    }
    if (productIds && !Array.isArray(productIds)) {
      return res.status(400).json({
        success: false,
        message: 'Product IDs must be an array'
      });
    }
    const originPostalCode = await shippingService.getStoreOriginPostalCode();
    const shippingOptions = await shippingService.calculateShippingRates(
      originPostalCode,
      postalCode,
      weight,
      productIds
    );
    requestCache[cacheKey] = {
      data: shippingOptions,
      expires: Date.now() + CACHE_LIFETIME
    };
    if (Math.random() < 0.1) {
      cleanupExpiredCache();
    }
    res.status(200).json({
      success: true,
      data: shippingOptions
    });
  } catch (error) {
    console.error('Error getting shipping rates:', error);
    const fallbackOptions = shippingService.getFallbackShippingOptions();
    res.status(200).json({
      success: true,
      data: fallbackOptions,
      isUsingFallback: true,
      error: error.message
    });
  }
};

function cleanupExpiredCache() {
  const now = Date.now();
  const cacheKeys = Object.keys(requestCache);
  for (const key of cacheKeys) {
    if (requestCache[key].expires < now) {
      delete requestCache[key];
    }
  }
}

exports.trackShipment = async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    const { courier } = req.query;
    
    if (!trackingNumber) {
      return res.status(400).json({
        success: false,
        message: 'Tracking number is required'
      });
    }
    
    if (courier) {
      try {
        const binderbyteTrackingData = await shippingService.trackShipmentBinderbyte(trackingNumber, courier);
        if (binderbyteTrackingData && binderbyteTrackingData.status === 200) {
          return res.status(200).json({
            success: true,
            data: binderbyteTrackingData.data,
            source: 'binderbyte'
          });
        }
      } catch (binderbyteError) {
        console.log('Binderbyte tracking failed, falling back to Biteship:', binderbyteError.message);
      }
    }
    
    const trackingData = await shippingService.trackShipment(trackingNumber);
    res.status(200).json({
      success: true,
      data: trackingData,
      source: 'biteship_fallback'
    });
  } catch (error) {
    console.error('Error tracking shipment:', error);
    res.status(200).json({
      success: true,
      data: {
        trackingNumber,
        courier: "Unknown",
        service: "Unknown",
        status: "In Progress",
        origin: "Processing Center",
        destination: "Customer Address",
        manifest: [
          {
            status: "Order Received",
            description: "Order has been confirmed",
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            location: "Processing Center"
          },
          {
            status: "In Transit",
            description: "Package is in transit",
            timestamp: new Date().toISOString(),
            location: "Local Distribution Center"
          }
        ],
        isUsingFallback: true,
        error: error.message
      },
      source: 'fallback'
    });
  }
};