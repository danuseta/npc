const shippingService = require('../services/shippingService');

const requestCache = {};
const CACHE_LIFETIME = 60000;

exports.getRates = async (req, res) => {
  console.log('[CONTROLLER] Shipping rate request received:', req.body);
  try {
    const { postalCode, weight = 1, productIds = [] } = req.body;
    const cacheKey = `${postalCode}_${weight}_${Array.isArray(productIds) ? productIds.sort().join('_') : ''}`;
    
    if (requestCache[cacheKey] && requestCache[cacheKey].expires > Date.now()) {
      console.log(`[CONTROLLER] Using cached shipping rates for request: ${cacheKey}`);
      return res.status(200).json({
        success: true,
        data: requestCache[cacheKey].data,
        fromCache: true,
        source: 'cache'
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
    
    console.log('[CONTROLLER] Getting store origin postal code...');
    const originPostalCode = await shippingService.getStoreOriginPostalCode();
    console.log(`[CONTROLLER] Store origin: ${originPostalCode}`);
    
    console.log('[CONTROLLER] Calling Biteship API...');
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
    
    console.log(`[CONTROLLER] Successfully returned ${shippingOptions.length} shipping options`);
    res.status(200).json({
      success: true,
      data: shippingOptions,
      source: 'biteship_api',
      isUsingFallback: false
    });
    
  } catch (error) {
    console.error('[CONTROLLER] Error getting shipping rates:', error.message);
    
    const isBiteshipDown = error.message.includes('ECONNREFUSED') || 
                          error.message.includes('ENOTFOUND') ||
                          error.message.includes('timeout');
                          
    const isAuthError = error.message.includes('unauthorized') || 
                       error.message.includes('forbidden') ||
                       error.message.includes('401') ||
                       error.message.includes('403');
    
    if (isBiteshipDown) {
      console.warn('[CONTROLLER] Biteship API appears to be down, using fallback');
      const fallbackOptions = shippingService.getFallbackShippingOptions();
      return res.status(200).json({
        success: true,
        data: fallbackOptions,
        isUsingFallback: true,
        source: 'fallback_network_issue',
        error: 'Biteship API temporarily unavailable'
      });
    }
    
    if (isAuthError) {
      console.error('[CONTROLLER] Biteship API authentication failed');
      return res.status(500).json({
        success: false,
        message: 'Shipping service authentication failed. Please contact support.',
        error: 'Authentication error with shipping provider'
      });
    }
    
    console.error('[CONTROLLER] Unexpected shipping error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to calculate shipping rates. Please try again.',
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