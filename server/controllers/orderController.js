const { 
    Order, 
    OrderItem, 
    Product, 
    Cart, 
    CartItem, 
    Payment,
    User
  } = require('../models');
  const { sendOrderConfirmationEmail } = require('../utils/emailService');
  const sequelize = require('../config/database');
  const { Op } = require('sequelize');
  
exports.createOrder = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('Creating order with data:', JSON.stringify(req.body, null, 2));
    
    const userId = req.user.id;
    const { 
      shippingAddress, 
      paymentMethod = 'midtrans', 
      shippingMethod, 
      shippingDetails,
      shippingFee = 0, 
      discount = 0, 
      notes = '', 
      items = [],
      saveAddress = false,
      transactionId = null,
      paymentStatus = 'pending',
      totalAmount
    } = req.body;

    if (!shippingAddress) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Shipping address is required'
      });
    }
    
    if (!items || items.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Product items are required'
      });
    }
    
    if (totalAmount === undefined) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Total amount is required'
      });
    }

    const formattedAddress = typeof shippingAddress === 'string' 
      ? shippingAddress 
      : JSON.stringify(shippingAddress);

    const calculatedTotalAmount = parseFloat(totalAmount) || items.reduce((sum, item) => {
      return sum + (parseFloat(item.price) * item.quantity);
    }, 0);

    const discountAmount = parseFloat(discount) || 0;
    
    let estimatedDelivery = null;
    if (shippingDetails && typeof shippingDetails === 'object' && shippingDetails.estimatedDelivery) {
      try {
        const estimateText = shippingDetails.estimatedDelivery;
        const daysMatch = estimateText.match(/(\d+)/);
        
        if (daysMatch && daysMatch[1]) {
          const days = parseInt(daysMatch[1]);
          const deliveryDate = new Date();
          deliveryDate.setDate(deliveryDate.getDate() + days);
          estimatedDelivery = deliveryDate;
        }
      } catch (error) {
        console.log('Error parsing estimated delivery date:', error);
        estimatedDelivery = null;
      }
    }
    
    const dateStr = new Date().toISOString()
      .replace(/[-:T.Z]/g, '')
      .substring(0, 14);
    const uniqueRandom = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, '0');
    const customOrderNumber = `ORD-${dateStr}-${uniqueRandom}-${userId}`;
    
    const orderData = {
      userId,
      orderNumber: customOrderNumber,
      status: paymentStatus === 'paid' ? 'processing' : 'pending',
      totalAmount: calculatedTotalAmount,
      tax: 0,
      shippingFee: parseFloat(shippingFee || 0),
      grandTotal: calculatedTotalAmount + parseFloat(shippingFee || 0),
      shippingAddress: formattedAddress,
      paymentMethod,
      paymentStatus,
      notes,
      shippingMethod,
      shippingDetails: shippingDetails ? JSON.stringify(shippingDetails) : null,
      estimatedDelivery
    };
    
    console.log('Order data prepared:', JSON.stringify(orderData, null, 2));

    const order = await Order.create(orderData, { transaction });

    console.log(`Order created successfully with ID: ${order.id}, Number: ${order.orderNumber}`);

    for (const item of items) {
      const product = await Product.findByPk(item.productId, { transaction });
      
      if (!product) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: `Product with ID ${item.productId} not found`
        });
      }

      await OrderItem.create({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        totalPrice: item.price * item.quantity,
        productName: product.name,
        productSku: product.sku || null,
        discountAmount: 0
      }, { transaction });
      
      if (paymentStatus === 'paid') {
        await product.update(
          { stock: Math.max(0, product.stock - item.quantity) },
          { transaction }
        );
      }
    }
    
    if (transactionId) {
      await Payment.create({
        orderId: order.id,
        amount: order.grandTotal,
        method: paymentMethod,
        status: paymentStatus === 'paid' ? 'paid' : 'pending',
        transactionId,
        paymentDate: paymentStatus === 'paid' ? new Date() : null
      }, { transaction });
    }

    await transaction.commit();
    console.log(`Transaction committed successfully for order ${order.orderNumber}`);

    return res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        grandTotal: order.grandTotal
      }
    });

  } catch (error) {
    await transaction.rollback();
    
    console.error('Error creating order:', error);
    
    if (error.name === 'SequelizeValidationError') {
      console.error('Validation errors:', error.errors);
    } else if (error.name === 'SequelizeDatabaseError') {
      console.error('Database error details:', error.parent);
    } else if (error.name === 'SequelizeUniqueConstraintError') {
      console.error('Unique constraint error:', error.errors);
    }
    
    return res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message,
      errorType: error.name
    });
  }
};

