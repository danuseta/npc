const { Order, Payment, User } = require('../models');
const sequelize = require('../config/database');
const { PAGINATION, PAYMENT_STATUS, ORDER_STATUS } = require('../utils/constants');
const { Op } = require('sequelize');

exports.createPayment = async (userId, paymentData) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { orderId, method, transactionId } = paymentData;
    
    if (!orderId || !method) {
      await transaction.rollback();
      throw new Error('Order ID and payment method are required');
    }
    
    const order = await Order.findOne({
      where: {
        id: orderId,
        userId
      },
      transaction
    });
    
    if (!order) {
      await transaction.rollback();
      throw new Error('Order not found');
    }
    
    const existingPayment = await Payment.findOne({
      where: { orderId },
      transaction
    });
    
    if (existingPayment && existingPayment.status === 'completed') {
      await transaction.rollback();
      throw new Error('Payment has already been completed for this order');
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
      payment.status = 'completed';
      payment.paymentDate = new Date();
      
      order.paymentStatus = PAYMENT_STATUS.PAID;
      await order.save({ transaction });
    }
    
    await payment.save({ transaction });
    
    await transaction.commit();
    
    return {
      payment,
      orderStatus: order.status,
      paymentStatus: order.paymentStatus
    };
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    throw error;
  }
};

exports.processPaymentCallback = async (callbackData) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { orderId, transactionId, status, gatewayResponse } = callbackData;
    
    if (!orderId || !transactionId || !status) {
      await transaction.rollback();
      throw new Error('Order ID, transaction ID, and status are required');
    }
    
    const payment = await Payment.findOne({
      where: { orderId },
      transaction
    });
    
    if (!payment) {
      await transaction.rollback();
      throw new Error('Payment not found');
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
        paymentStatus: status === 'success' ? PAYMENT_STATUS.PAID : PAYMENT_STATUS.FAILED
      }, { transaction });
    }
    
    await transaction.commit();
    
    return true;
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    throw error;
  }
};

exports.getAllPayments = async (params) => {
  try {
    const page = parseInt(params.page) || PAGINATION.DEFAULT_PAGE;
    const limit = parseInt(params.limit) || PAGINATION.DEFAULT_LIMIT;
    const offset = (page - 1) * limit;
    const status = params.status;
    const method = params.method;
    
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
    
    return {
      payments,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: count,
        limit
      }
    };
  } catch (error) {
    throw error;
  }
};

exports.getPaymentByOrderId = async (orderId, userId) => {
  try {
    const order = await Order.findOne({
      where: {
        id: orderId,
        userId
      }
    });
    
    if (!order) {
      throw new Error('Order not found');
    }
    
    const payment = await Payment.findOne({
      where: { orderId },
      attributes: ['id', 'amount', 'method', 'status', 'transactionId', 'paymentDate', 'createdAt']
    });
    
    if (!payment) {
      throw new Error('Payment not found for this order');
    }
    
    return payment;
  } catch (error) {
    throw error;
  }
};

exports.updatePaymentStatus = async (id, updateData) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { status, transactionId } = updateData;
    
    const validStatuses = ['pending', 'completed', 'failed', 'refunded'];
    
    if (!status || !validStatuses.includes(status)) {
      await transaction.rollback();
      throw new Error('Invalid payment status');
    }
    
    const payment = await Payment.findByPk(id, { transaction });
    
    if (!payment) {
      await transaction.rollback();
      throw new Error('Payment not found');
    }
    
    await payment.update({
      status,
      transactionId: transactionId || payment.transactionId,
      paymentDate: status === 'completed' ? new Date() : payment.paymentDate
    }, { transaction });
    
    const order = await Order.findByPk(payment.orderId, { transaction });
    
    if (order) {
      const orderPaymentStatus = 
        status === 'completed' ? PAYMENT_STATUS.PAID :
        status === 'refunded' ? PAYMENT_STATUS.REFUNDED :
        status === 'failed' ? PAYMENT_STATUS.FAILED : PAYMENT_STATUS.PENDING;
      
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
    
    return updatedPayment;
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    throw error;
  }
};

exports.processRefund = async (id, refundData) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { amount, reason } = refundData;
    
    const payment = await Payment.findByPk(id, { 
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
      throw new Error('Payment not found');
    }
    
    if (payment.status !== 'completed') {
      await transaction.rollback();
      throw new Error('Only completed payments can be refunded');
    }
    
    const refundAmount = amount || payment.amount;
    if (refundAmount <= 0 || refundAmount > payment.amount) {
      await transaction.rollback();
      throw new Error('Invalid refund amount');
    }
    
    await payment.update({
      status: 'refunded',
      refundAmount,
      refundDate: new Date(),
      refundReason: reason
    }, { transaction });
    
    if (payment.Order) {
      await payment.Order.update({
        paymentStatus: PAYMENT_STATUS.REFUNDED,
        status: ORDER_STATUS.REFUNDED
      }, { transaction });
    }
    
    await transaction.commit();
    
    return {
      paymentId: payment.id,
      orderId: payment.orderId,
      refundAmount,
      refundDate: new Date(),
      reason
    };
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    throw error;
  }
};

exports.getPaymentStatistics = async (params) => {
  try {
    const { startDate, endDate } = params;
    
    const dateRange = {};
    
    if (startDate && endDate) {
      dateRange.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      dateRange.createdAt = {
        [Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      dateRange.createdAt = {
        [Op.lte]: new Date(endDate)
      };
    }
    
    const totalPayments = await Payment.count({ where: dateRange });
    
    const paymentsByStatus = await Payment.findAll({
      where: dateRange,
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status']
    });
    
    const paymentsByMethod = await Payment.findAll({
      where: dateRange,
      attributes: [
        'method',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['method']
    });
    
    const totalAmount = await Payment.sum('amount', {
      where: {
        ...dateRange,
        status: 'completed'
      }
    });
    
    const refundedAmount = await Payment.sum('refundAmount', {
      where: {
        ...dateRange,
        status: 'refunded'
      }
    });
    
    const statistics = {
      totalPayments,
      totalAmount: parseFloat(totalAmount) || 0,
      refundedAmount: parseFloat(refundedAmount) || 0,
      netAmount: parseFloat((totalAmount - refundedAmount) || 0),
      paymentsByStatus: paymentsByStatus.reduce((acc, item) => {
        acc[item.status] = parseInt(item.getDataValue('count'));
        return acc;
      }, {}),
      paymentsByMethod: paymentsByMethod.reduce((acc, item) => {
        acc[item.method] = parseInt(item.getDataValue('count'));
        return acc;
      }, {})
    };
    
    return statistics;
  } catch (error) {
    throw error;
  }
};