const cron = require('node-cron');
const { Order, OrderItem, User } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

class OrderCleanupService {
  constructor() {
    this.scheduledTask = cron.schedule('*/15 * * * *', async () => {
      console.log('Running order cleanup task...');
      await this.cleanupPendingOrders();
    });
  }

  async cleanupPendingOrders() {
    const transaction = await sequelize.transaction();
    try {
      const pendingOrders = await Order.findAll({
        where: {
          status: 'pending',
          paymentStatus: 'pending',
          createdAt: {
            [Op.lt]: new Date(Date.now() - 60 * 60 * 1000)
          }
        },
        include: [
          {
            model: OrderItem,
            as: 'OrderItems'
          },
          {
            model: User,
            attributes: ['id', 'name', 'email']
          }
        ],
        transaction
      });

      console.log(`Found ${pendingOrders.length} expired pending orders`);

      for (const order of pendingOrders) {
        await order.update(
          { 
            status: 'cancelled', 
            paymentStatus: 'failed',
            notes: order.notes 
              ? `${order.notes} | Automatically cancelled due to payment timeout (1 hour)` 
              : 'Automatically cancelled due to payment timeout (1 hour)'
          }, 
          { transaction }
        );
        console.log(`Order ${order.orderNumber} has been automatically cancelled`);
      }

      await transaction.commit();
      console.log('Order cleanup finished');
    } catch (error) {
      await transaction.rollback();
      console.error('Error during order cleanup:', error);
      console.error('Stack trace:', error.stack);
    }
  }

  start() {
    this.scheduledTask.start();
    console.log('Order cleanup service started');
    return this;
  }

  stop() {
    this.scheduledTask.stop();
    console.log('Order cleanup service stopped');
    return this;
  }

  async triggerCleanup() {
    console.log('Manually triggering order cleanup...');
    await this.cleanupPendingOrders();
    return { success: true, message: 'Order cleanup executed successfully' };
  }
}

module.exports = new OrderCleanupService();