exports.updateOrderStatusAfterPayment = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { status, paymentStatus, transactionId, paymentMethod, trackingNumber } = req.body;
    const orderId = req.params.id;
    
    console.log(`Attempting to update order ${orderId} with status: ${status}, payment: ${paymentStatus}, tracking: ${trackingNumber}`);
    
    const order = await Order.findByPk(orderId, { 
      include: [{
        model: OrderItem,
        as: 'OrderItems'
      }],
      transaction 
    });
    
    if (!order) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    const previousPaymentStatus = order.paymentStatus;
    
    const updateData = {
      status: status || order.status,
      paymentStatus: paymentStatus || order.paymentStatus, 
      paymentMethod: paymentMethod || order.paymentMethod
    };
    
    if (trackingNumber) {
      updateData.trackingNumber = trackingNumber;
    }
    
    await order.update(updateData, { transaction });
    
    console.log(`Order successfully updated to status: ${status}, payment status: ${paymentStatus}, tracking: ${trackingNumber || 'not provided'}`);
    
    let payment = await Payment.findOne({ 
      where: { orderId },
      transaction
    });
    
    const paymentDbStatus = paymentStatus === 'paid' ? 'completed' : paymentStatus;
    
    if (payment) {
      await payment.update({
        status: paymentDbStatus,
        transactionId,
        paymentDate: paymentStatus === 'paid' ? new Date() : null,
        method: paymentMethod || payment.method
      }, { transaction });
    } else {
      await Payment.create({
        orderId,
        amount: order.grandTotal,
        method: paymentMethod || 'bank_transfer',
        status: paymentDbStatus,
        transactionId,
        paymentDate: paymentStatus === 'paid' ? new Date() : null
      }, { transaction });
    }
    
    if (paymentStatus === 'paid' && previousPaymentStatus !== 'paid') {
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
      
      console.log(`Product stock has been updated after successful payment for order ${orderId}`);
      
      try {
        console.log(`Removing purchased items from cart for user ID: ${order.userId}`);
        
        const userCart = await Cart.findOne({ 
          where: { userId: order.userId },
          transaction
        });
        
        if (userCart) {
          const purchasedProductIds = orderItems.map(item => item.productId);
          console.log(`Purchased products: ${JSON.stringify(purchasedProductIds)}`);
          
          const cartItemsToRemove = await CartItem.findAll({
            where: { 
              cartId: userCart.id,
              productId: { [Op.in]: purchasedProductIds }
            },
            transaction
          });
          
          if (cartItemsToRemove.length > 0) {
            const removedQuantity = cartItemsToRemove.reduce((sum, item) => sum + item.quantity, 0);
            const removedPrice = cartItemsToRemove.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0);
            
            console.log(`Removing ${cartItemsToRemove.length} item types (${removedQuantity} total items) from cart`);
            
            await CartItem.destroy({
              where: {
                cartId: userCart.id,
                productId: { [Op.in]: purchasedProductIds }
              },
              transaction
            });
            
            const newTotalItems = Math.max(0, userCart.totalItems - removedQuantity);
            const newTotalPrice = Math.max(0, parseFloat(userCart.totalPrice) - removedPrice);
            
            await userCart.update({
              totalItems: newTotalItems,
              totalPrice: newTotalPrice,
              lastUpdated: new Date()
            }, { transaction });
            
            console.log(`Cart updated: ${newTotalItems} items left with total price ${newTotalPrice}`);
          } else {
            console.log(`No purchased items found in cart, maybe already removed`);
          }
        } else {
          console.log(`No cart found for user ID: ${order.userId}`);
        }
      } catch (cartError) {
        console.error(`Error removing items from cart: ${cartError.message}`);
        console.error(`Stack trace: ${cartError.stack}`);
      }
    }
    
    await transaction.commit();
    
    return res.status(200).json({
      success: true,
      message: 'Order status and product stock updated successfully',
      data: { 
        id: order.id, 
        orderNumber: order.orderNumber, 
        status: order.status,
        paymentStatus: order.paymentStatus,
        trackingNumber: order.trackingNumber
      }
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    console.error('Error stack:', error.stack);
    
    await transaction.rollback();
    
    return res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message
    });
  }
};

