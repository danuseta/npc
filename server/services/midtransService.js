const midtransClient = require('midtrans-client');
const env = require('../utils/env');

const snap = new midtransClient.Snap({
  isProduction: env.midtrans.isProduction,
  serverKey: env.midtrans.serverKey,
  clientKey: env.midtrans.clientKey
});

const core = new midtransClient.CoreApi({
  isProduction: env.midtrans.isProduction,
  serverKey: env.midtrans.serverKey,
  clientKey: env.midtrans.clientKey
});

const baseUrl = process.env.NODE_ENV === 'development' 
  ? process.env.NGROK_URL || env.frontendUrl
  : env.frontendUrl;

const urls = {
  finish: `${baseUrl}/payment/finish`,
  unfinish: `${baseUrl}/payment/unfinish`,
  error: `${baseUrl}/payment/error`
};

const createTransaction = async (order, orderItems, customer) => {
  try {
    const items = orderItems.map(item => ({
      id: String(item.productId),
      price: parseInt(item.price),
      quantity: item.quantity,
      name: item.productName || item.name
    }));
    if (order.shippingFee > 0) {
      items.push({
        id: 'SHIPPING-FEE',
        price: parseInt(order.shippingFee),
        quantity: 1,
        name: 'Shipping Fee'
      });
    }
    const transaction = {
      transaction_details: {
        order_id: order.orderNumber,
        gross_amount: parseInt(order.grandTotal)
      },
      item_details: items,
      customer_details: {
        first_name: customer.fullName ? customer.fullName.split(' ')[0] : 'Customer',
        last_name: customer.fullName ? customer.fullName.split(' ').slice(1).join(' ') : '',
        email: customer.email,
        phone: customer.phoneNumber,
        billing_address: {
          first_name: customer.fullName ? customer.fullName.split(' ')[0] : 'Customer',
          last_name: customer.fullName ? customer.fullName.split(' ').slice(1).join(' ') : '',
          phone: customer.phoneNumber,
          address: customer.address,
          city: customer.city,
          postal_code: customer.postalCode,
          country_code: 'IDN'
        },
        shipping_address: {
          first_name: customer.fullName ? customer.fullName.split(' ')[0] : 'Customer',
          last_name: customer.fullName ? customer.fullName.split(' ').slice(1).join(' ') : '',
          phone: customer.phoneNumber,
          address: customer.address,
          city: customer.city,
          postal_code: customer.postalCode,
          country_code: 'IDN'
        }
      },
      callbacks: {
        finish: urls.finish,
        unfinish: urls.unfinish,
        error: urls.error
      }
    };
    console.log('Creating Midtrans transaction:', transaction);
    const response = await snap.createTransaction(transaction);
    console.log('Midtrans transaction created:', response);
    return response;
  } catch (error) {
    console.error('Error creating Midtrans transaction:', error);
    throw error;
  }
};

const handleNotification = async (notification) => {
  try {
    let statusResponse;
    try {
      statusResponse = await snap.transaction.notification(notification);
    } catch (error) {
      console.error('Error from Midtrans notification API:', error);
      statusResponse = {
        order_id: notification.order_id,
        transaction_status: notification.transaction_status,
        fraud_status: notification.fraud_status,
        payment_type: notification.payment_type
      };
    }
    const orderId = statusResponse.order_id || notification.order_id;
    const transactionStatus = statusResponse.transaction_status || notification.transaction_status;
    const fraudStatus = statusResponse.fraud_status || notification.fraud_status;
    const paymentType = statusResponse.payment_type || notification.payment_type;
    console.log(`Transaction notification received. Order ID: ${orderId}. Transaction status: ${transactionStatus}. Fraud status: ${fraudStatus}. Payment type: ${paymentType}`);
    let paymentStatus;
    if (transactionStatus === 'capture') {
      if (fraudStatus === 'challenge') {
        paymentStatus = 'pending';
      } else if (fraudStatus === 'accept') {
        paymentStatus = 'paid';
      }
    } else if (transactionStatus === 'settlement') {
      paymentStatus = 'paid';
    } else if (transactionStatus === 'cancel' || transactionStatus === 'deny' || transactionStatus === 'expire') {
      paymentStatus = 'failed';
    } else if (transactionStatus === 'pending') {
      paymentStatus = 'pending';
    } else {
      paymentStatus = 'pending';
    }
    let mappedPaymentType = paymentType;
    if (paymentType) {
      if (['credit_card', 'debit_card', 'bank_transfer', 'e_wallet', 'cash_on_delivery', 'qris'].includes(paymentType)) {
        mappedPaymentType = paymentType;
      } else if (paymentType === 'gopay' || paymentType === 'shopeepay') {
        mappedPaymentType = 'e_wallet';
      } else if (paymentType === 'cstore') {
        mappedPaymentType = 'cash_on_delivery';
      } else if (paymentType === 'echannel' || paymentType === 'bca_va' || paymentType === 'bni_va') {
        mappedPaymentType = 'bank_transfer';
      } else {
        mappedPaymentType = 'bank_transfer';
      }
    }
    return {
      orderId,
      transactionStatus,
      fraudStatus,
      paymentStatus,
      paymentType: mappedPaymentType
    };
  } catch (error) {
    console.error('Error handling Midtrans notification:', error);
    throw error;
  }
};

const getTransactionStatus = async (orderId) => {
  try {
    const response = await core.transaction.status(orderId);
    return response;
  } catch (error) {
    console.error('Error checking transaction status:', error);
    throw error;
  }
};

module.exports = {
  createTransaction,
  handleNotification,
  getTransactionStatus,
  urls
};