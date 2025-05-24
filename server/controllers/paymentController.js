const { Order, Payment, User, OrderItem } = require('../models');
const sequelize = require('../config/database');
const midtransService = require('../services/midtransService');
const orderController = require('./orderController');

exports.createPayment = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { orderId, method, transactionId } = req.body;
    
    if (!orderId || !method) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Order ID and payment method are required'
      });
    }
    
    const order = await Order.findOne({
      where: {
        id: orderId,
        userId: req.user.id
      },
      transaction
    });
    
    if (!order) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    const existingPayment = await Payment.findOne({
      where: { orderId },
      transaction
    });
    
    if (existingPayment && existingPayment.status === 'paid') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Payment has already been paid for this order'
      });
    }
    
    let payment;
    
    if (existingPayment) {
      payment = await existingPayment.update({
        method,
        transactionId,
        status: 'pending'
      }, { transaction });
    } else {
      payment = await Payment.create({
        orderId,
        amount: order.grandTotal,
        method,
        transactionId,
        status: 'pending'
      }, { transaction });
    }
    
    if (method === 'cash_on_delivery') {
      payment.status = 'pending';
    } else {
      payment.status = 'paid';
      payment.paymentDate = new Date();
      
      order.paymentStatus = 'paid';
      await order.save({ transaction });
    }
    
    await payment.save({ transaction });
    
    await transaction.commit();
    
    res.status(200).json({
      success: true,
      message: 'Payment processed successfully',
      data: {
        payment,
        orderStatus: order.status,
        paymentStatus: order.paymentStatus
      }
    });
  } catch (error) {
    await transaction.rollback();
    
    res.status(500).json({
      success: false,
      message: 'Error processing payment',
      error: error.message
    });
  }
};

exports.getSnapToken = async (req, res) => {
  try {
    const { items, shippingAddress, shippingFee, discount, shippingMethod, notes, shippingDetails } = req.body;
    const userId = req.user.id;
    
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const tempOrderNumber = `TEMP_${Date.now()}_${userId}`;
    
    const totalAmount = items.reduce((sum, item) => {
      return sum + (parseFloat(item.price) * item.quantity);
    }, 0);
    
    const grandTotal = totalAmount - (parseFloat(discount) || 0) + (parseFloat(shippingFee) || 0);
    
    const customerData = {
      fullName: shippingAddress.fullName,
      email: user.email,
      phoneNumber: shippingAddress.phoneNumber,
      address: shippingAddress.address,
      city: shippingAddress.city,
      postalCode: shippingAddress.postalCode
    };
    
    const orderData = {
      orderNumber: tempOrderNumber,
      grandTotal: grandTotal,
      shippingFee: parseFloat(shippingFee) || 0
    };
    
    const midtransResponse = await midtransService.createTransaction(
      orderData,
      items,
      customerData
    );
    
    return res.status(200).json({
      success: true,
      token: midtransResponse.token,
      redirect_url: midtransResponse.redirect_url
    });
  } catch (error) {
    console.error('Error generating token:', error);
    return res.status(500).json({
      success: false,
      message: 'Error generating payment token',
      error: error.message
    });
  }
};

exports.processPaymentCallback = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { orderId, transactionId, status, gatewayResponse } = req.body;
    if (!orderId || !transactionId || !status) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Order ID, transaction ID, and status are required'
      });
    }
    const payment = await Payment.findOne({
      where: { orderId },
      transaction
    });
    if (!payment) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }
    await payment.update({
      transactionId,
      status: status === 'success' ? 'completed' : 'failed',
      paymentDate: status === 'success' ? new Date() : null,
      gatewayResponse: JSON.stringify(gatewayResponse)
    }, { transaction });
    const order = await Order.findByPk(orderId, { transaction });
    if (order) {
      await order.update({
        paymentStatus: status === 'success' ? 'paid' : 'failed'
      }, { transaction });
      if (status === 'success') {
        const orderItems = await OrderItem.findAll({
          where: { orderId },
          transaction
        });
        console.log(`Reducing stock for ${orderItems.length} product items in order ${order.id}`);
        for (const item of orderItems) {
          const product = await Product.findByPk(item.productId, { transaction });
          if (product) {
            const newStock = Math.max(0, product.stock - item.quantity);
            console.log(`Updating product ${product.id} stock: ${product.stock} -> ${newStock}`);
            await product.update({ 
              stock: newStock 
            }, { transaction });
          } else {
            console.warn(`Product with ID ${item.productId} not found for stock update`);
          }
        }
      }
    }
    await transaction.commit();
    res.status(200).json({
      success: true,
      message: 'Payment callback processed successfully'
    });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({
      success: false,
      message: 'Error processing payment callback',
      error: error.message
    });
  }
};

exports.getAllPayments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const status = req.query.status;
    const method = req.query.method;
    
    const whereClause = {};
    
    if (status) {
      whereClause.status = status;
    }
    
    if (method) {
      whereClause.method = method;
    }
    
    const { count, rows: payments } = await Payment.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Order,
          attributes: ['id', 'orderNumber', 'userId', 'status', 'createdAt'],
          include: [
            {
              model: User,
              attributes: ['id', 'name', 'email']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });
    
    const totalPages = Math.ceil(count / limit);
    
    res.status(200).json({
      success: true,
      count,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: count,
        limit
      },
      data: payments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching payments',
      error: error.message
    });
  }
};