exports.createFallbackOrder = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('Received request to create fallback order:', req.body);
    
    const { 
      transactionId, 
      paymentMethod, 
      paymentStatus, 
      grandTotal,
      items = []
    } = req.body;
    
    if (!transactionId || !grandTotal) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Transaction ID and grand total are required'
      });
    }
    
    const userId = req.user.id;
    
    const existingPayment = await Payment.findOne({
      where: { transactionId },
      include: [{ model: Order }],
      transaction
    });
    
    if (existingPayment && existingPayment.Order) {
      await transaction.rollback();
      return res.status(200).json({
        success: true,
        message: 'Order for this transaction already exists',
        data: existingPayment.Order
      });
    }
    
    const user = await User.findByPk(userId, { transaction });
    if (!user) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const dateStr = new Date().toISOString()
      .replace(/[-:T.Z]/g, '')
      .substring(0, 14);
    const uniqueRandom = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, '0');
    const orderNumber = `ORD-FB-${dateStr}-${uniqueRandom}-${userId}`;
    
    const shippingAddress = {
      fullName: user.name || 'Customer',
      phoneNumber: user.phone || '',
      address: user.address || 'Address not available',
      city: user.city || 'City not available',
      province: user.state || 'Province not available',
      postalCode: user.zipCode || '00000'
    };
    
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 3);
    
    const orderData = {
      userId,
      orderNumber,
      status: 'processing',
      totalAmount: grandTotal,
      tax: 0,
      shippingFee: 0,
      grandTotal,
      shippingAddress: JSON.stringify(shippingAddress),
      paymentMethod: paymentMethod || 'midtrans',
      paymentStatus: paymentStatus || 'paid',
      notes: `Fallback order from payment with transaction ID ${transactionId}`,
      estimatedDelivery
    };
    
    console.log('Creating fallback order with data:', orderData);
    
    const order = await Order.create(orderData, { transaction });
    console.log(`Fallback order created successfully with ID ${order.id}`);
    
    if (items && items.length > 0) {
      for (const item of items) {
        try {
          const product = await Product.findByPk(item.productId, { transaction });
          
          if (product) {
            await OrderItem.create({
              orderId: order.id,
              productId: item.productId,
              quantity: item.quantity,
              price: item.price || product.price,
              totalPrice: (item.price || product.price) * item.quantity,
              productName: product.name,
              productSku: product.sku || null
            }, { transaction });
            
            await product.update({
              stock: Math.max(0, product.stock - item.quantity)
            }, { transaction });
          }
        } catch (itemError) {
          console.error(`Error adding item ${item.productId} to order:`, itemError);
        }
      }
    } else {
      console.log('No items to add to fallback order');
    }
    
    await Payment.create({
      orderId: order.id,
      amount: grandTotal,
      method: paymentMethod || 'midtrans',
      status: 'paid',
      transactionId,
      paymentDate: new Date(),
      gatewayResponse: JSON.stringify(req.body)
    }, { transaction });
    
    await transaction.commit();
    
    const completeOrder = await Order.findByPk(order.id, {
      include: [
        {
          model: OrderItem,
          include: [{ model: Product }]
        },
        { model: Payment }
      ]
    });
    
    return res.status(201).json({
      success: true,
      message: 'Fallback order created successfully',
      data: completeOrder
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating fallback order:', error);
    console.error('Stack trace:', error.stack);
    
    if (error.name === 'SequelizeValidationError') {
      console.error('Validation errors:', error.errors);
    } else if (error.name === 'SequelizeDatabaseError') {
      console.error('Database error details:', error.parent);
    }
    
    return res.status(500).json({
      success: false,
      message: 'Failed to create fallback order',
      error: error.message
    });
  }
};

