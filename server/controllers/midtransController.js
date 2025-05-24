const { Order, Payment, OrderItem, User, Product, Cart, CartItem } = require('../models');
const midtransService = require('../services/midtransService');
const { sendOrderConfirmationEmail } = require('../utils/emailService');
const sequelize = require('../config/database');

exports.handleNotification = async (req, res) => {
  console.log('=== WEBHOOK NOTIFICATION RECEIVED ===');
  console.log('Body:', JSON.stringify(req.body, null, 2));
  
  const transaction = await sequelize.transaction();
  
  try {
    const notification = req.body;
    const { orderId, transactionStatus, fraudStatus, paymentStatus, paymentType } = await midtransService.handleNotification(notification);
    
    console.log(`Processing notification for order ${orderId}. Status: ${transactionStatus}, Payment status: ${paymentStatus}`);
    
    const order = await Order.findOne({ 
      where: { orderNumber: orderId },
      transaction 
    });
    
    if (!order) {
      console.log(`Order not found for orderNumber: ${orderId}`);
      await transaction.rollback();
      return res.status(200).json({ success: true });
    }
    
    if (paymentStatus === 'paid' && order.paymentStatus !== 'paid') {
      console.log(`Updating order ${orderId} status to processing`);
      
      await order.update({ 
        paymentStatus: 'paid',
        status: 'processing',
        paymentMethod: paymentType || order.paymentMethod 
      }, { transaction });
      
      const payment = await Payment.findOne({ 
        where: { orderId: order.id },
        transaction 
      });
      
      if (payment) {
        await payment.update({
          status: 'completed',
          transactionId: notification.transaction_id,
          method: paymentType || payment.method,
          paymentDate: new Date(),
          gatewayResponse: JSON.stringify(notification)
        }, { transaction });
      } else {
        await Payment.create({
          orderId: order.id,
          amount: order.grandTotal,
          method: paymentType || 'bank_transfer',
          status: 'completed',
          transactionId: notification.transaction_id,
          paymentDate: new Date(),
          gatewayResponse: JSON.stringify(notification)
        }, { transaction });
      }
      
      const orderItems = await OrderItem.findAll({
        where: { orderId: order.id },
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
      
      try {
        const cart = await Cart.findOne({ 
          where: { userId: order.userId },
          transaction 
        });
        
        if (cart) {
          await CartItem.destroy({ 
            where: { cartId: cart.id },
            transaction 
          });
          
          await cart.update({
            totalItems: 0,
            totalPrice: 0
          }, { transaction });
        }
      } catch (cartError) {
        console.error('Error clearing cart:', cartError);
      }
      
      console.log(`Successfully updated order ${orderId} to processing status with payment status paid and updated product stock`);
    } else if (paymentStatus === 'failed' && order.paymentStatus !== 'failed') {
      await order.update({ 
        paymentStatus: 'failed',
        status: 'cancelled'
      }, { transaction });
      
      const payment = await Payment.findOne({ 
        where: { orderId: order.id },
        transaction 
      });
      
      if (payment) {
        await payment.update({
          status: 'failed',
          transactionId: notification.transaction_id,
          gatewayResponse: JSON.stringify(notification)
        }, { transaction });
      }
    }
    
    await transaction.commit();
    return res.status(200).json({ success: true });
  } catch (error) {
    await transaction.rollback();
    console.error('Error handling Midtrans notification:', error);
    return res.status(200).json({ success: false });
  }
};

exports.handleRecurringNotification = async (req, res) => {
  try {
    console.log('Recurring notification received:', req.body);
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error handling recurring notification:', error);
    res.status(200).json({ success: false });
  }
};

exports.handlePayAccountNotification = async (req, res) => {
  try {
    console.log('Pay account notification received:', req.body);
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error handling pay account notification:', error);
    res.status(200).json({ success: false });
  }
};

exports.finishPayment = async (req, res) => {
  try {
    const { order_id, transaction_status } = req.query;
    
    res.redirect(`/thank-you?order_id=${order_id}&status=${transaction_status}`);
  } catch (error) {
    console.error('Error handling finish redirect:', error);
    res.redirect('/payment/error');
  }
};

exports.unfinishPayment = async (req, res) => {
  try {
    const { order_id } = req.query;
    
    res.redirect(`/cart?order_id=${order_id}&status=unfinished`);
  } catch (error) {
    console.error('Error handling unfinish redirect:', error);
    res.redirect('/payment/error');
  }
};

exports.errorPayment = async (req, res) => {
  try {
    const { order_id } = req.query;
    
    res.redirect(`/payment/error?order_id=${order_id}`);
  } catch (error) {
    console.error('Error handling error redirect:', error);
    res.redirect('/payment/error');
  }
};