exports.getPaymentByOrderId = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findOne({
      where: {
        id: orderId,
        userId: req.user.id
      }
    });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    const payment = await Payment.findOne({
      where: { orderId },
      attributes: ['id', 'amount', 'method', 'status', 'transactionId', 'paymentDate', 'createdAt']
    });
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found for this order'
      });
    }
    
    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching payment',
      error: error.message
    });
  }
};

exports.updatePaymentStatus = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { status, transactionId } = req.body;
    
    const validStatuses = ['pending', 'paid', 'failed', 'refunded'];
    
    if (!status || !validStatuses.includes(status)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Invalid payment status'
      });
    }
    
    const payment = await Payment.findByPk(req.params.id, { transaction });
    
    if (!payment) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }
    
    await payment.update({
      status,
      transactionId: transactionId || payment.transactionId,
      paymentDate: status === 'paid' ? new Date() : payment.paymentDate
    }, { transaction });
    
    const order = await Order.findByPk(payment.orderId, { transaction });
    
    if (order) {
      const orderPaymentStatus = 
        status === 'paid' ? 'paid' :
        status === 'refunded' ? 'refunded' :
        status === 'failed' ? 'failed' : 'pending';
      
      await order.update({
        paymentStatus: orderPaymentStatus
      }, { transaction });
    }
    
    await transaction.commit();
    
    const updatedPayment = await Payment.findByPk(payment.id, {
      include: [
        {
          model: Order,
          attributes: ['id', 'orderNumber', 'status', 'paymentStatus']
        }
      ]
    });
    
    res.status(200).json({
      success: true,
      message: 'Payment status updated successfully',
      data: updatedPayment
    });
  } catch (error) {
    await transaction.rollback();
    
    res.status(500).json({
      success: false,
      message: 'Error updating payment status',
      error: error.message
    });
  }
};

exports.processRefund = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { amount, reason } = req.body;
    
    const payment = await Payment.findByPk(req.params.id, { 
      include: [
        {
          model: Order,
          attributes: ['id', 'status', 'paymentStatus', 'grandTotal']
        }
      ],
      transaction
    });
    
    if (!payment) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }
    
    if (payment.status !== 'paid') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Only paid payments can be refunded'
      });
    }
    
    const refundAmount = amount || payment.amount;
    if (refundAmount <= 0 || refundAmount > payment.amount) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Invalid refund amount'
      });
    }
    
    await payment.update({
      status: 'refunded',
      refundAmount,
      refundDate: new Date(),
      refundReason: reason
    }, { transaction });
    
    if (payment.Order) {
      await payment.Order.update({
        paymentStatus: 'refunded',
        status: 'refunded'
      }, { transaction });
    }
    
    await transaction.commit();
    
    res.status(200).json({
      success: true,
      message: 'Refund processed successfully',
      data: {
        paymentId: payment.id,
        orderId: payment.orderId,
        refundAmount,
        refundDate: new Date(),
        reason
      }
    });
  } catch (error) {
    await transaction.rollback();
    
    res.status(500).json({
      success: false,
      message: 'Error processing refund',
      error: error.message
    });
  }
};

exports.createMidtransPayment = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { orderId } = req.body;
    
    if (!orderId) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }
    
    const order = await Order.findByPk(orderId, {
      include: [
        {
          model: OrderItem,
          as: 'OrderItems',
          attributes: ['id', 'productId', 'quantity', 'price', 'productName']
        },
        {
          model: User,
          as: 'User',
          attributes: ['id', 'name', 'email', 'phone']
        }
      ],
      transaction
    });
    
    if (!order) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    if (order.userId !== req.user.id) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to access this order'
      });
    }
    
    let shippingAddress;
    try {
      shippingAddress = typeof order.shippingAddress === 'string' 
        ? JSON.parse(order.shippingAddress)
        : order.shippingAddress;
    } catch (error) {
      shippingAddress = {
        fullName: order.User.name,
        phoneNumber: order.User.phone || '',
        address: 'Address not provided',
        city: 'City not provided',
        postalCode: '00000'
      };
    }
    
    const customer = {
      fullName: shippingAddress.fullName || order.User.name,
      email: order.User.email,
      phoneNumber: shippingAddress.phoneNumber || order.User.phone,
      address: shippingAddress.address,
      city: shippingAddress.city,
      postalCode: shippingAddress.postalCode
    };
    
    let payment = await Payment.findOne({
      where: { orderId: order.id },
      transaction
    });
    
    if (!payment) {
      payment = await Payment.create({
        orderId: order.id,
        amount: order.grandTotal,
        method: 'bank_transfer',
        status: 'pending'
      }, { transaction });
    } else if (payment.status === 'completed') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Payment has already been paid for this order'
      });
    }
    
    const midtransResponse = await midtransService.createTransaction(
      order,
      order.OrderItems,
      customer
    );
    
    await payment.update({
      transactionId: midtransResponse.transaction_id || '',
      gatewayResponse: JSON.stringify(midtransResponse)
    }, { transaction });
    
    await transaction.commit();
    
    return res.status(200).json({
      success: true,
      message: 'Payment initialized successfully',
      data: {
        token: midtransResponse.token,
        redirect_url: midtransResponse.redirect_url
      }
    });
  } catch (error) {
    await transaction.rollback();
    
    console.error('Error creating Midtrans payment:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to initialize payment',
      error: error.message
    });
  }
};