exports.getOrderStats = async (req, res) => {
  try {
    const totalOrders = await Order.count();
    
    const salesResult = await Order.findOne({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('grandTotal')), 'totalSales']
      ],
      where: {
        status: {
          [Op.notIn]: ['cancelled']
        }
      }
    });
    const totalSales = salesResult.getDataValue('totalSales') || 0;
    
    const pendingOrders = await Order.count({ where: { status: 'pending' } });
    const processingOrders = await Order.count({ where: { status: 'processing' } });
    const shippedOrders = await Order.count({ where: { status: 'shipped' } });
    const deliveredOrders = await Order.count({ where: { status: 'delivered' } });
    const cancelledOrders = await Order.count({ where: { status: 'cancelled' } });
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const currentMonthStart = new Date(currentYear, currentMonth, 1);
    const currentMonthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);
    
    const prevMonthStart = new Date(currentYear, currentMonth - 1, 1);
    const prevMonthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);
    
    const currentMonthResult = await Order.findOne({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('grandTotal')), 'sales']
      ],
      where: {
        createdAt: {
          [Op.between]: [currentMonthStart, currentMonthEnd]
        },
        status: {
          [Op.notIn]: ['cancelled']
        }
      }
    });
    
    const prevMonthResult = await Order.findOne({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('grandTotal')), 'sales']
      ],
      where: {
        createdAt: {
          [Op.between]: [prevMonthStart, prevMonthEnd]
        },
        status: {
          [Op.notIn]: ['cancelled']
        }
      }
    });
    
    const currentMonthOrders = currentMonthResult.getDataValue('count') || 0;
    const prevMonthOrders = prevMonthResult.getDataValue('count') || 0;
    
    const currentMonthSales = currentMonthResult.getDataValue('sales') || 0;
    const prevMonthSales = prevMonthResult.getDataValue('sales') || 0;
    
    let orderGrowth = 0;
    if (prevMonthOrders > 0) {
      orderGrowth = ((currentMonthOrders - prevMonthOrders) / prevMonthOrders) * 100;
    }
    
    let salesGrowth = 0;
    if (prevMonthSales > 0) {
      salesGrowth = ((currentMonthSales - prevMonthSales) / prevMonthSales) * 100;
    }
    
    res.status(200).json({
      success: true,
      data: {
        totalOrders,
        totalSales,
        pendingOrders,
        processingOrders,
        shippedOrders,
        deliveredOrders,
        cancelledOrders,
        currentMonthOrders,
        prevMonthOrders,
        orderGrowth,
        currentMonthSales,
        prevMonthSales,
        salesGrowth
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching order statistics',
      error: error.message
    });
  }
};

exports.getRecentOrders = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    
    const recentOrders = await Order.findAll({
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email', 'phone']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit
    });
    
    const formattedOrders = recentOrders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.User ? order.User.name : 'Unknown',
      customerEmail: order.User ? order.User.email : '',
      customerPhone: order.User ? order.User.phone : '',
      date: order.createdAt,
      total: order.grandTotal,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      trackingNumber: order.trackingNumber
    }));
    
    res.status(200).json({
      success: true,
      count: formattedOrders.length,
      orders: formattedOrders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching recent orders',
      error: error.message
    });
  }
};

