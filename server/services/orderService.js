const { 
    Order, 
    OrderItem, 
    Product, 
    Cart, 
    CartItem, 
    Payment,
    User 
  } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { sendOrderConfirmationEmail } = require('../utils/emailService');
const { PAGINATION, ORDER_STATUS, PAYMENT_STATUS } = require('../utils/constants');

exports.createOrder = async (userId, orderData) => {
    const transaction = await sequelize.transaction();
    try {
      const { shippingAddress, paymentMethod = 'cash_on_delivery', notes } = orderData;
      if (!shippingAddress) {
        await transaction.rollback();
        throw new Error('Shipping address is required');
      }
      const cart = await Cart.findOne({
        where: { userId },
        transaction
      });
      if (!cart || cart.totalItems === 0) {
        await transaction.rollback();
        throw new Error('Cart is empty');
      }
      const cartItems = await CartItem.findAll({
        where: { cartId: cart.id },
        include: [
          {
            model: Product,
            attributes: ['id', 'name', 'price', 'sku', 'stock', 'isActive']
          }
        ],
        transaction
      });
      const invalidItems = [];
      for (const item of cartItems) {
        if (!item.Product.isActive) {
          invalidItems.push({
            id: item.productId,
            name: item.Product.name,
            reason: 'Product is no longer available'
          });
          continue;
        }
        if (item.Product.stock < item.quantity) {
          invalidItems.push({
            id: item.productId,
            name: item.Product.name,
            reason: `Only ${item.Product.stock} items available in stock`
          });
        }
      }
      if (invalidItems.length > 0) {
        await transaction.rollback();
        throw new Error('Some items in your cart are not available');
      }
      const totalAmount = parseFloat(cart.totalPrice);
      const tax = parseFloat((totalAmount * 0.1).toFixed(2));
      let shippingFee = 0;
      if (totalAmount < 100) {
        shippingFee = 10;
      } else if (totalAmount < 200) {
        shippingFee = 5;
      }
      const grandTotal = totalAmount + tax + shippingFee;
      const order = await Order.create({
        userId,
        totalAmount,
        tax,
        shippingFee,
        grandTotal,
        shippingAddress,
        paymentMethod,
        notes
      }, { transaction });
      const orderItems = [];
      for (const item of cartItems) {
        await Product.update(
          { stock: item.Product.stock - item.quantity },
          { 
            where: { id: item.productId },
            transaction
          }
        );
        const orderItem = await OrderItem.create({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          totalPrice: item.totalPrice,
          productName: item.Product.name,
          productSku: item.Product.sku
        }, { transaction });
        orderItems.push(orderItem);
      }
      await Payment.create({
        orderId: order.id,
        amount: grandTotal,
        method: paymentMethod,
        status: paymentMethod === 'cash_on_delivery' ? 'pending' : 'pending'
      }, { transaction });
      await CartItem.destroy({
        where: { cartId: cart.id },
        transaction
      });
      await Cart.update(
        { totalItems: 0, totalPrice: 0 },
        { 
          where: { id: cart.id },
          transaction
        }
      );
      await transaction.commit();
      const user = await User.findByPk(userId);
      await sendOrderConfirmationEmail(user.email, {
        orderNumber: order.orderNumber,
        items: orderItems.map(item => ({
          productName: item.productName,
          quantity: item.quantity,
          price: parseFloat(item.price),
          totalPrice: parseFloat(item.totalPrice)
        })),
        totalAmount: grandTotal,
        shippingAddress
      });
      const completeOrder = await Order.findByPk(order.id, {
        include: [
          {
            model: OrderItem,
            attributes: ['id', 'productId', 'quantity', 'price', 'totalPrice', 'productName']
          },
          {
            model: Payment,
            attributes: ['id', 'method', 'status', 'amount']
          }
        ]
      });
      return completeOrder;
    } catch (error) {
      if (transaction) {
        await transaction.rollback();
      }
      throw error;
    }
  };

