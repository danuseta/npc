const axios = require('axios');
const db = require('../models');
const env = require('../utils/env');

const BITESHIP_API_KEY = 'biteship_live.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiTlBDIFBST0QiLCJ1c2VySWQiOiI2N2Y5NmRkNTkwMWYyYzAwMTJjOTNiOWYiLCJpYXQiOjE3NDgxNDE5NjZ9.2nFcZ9xeUyuo0MI8Kqs5bKjFkP__44z1vWW9L5yrtVk';

const biteshipAPI = axios.create({
  baseURL: 'https://api.biteship.com/v1',
  headers: {
    'Authorization': `Bearer ${BITESHIP_API_KEY}`,
    'Content-Type': 'application/json'
  },
  timeout: 30000
});

const binderbyteAPI = axios.create({
  baseURL: 'http://api.binderbyte.com/v1',
  timeout: 10000
});

const pendingRequests = {};

biteshipAPI.interceptors.request.use(
  (config) => {
    console.log(`[BITESHIP] Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[BITESHIP] Request Error:', error.message);
    return Promise.reject(error);
  }
);

biteshipAPI.interceptors.response.use(
  (response) => {
    console.log(`[BITESHIP] Response: ${response.status} ${response.statusText}`);
    return response;
  },
  (error) => {
    console.error(`[BITESHIP] Response Error: ${error.response?.status} ${error.response?.statusText}`);
    console.error(`[BITESHIP] Error Data:`, error.response?.data);
    return Promise.reject(error);
  }
);

const parseDimensions = (dimensionsStr) => {
  if (!dimensionsStr) {
    return { length: 20, width: 20, height: 20 };
  }
  const formats = [
    /(\d+)[xX×](\d+)[xX×](\d+)/,
    /(\d+)\s*[xX×]\s*(\d+)\s*[xX×]\s*(\d+)/,
    /P:?\s*(\d+).*?L:?\s*(\d+).*?T:?\s*(\d+)/i,
    /(\d+)\s*cm.*?(\d+)\s*cm.*?(\d+)\s*cm/,
    /(\d+)\s*mm.*?(\d+)\s*mm.*?(\d+)\s*mm/
  ];
  for (const format of formats) {
    const match = dimensionsStr.match(format);
    if (match) {
      let length = parseInt(match[1], 10) || 20;
      let width = parseInt(match[2], 10) || 20;
      let height = parseInt(match[3], 10) || 20;
      if (format.toString().includes('mm')) {
        length = Math.ceil(length / 10);
        width = Math.ceil(width / 10);
        height = Math.ceil(height / 10);
      }
      return {
        length: length,
        width: width,
        height: height
      };
    }
  }
  return { length: 20, width: 20, height: 20 };
};

exports.getStoreOriginPostalCode = async () => {
  try {
    const settings = await db.SystemSettings.findOne({
      where: { id: 1 }
    });
    if (!settings || !settings.postalCode) {
      throw new Error('Store postal code not found in system settings');
    }
    return settings.postalCode;
  } catch (error) {
    throw error;
  }
};

exports.getStoreAddress = async () => {
  try {
    const settings = await db.SystemSettings.findOne({
      where: { id: 1 }
    });
    if (!settings) {
      throw new Error('Store information not found in system settings');
    }
    return {
      address: settings.address,
      city: settings.city,
      province: settings.province,
      postalCode: settings.postalCode,
      country: settings.country || 'Indonesia'
    };
  } catch (error) {
    throw error;
  }
};

exports.getProductDetailsForShipping = async (productIds) => {
  try {
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return [{
        name: "Package",
        description: "Standard shipping package",
        value: 10000,
        length: 10,
        width: 10,
        height: 5,
        weight: 1000,
        quantity: 1
      }];
    }
    const validProductIds = productIds
      .map(id => typeof id === 'string' ? parseInt(id, 10) : id)
      .filter(id => !isNaN(id) && id > 0);
    if (validProductIds.length === 0) {
      return [{
        name: "Package",
        description: "Standard shipping package",
        value: 10000,
        length: 10,
        width: 10,
        height: 5,
        weight: 1000,
        quantity: 1
      }];
    }
    const products = await db.Product.findAll({
      where: {
        id: validProductIds
      }
    });
    if (products.length === 0) {
      return [{
        name: "Package",
        description: "Standard shipping package",
        value: 10000,
        length: 10,
        width: 10,
        height: 5,
        weight: 1000,
        quantity: 1
      }];
    }
    const cartItems = await db.CartItem.findAll({
      where: {
        productId: validProductIds
      }
    });
    const productQuantities = {};
    cartItems.forEach(item => {
      if (productQuantities[item.productId]) {
        productQuantities[item.productId] += item.quantity;
      } else {
        productQuantities[item.productId] = item.quantity;
      }
    });
    const shippingItems = [];
    products.forEach(product => {
      const quantity = productQuantities[product.id] || 1;
      const dimensions = parseDimensions(product.dimensions);
      const productWeight = product.weight || 1;
      const weightInGrams = Math.max(productWeight, 0.1) * 1000;
      const productValue = product.price ? parseInt(product.price * 100) : 1000000;
      const shippingItem = {
        name: product.name || "Product",
        description: product.description || "General merchandise",
        value: productValue,
        length: dimensions.length,
        width: dimensions.width,
        height: dimensions.height,
        weight: weightInGrams,
        quantity: quantity
      };
      shippingItems.push(shippingItem);
    });
    if (shippingItems.length === 0) {
      return [{
        name: "Package",
        description: "Standard shipping package",
        value: 10000,
        length: 10,
        width: 10,
        height: 5,
        weight: 1000,
        quantity: 1
      }];
    }
    return shippingItems;
  } catch (error) {
    return [{
      name: "Package",
      description: "Standard shipping package",
      value: 10000,
      length: 10,
      width: 10,
      height: 5,
      weight: 1000,
      quantity: 1
    }];
  }
};

exports.calculateShippingRates = async (originPostalCode, destinationPostalCode, weight = 1, productIds = []) => {
  try {
    console.log(`[SHIPPING] Calculating rates: ${originPostalCode} → ${destinationPostalCode}, Weight: ${weight}kg`);
    
    const requestKey = `${originPostalCode}_${destinationPostalCode}_${weight}_${productIds.join('_')}`;
    if (pendingRequests[requestKey]) {
      console.log(`[SHIPPING] Using pending request for: ${requestKey}`);
      return await pendingRequests[requestKey];
    }
    
    pendingRequests[requestKey] = (async () => {
      try {
        const items = await exports.getProductDetailsForShipping(productIds);
        console.log(`[SHIPPING] Prepared ${items.length} items for shipping calculation`);
        
        const payload = {
          origin_postal_code: originPostalCode,
          destination_postal_code: destinationPostalCode,
          couriers: "jne,jnt,sicepat,pos,tiki",
          items: items
        };
        
        console.log(`[SHIPPING] Biteship API Request:`, JSON.stringify(payload, null, 2));
        
        const response = await biteshipAPI.post('/rates/couriers', payload);
        
        console.log(`[SHIPPING] Biteship API Response Status: ${response.status}`);
        console.log(`[SHIPPING] Response Data:`, JSON.stringify(response.data, null, 2));
        
        if (response.data && response.data.pricing && Array.isArray(response.data.pricing) && response.data.pricing.length > 0) {
          const shippingOptions = response.data.pricing.map(option => ({
            id: `${option.courier_code}_${option.courier_service_code}`.toLowerCase(),
            name: `${option.courier_name} - ${option.courier_service_name}`,
            price: option.price,
            estimatedDelivery: option.duration || `${option.shipment_duration_range} ${option.shipment_duration_unit || 'days'}`,
            courier: option.courier_code,
            service: option.courier_service_code
          }));
          
          console.log(`[SHIPPING] Successfully calculated ${shippingOptions.length} shipping options`);
          return shippingOptions;
        } else {
          console.warn(`[SHIPPING] Biteship API returned no pricing data:`, response.data);
          throw new Error('No shipping options available for this destination');
        }
      } catch (apiError) {
        console.error(`[SHIPPING] Biteship API Error:`, {
          message: apiError.message,
          status: apiError.response?.status,
          statusText: apiError.response?.statusText,
          data: apiError.response?.data,
          code: apiError.code
        });
        
        const errorMessage = apiError.response?.data?.message || apiError.message || 'Unknown Biteship API error';
        throw new Error(`Biteship API failed: ${errorMessage}`);
      } finally {
        delete pendingRequests[requestKey];
      }
    })();
    
    return await pendingRequests[requestKey];
  } catch (error) {
    console.error(`[SHIPPING] Final Error in calculateShippingRates:`, error.message);
    throw error;
  }
};

exports.getFallbackShippingOptions = () => {
  return [
    {
      id: 'jne_reg',
      name: 'JNE - Regular Service',
      price: 50000,
      estimatedDelivery: '3-5 days',
      courier: 'JNE',
      service: 'REG'
    },
    {
      id: 'jnt_reg',
      name: 'J&T Express',
      price: 45000,
      estimatedDelivery: '2-3 days',
      courier: 'J&T',
      service: 'REG'
    },
    {
      id: 'sicepat_standard',
      name: 'SiCepat Express',
      price: 60000,
      estimatedDelivery: '1-2 days',
      courier: 'SICEPAT',
      service: 'STANDARD'
    }
  ];
};

exports.trackShipment = async (trackingNumber) => {
  try {
    const response = await biteshipAPI.get(`/trackings/${trackingNumber}`);
    if (response.data && response.data.success) {
      return {
        trackingNumber,
        courier: response.data.courier || "Unknown",
        service: response.data.service || "Standard",
        status: response.data.status || "In Progress",
        origin: response.data.origin || "Processing Center",
        destination: response.data.destination || "Customer Address",
        estimatedDelivery: response.data.estimated_delivery || null,
        manifest: response.data.manifest || response.data.history || []
      };
    } else {
      throw new Error('Invalid response from Biteship API');
    }
  } catch (error) {
    return {
      trackingNumber,
      courier: "Unknown",
      service: "Standard",
      status: "In Progress",
      origin: "Processing Center",
      destination: "Customer Address",
      manifest: [
        {
          status: "Processed",
          description: "Package has been processed",
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          location: "Sorting Center"
        },
        {
          status: "In Transit",
          description: "Package is in transit to destination",
          timestamp: new Date().toISOString(),
          location: "Distribution Center"
        }
      ]
    };
  }
};

exports.trackShipmentBinderbyte = async (trackingNumber, courier) => {
  try {
    console.log(`Tracking with Binderbyte: ${trackingNumber}, Courier: ${courier}`);
    
    const courierMap = {
      'jne': 'jne',
      'jnt': 'jnt', 
      'j&t': 'jnt',
      'sicepat': 'sicepat',
      'pos': 'pos',
      'tiki': 'tiki',
      'anteraja': 'anteraja',
      'wahana': 'wahana',
      'ninja': 'ninja',
      'lion': 'lion'
    };
    
    const binderbyteCarrier = courierMap[courier.toLowerCase()] || courier.toLowerCase();
    
    const response = await binderbyteAPI.get('/track', {
      params: {
        api_key: env.binderbyte.apiKey,
        courier: binderbyteCarrier,
        awb: trackingNumber
      }
    });
    
    console.log('Binderbyte response:', response.data);
    
    if (response.data && response.data.status === 200) {
      const data = response.data.data;
      
      const transformedData = {
        trackingNumber: data.summary?.awb || trackingNumber,
        courier: data.summary?.courier || courier.toUpperCase(),
        service: data.summary?.service || 'Standard',
        status: data.summary?.status || 'In Transit',
        origin: data.detail?.origin || 'Origin',
        destination: data.detail?.destination || 'Destination',
        shipper: data.detail?.shipper || '',
        receiver: data.detail?.receiver || '',
        estimatedDelivery: null,
        manifest: data.history ? data.history.map(item => ({
          date: item.date || new Date().toISOString(),
          desc: item.desc || 'Status update',
          location: item.location || 'Unknown',
          status: item.desc || 'Status update',
          description: item.desc || 'Status update',
          timestamp: item.date || new Date().toISOString()
        })) : [],
        summary: data.summary,
        detail: data.detail,
        history: data.history
      };
      
      const isDelivered = data.summary?.status && (
        data.summary.status.toLowerCase().includes('delivered') ||
        data.summary.status.toLowerCase().includes('terkirim') ||
        data.summary.status.toLowerCase().includes('diterima')
      );
      
      if (isDelivered) {
        try {
          await exports.autoUpdateOrderStatusToDelivered(trackingNumber);
        } catch (updateError) {
          console.error('Failed to auto-update order status:', updateError.message);
        }
      }
      
      return {
        status: 200,
        data: transformedData
      };
    } else {
      throw new Error(`Binderbyte API returned status: ${response.data?.status || 'unknown'}, message: ${response.data?.message || 'No message'}`);
    }
  } catch (error) {
    console.error('Binderbyte tracking error:', error.message);
    
    throw new Error(`Binderbyte tracking failed: ${error.message}`);
  }
};

exports.autoUpdateOrderStatusToDelivered = async (trackingNumber) => {
  try {
    const order = await db.Order.findOne({
      where: { trackingNumber: trackingNumber }
    });
    
    if (!order) {
      console.log(`No order found with tracking number: ${trackingNumber}`);
      return;
    }
    
    if (order.status === 'delivered' || order.status === 'completed') {
      console.log(`Order ${order.id} already has delivered/completed status`);
      return;
    }
    
    await order.update({
      status: 'delivered',
      paymentStatus: 'paid',
      updatedAt: new Date()
    });
    
    console.log(`Order ${order.id} status auto-updated to delivered based on tracking`);
    
    return {
      success: true,    
      orderId: order.id,
      previousStatus: order.status,
      newStatus: 'delivered'
    };
    
  } catch (error) {
    console.error('Error auto-updating order status:', error);
    throw error;
  }
};