exports.getSalesData = async (req, res) => {
  try {
    const period = req.query.period || 'weekly';
    let salesData = [];
    
    const now = new Date();
    
    if (period === 'weekly') {
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        const startOfDay = new Date(date.setHours(0, 0, 0, 0));
        const endOfDay = new Date(date.setHours(23, 59, 59, 999));
        
        const orders = await Order.findAll({
          where: {
            createdAt: {
              [Op.between]: [startOfDay, endOfDay]
            },
            status: {
              [Op.ne]: 'cancelled'
            }
          },
          attributes: [
            [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('grandTotal')), 0), 'total']
          ],
          raw: true
        });
        
        const dayTotal = orders[0].total || 0;
        
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        
        salesData.push({
          date: dayName,
          sales: parseFloat(dayTotal)
        });
      }
    } else if (period === 'monthly') {
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
        
        const orders = await Order.findAll({
          where: {
            createdAt: {
              [Op.between]: [startOfMonth, endOfMonth]
            },
            status: {
              [Op.ne]: 'cancelled'
            }
          },
          attributes: [
            [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('grandTotal')), 0), 'total']
          ],
          raw: true
        });
        
        const monthTotal = orders[0].total || 0;
        
        const monthName = date.toLocaleDateString('en-US', { month: 'short' });
        
        salesData.push({
          date: monthName,
          sales: parseFloat(monthTotal)
        });
      }
    } else if (period === 'yearly') {
      for (let i = 4; i >= 0; i--) {
        const year = now.getFullYear() - i;
        
        const startOfYear = new Date(year, 0, 1);
        const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);
        
        const orders = await Order.findAll({
          where: {
            createdAt: {
              [Op.between]: [startOfYear, endOfYear]
            },
            status: {
              [Op.ne]: 'cancelled'
            }
          },
          attributes: [
            [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('grandTotal')), 0), 'total']
          ],
          raw: true
        });
        
        const yearTotal = orders[0].total || 0;
        
        salesData.push({
          date: year.toString(),
          sales: parseFloat(yearTotal)
        });
      }
    }
    
    res.status(200).json({
      success: true,
      period,
      salesData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching sales data',
      error: error.message
    });
  }
};

exports.getOrderHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    let statusFilter = [];
    if (req.query.status) {
      statusFilter = req.query.status.split(',');
    } else {
      statusFilter = ['paid', 'cancelled', 'delivered'];
    }
    
    const whereClause = {
      status: {
        [Op.in]: statusFilter
      }
    };
    
    if (req.query.search) {
      whereClause[Op.or] = [
        { orderNumber: { [Op.like]: `%${req.query.search}%` } },
        { '$User.name$': { [Op.like]: `%${req.query.search}%` } },
        { '$User.email$': { [Op.like]: `%${req.query.search}%` } }
      ];
    }
    
    if (req.query.startDate && req.query.endDate) {
      whereClause.createdAt = {
        [Op.between]: [
          new Date(req.query.startDate), 
          new Date(req.query.endDate + 'T23:59:59.999Z')
        ]
      };
    } else if (req.query.startDate) {
      whereClause.createdAt = {
        [Op.gte]: new Date(req.query.startDate)
      };
    } else if (req.query.endDate) {
      whereClause.createdAt = {
        [Op.lte]: new Date(req.query.endDate + 'T23:59:59.999Z')
      };
    }
    
    const { count, rows: orders } = await Order.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email', 'phone', 'profileImage']
        },
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
          attributes: ['id', 'method', 'status', 'amount', 'transactionId']
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
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching order history',
      error: error.message
    });
  }
};
  
exports.getAllOrders = async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      const status = req.query.status;
      const paymentStatus = req.query.paymentStatus;
      const startDate = req.query.startDate;
      const endDate = req.query.endDate;
      
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
            attributes: ['id', 'name', 'email', 'profileImage']
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
      
      res.status(200).json({
        success: true,
        count,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: count,
          limit
        },
        data: orders
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching orders',
        error: error.message
      });
    }
  };
  