exports.getAllOrders = async (params) => {
    try {
      const page = parseInt(params.page) || PAGINATION.DEFAULT_PAGE;
      const limit = parseInt(params.limit) || PAGINATION.DEFAULT_LIMIT;
      const offset = (page - 1) * limit;
      const status = params.status;
      const paymentStatus = params.paymentStatus;
      const startDate = params.startDate;
      const endDate = params.endDate;
      const whereClause = {};
      if (status) {
        whereClause.status = status;
      }
      if (paymentStatus) {
        whereClause.paymentStatus = paymentStatus;
      }
      if (startDate && endDate) {
        whereClause.createdAt = {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        };
      } else if (startDate) {
        whereClause.createdAt = {
          [Op.gte]: new Date(startDate)
        };
      } else if (endDate) {
        whereClause.createdAt = {
          [Op.lte]: new Date(endDate)
        };
      }
      const { count, rows: orders } = await Order.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            attributes: ['id', 'name', 'email']
          },
          {
            model: Payment,
            attributes: ['id', 'method', 'status', 'amount', 'transactionId']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });
      const totalPages = Math.ceil(count / limit);
      return {
        orders,
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

exports.getUserOrders = async (userId, params) => {
    try {
      const page = parseInt(params.page) || PAGINATION.DEFAULT_PAGE;
      const limit = parseInt(params.limit) || PAGINATION.DEFAULT_LIMIT;
      const offset = (page - 1) * limit;
      const status = params.status;
      const whereClause = { userId };
      if (status) {
        whereClause.status = status;
      }
      const { count, rows: orders } = await Order.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Payment,
            attributes: ['id', 'method', 'status', 'amount']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });
      const totalPages = Math.ceil(count / limit);
      return {
        orders,
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

exports.getOrderById = async (id) => {
    try {
      const order = await Order.findByPk(id, {
        include: [
          {
            model: OrderItem,
            attributes: ['id', 'productId', 'quantity', 'price', 'totalPrice', 'productName', 'productSku'],
            include: [
              {
                model: Product,
                attributes: ['id', 'name', 'imageUrl']
              }
            ]
          },
          {
            model: User,
            attributes: ['id', 'name', 'email', 'phone']
          },
          {
            model: Payment,
            attributes: ['id', 'method', 'status', 'amount', 'transactionId', 'paymentDate', 'gatewayResponse']
          }
        ]
      });
      if (!order) {
        throw new Error('Order not found');
      }
      return order;
    } catch (error) {
      throw error;
    }
  };

exports.getUserOrderById = async (id, userId) => {
    try {
      const order = await Order.findOne({
        where: {
          id,
          userId
        },
        include: [
          {
            model: OrderItem,
            attributes: ['id', 'productId', 'quantity', 'price', 'totalPrice', 'productName'],
            include: [
              {
                model: Product,
                attributes: ['id', 'name', 'imageUrl']
              }
            ]
          },
          {
            model: Payment,
            attributes: ['id', 'method', 'status', 'amount', 'transactionId', 'paymentDate']
          }
        ]
      });
      if (!order) {
        throw new Error('Order not found');
      }
      return order;
    } catch (error) {
      throw error;
    }
  };

exports.cancelOrder = async (id, userId) => {
    const transaction = await sequelize.transaction();
    try {
      const order = await Order.findOne({
        where: {
          id,
          userId
        },
        include: [
          {
            model: OrderItem,
            attributes: ['id', 'productId', 'quantity']
          }
        ],
        transaction
      });
      if (!order) {
        await transaction.rollback();
        throw new Error('Order not found');
      }
      if (!['pending', 'processing'].includes(order.status)) {
        await transaction.rollback();
        throw new Error(`Cannot cancel order with status: ${order.status}`);
      }
      await order.update(
        { status: ORDER_STATUS.CANCELLED },
        { transaction }
      );
      await Payment.update(
        { status: PAYMENT_STATUS.REFUNDED },
        { 
          where: { orderId: order.id },
          transaction
        }
      );
      for (const item of order.OrderItems) {
        const product = await Product.findByPk(item.productId, { transaction });
        if (product) {
          await product.update(
            { stock: product.stock + item.quantity },
            { transaction }
          );
        }
      }
      await transaction.commit();
      const updatedOrder = await Order.findByPk(order.id, {
        include: [
          {
            model: OrderItem,
            attributes: ['id', 'productId', 'quantity', 'price', 'totalPrice', 'productName']
          },
          {
            model: Payment,
            attributes: ['id', 'method', 'status', 'amount']
          }
        ]
      });
      return updatedOrder;
    } catch (error) {
      if (transaction) {
        await transaction.rollback();
      }
      throw error;
    }
  };

exports.updateOrderStatus = async (id, status) => {
    const transaction = await sequelize.transaction();
    try {
      const validStatuses = Object.values(ORDER_STATUS);
      if (!status || !validStatuses.includes(status)) {
        await transaction.rollback();
        throw new Error('Invalid status');
      }
      const order = await Order.findByPk(id, { transaction });
      if (!order) {
        await transaction.rollback();
        throw new Error('Order not found');
      }
      if (status === ORDER_STATUS.CANCELLED && order.status !== ORDER_STATUS.CANCELLED) {
        const orderItems = await OrderItem.findAll({
          where: { orderId: order.id },
          transaction
        });
        for (const item of orderItems) {
          const product = await Product.findByPk(item.productId, { transaction });
          if (product) {
            await product.update(
              { stock: product.stock + item.quantity },
              { transaction }
            );
          }
        }
        await Payment.update(
          { status: PAYMENT_STATUS.REFUNDED },
          { 
            where: { orderId: order.id },
            transaction
          }
        );
      }
      if (status === ORDER_STATUS.DELIVERED && order.paymentMethod === 'cash_on_delivery') {
        await order.update(
          { 
            status,
            paymentStatus: PAYMENT_STATUS.PAID
          },
          { transaction }
        );
        await Payment.update(
          { 
            status: 'completed',
            paymentDate: new Date()
          },
          { 
            where: { orderId: order.id },
            transaction
          }
        );
      } else {
        await order.update({ status }, { transaction });
      }
      await transaction.commit();
      const updatedOrder = await Order.findByPk(order.id, {
        include: [
          {
            model: OrderItem,
            attributes: ['id', 'productId', 'quantity', 'price', 'totalPrice', 'productName']
          },
          {
            model: Payment,
            attributes: ['id', 'method', 'status', 'amount', 'paymentDate']
          }
        ]
      });
      return updatedOrder;
    } catch (error) {
      if (transaction) {
        await transaction.rollback();
      }
      throw error;
    }
  };

exports.updatePaymentStatus = async (id, paymentStatus) => {
    try {
      const validStatuses = Object.values(PAYMENT_STATUS);
      if (!paymentStatus || !validStatuses.includes(paymentStatus)) {
        throw new Error('Invalid payment status');
      }
      const order = await Order.findByPk(id);
      if (!order) {
        throw new Error('Order not found');
      }
      await order.update({ paymentStatus });
      const payment = await Payment.findOne({ where: { orderId: id } });
      if (payment) {
        await payment.update({
          status: paymentStatus === PAYMENT_STATUS.PAID ? 'completed' : paymentStatus,
          paymentDate: paymentStatus === PAYMENT_STATUS.PAID ? new Date() : payment.paymentDate
        });
      }
      const updatedOrder = await Order.findByPk(id, {
        include: [
          {
            model: Payment,
            attributes: ['id', 'method', 'status', 'amount', 'paymentDate']
          }
        ]
      });
      return updatedOrder;
    } catch (error) {
      throw error;
    }
  };

exports.updateTrackingInfo = async (id, trackingData) => {
    try {
      const { trackingNumber, estimatedDelivery } = trackingData;
      const order = await Order.findByPk(id);
      if (!order) {
        throw new Error('Order not found');
      }
      await order.update({
        trackingNumber: trackingNumber || order.trackingNumber,
        estimatedDelivery: estimatedDelivery || order.estimatedDelivery
      });
      if (trackingNumber && order.status === ORDER_STATUS.PENDING) {
        await order.update({ status: ORDER_STATUS.PROCESSING });
      }
      return order;
    } catch (error) {
      throw error;
    }
  };

exports.getOrderStatistics = async (params) => {
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
      const totalOrders = await Order.count({ where: dateRange });
      const ordersByStatus = await Order.findAll({
        where: dateRange,
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['status']
      });
      const ordersByPaymentMethod = await Order.findAll({
        where: dateRange,
        attributes: [
          'paymentMethod',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['paymentMethod']
      });
      const revenue = await Order.sum('grandTotal', {
        where: {
          ...dateRange,
          status: { [Op.notIn]: [ORDER_STATUS.CANCELLED, ORDER_STATUS.REFUNDED] }
        }
      });
      const averageOrderValue = revenue / totalOrders || 0;
      const statistics = {
        totalOrders,
        revenue: parseFloat(revenue) || 0,
        averageOrderValue: parseFloat(averageOrderValue.toFixed(2)),
        ordersByStatus: ordersByStatus.reduce((acc, item) => {
          acc[item.status] = parseInt(item.getDataValue('count'));
          return acc;
        }, {}),
        ordersByPaymentMethod: ordersByPaymentMethod.reduce((acc, item) => {
          acc[item.paymentMethod] = parseInt(item.getDataValue('count'));
          return acc;
        }, {})
      };
      return statistics;
    } catch (error) {
      throw error;
    }
  };