exports.getMyOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const status = req.query.status;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    
    const whereClause = { userId: req.user.id };
    
    if (status && status !== 'all') {
      whereClause.status = status;
    }
    
    if (startDate && endDate) {
      console.log(`Date filter applied: ${startDate} to ${endDate}`);
      whereClause.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      console.log(`Date filter applied: After ${startDate}`);
      whereClause.createdAt = {
        [Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      console.log(`Date filter applied: Before ${endDate}`);
      whereClause.createdAt = {
        [Op.lte]: new Date(endDate)
      };
    }
    
    const totalCount = await Order.count({ where: whereClause });
    
    const { rows: orders } = await Order.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: OrderItem,
          attributes: ['id', 'productId', 'quantity', 'price', 'totalPrice', 'productName'],
          include: [
            {
              model: Product,
              attributes: ['id', 'name', 'imageUrl', 'stock', 'price']
            }
          ]
        },
        {
          model: Payment,
          attributes: ['id', 'method', 'status', 'amount']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });
    
    const totalPages = Math.ceil(totalCount / limit);
    
    res.status(200).json({
      success: true,
      count: totalCount,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalCount,
        limit
      },
      data: orders
    });
  } catch (error) {
    console.error('Order fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
};

exports.generateSnapToken = async (req, res) => {
    try {
      const midtransResponse = await midtransService.createTransaction(
        orderData, items, customerData
      );
      
      return res.status(200).json({
        success: true,
        token: midtransResponse.token,
        redirect_url: midtransResponse.redirect_url
      });
    } catch (error) {
      console.error('Error generating Snap token:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate payment token',
        error: error.message
      });
    }
  };

exports.getOrderByNumber = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    
    if (orderNumber.startsWith('TEMP_')) {
      const userId = orderNumber.split('_').pop();
      
      const recentOrder = await Order.findOne({
        where: { userId },
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: OrderItem,
            include: [{ model: Product }]
          },
          { model: User },
          { model: Payment }
        ]
      });
      
      if (recentOrder) {
        return res.status(200).json({
          success: true,
          data: recentOrder
        });
      }
      
      return res.status(404).json({
        success: false,
        message: 'New order has not been created yet'
      });
    }
    
    const order = await Order.findOne({
      where: { orderNumber },
      include: [
      ]
    });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching order',
      error: error.message
    });
  }
};
  
exports.getOrderById = async (req, res) => {
    try {
      const order = await Order.findByPk(req.params.id, {
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
            attributes: ['id', 'name', 'email', 'phone', 'profileImage']
          },
          {
            model: Payment,
            attributes: ['id', 'method', 'status', 'amount', 'transactionId', 'paymentDate', 'gatewayResponse']
          }
        ]
      });
      
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }
      
      res.status(200).json({
        success: true,
        data: order
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching order',
        error: error.message
      });
    }
  };
  
exports.getMyOrderById = async (req, res) => {
    try {
      const order = await Order.findOne({
        where: {
          id: req.params.id,
          userId: req.user.id
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
            model: User,
            attributes: ['id', 'name', 'email', 'phone', 'profileImage']
          },
          {
            model: Payment,
            attributes: ['id', 'method', 'status', 'amount', 'transactionId', 'paymentDate']
          }
        ]
      });
      
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }
      
      res.status(200).json({
        success: true,
        data: order
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching order',
        error: error.message
      });
    }
  };
  
exports.cancelOrder = async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
      const order = await Order.findOne({
        where: {
          id: req.params.id,
          userId: req.user.id
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
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }
      
      if (!['pending', 'processing'].includes(order.status)) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Cannot cancel order with status: ${order.status}`
        });
      }
      
      await order.update(
        { status: 'cancelled' },
        { transaction }
      );
      
      await Payment.update(
        { status: 'refunded' },
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
      
      res.status(200).json({
        success: true,
        message: 'Order cancelled successfully',
        data: updatedOrder
      });
    } catch (error) {
      await transaction.rollback();
      
      res.status(500).json({
        success: false,
        message: 'Error cancelling order',
        error: error.message
      });
    }
  };
  
exports.updateOrderStatus = async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
      const { status, paymentStatus, transactionId, paymentMethod } = req.body;
      const orderId = req.params.id;
      
      console.log(`Updating order ${orderId} with status: ${status}, payment: ${paymentStatus}`);
      
      const order = await Order.findByPk(orderId, { transaction });
      
      if (!order) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }
      
      await order.update({ 
        status: status || order.status, 
        paymentStatus: paymentStatus || order.paymentStatus,
        paymentMethod: paymentMethod || order.paymentMethod
      }, { transaction });
      
      let payment = await Payment.findOne({ 
        where: { orderId },
        transaction
      });
      
      let paymentDbStatus;
      if (paymentStatus === 'paid') {
        paymentDbStatus = 'completed';
      } else if (paymentStatus === 'pending' || paymentStatus === 'failed' || paymentStatus === 'refunded') {
        paymentDbStatus = paymentStatus;
      } else {
        paymentDbStatus = 'pending';
      }
      
      console.log(`Status saved to Payment: ${paymentDbStatus}`);
      
      if (payment) {
        await payment.update({
          status: paymentDbStatus,
          transactionId: transactionId || payment.transactionId,
          paymentDate: paymentStatus === 'paid' ? new Date() : payment.paymentDate,
          method: paymentMethod || payment.method
        }, { transaction });
      } else if (paymentStatus) {
        await Payment.create({
          orderId,
          amount: order.grandTotal,
          method: paymentMethod || 'bank_transfer',
          status: paymentDbStatus,
          transactionId: transactionId || null,
          paymentDate: paymentStatus === 'paid' ? new Date() : null
        }, { transaction });
      }
      
      await transaction.commit();
      
      return res.status(200).json({
        success: true,
        message: 'Order status updated successfully',
        data: { id: order.id, orderNumber: order.orderNumber, status: order.status, paymentStatus: order.paymentStatus }
      });
    } catch (error) {
      await transaction.rollback();
      
      console.error('Error updating order status:', error);
      console.error('Error stack:', error.stack);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to update order status',
        error: error.message
      });
    }
  };
  
exports.updatePaymentStatus = async (req, res) => {
    try {
      const { paymentStatus } = req.body;
      
      const validStatuses = ['pending', 'paid', 'failed', 'refunded'];
      
      if (!paymentStatus || !validStatuses.includes(paymentStatus)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid payment status'
        });
      }
      
      const order = await Order.findByPk(req.params.id);
      
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }
      
      await order.update({ paymentStatus });
      
      const payment = await Payment.findOne({ where: { orderId: order.id } });
      
      if (payment) {
        await payment.update({
          status: paymentStatus === 'paid' ? 'paid' : paymentStatus,
          paymentDate: paymentStatus === 'paid' ? new Date() : payment.paymentDate
        });
      }
      
      const updatedOrder = await Order.findByPk(order.id, {
        include: [
          {
            model: Payment,
            attributes: ['id', 'method', 'status', 'amount', 'paymentDate']
          }
        ]
      });
      
      res.status(200).json({
        success: true,
        message: 'Payment status updated successfully',
        data: updatedOrder
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating payment status',
        error: error.message
      });
    }
  };
  
exports.updateTrackingInfo = async (req, res) => {
    try {
      const { trackingNumber, estimatedDelivery } = req.body;
      
      const order = await Order.findByPk(req.params.id);
      
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }
      
      await order.update({
        trackingNumber: trackingNumber || order.trackingNumber,
        estimatedDelivery: estimatedDelivery || order.estimatedDelivery
      });
      
      if (trackingNumber && order.status === 'pending') {
        await order.update({ status: 'processing' });
      }
      
      res.status(200).json({
        success: true,
        message: 'Tracking information updated successfully',
        data: order
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating tracking information',
        error: error.message
      });
    }
  };