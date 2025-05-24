const { Order, Product, User, OrderItem, sequelize } = require('../models');
const { Op } = require('sequelize');

exports.getDashboardSummary = async (req, res) => {
  try {
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

    const totalOrders = await Order.count();

    const totalProducts = await Product.count({
      where: { isActive: true }
    });

    const totalCustomers = await User.count({
      where: { 
        role: 'buyer',
        isActive: true
      }
    });

    const recentOrders = await Order.findAll({
      include: [
        {
          model: User,
          attributes: ['name', 'email']
        }
      ],
      limit: 5,
      order: [['createdAt', 'DESC']]
    });

    const topProducts = await OrderItem.findAll({
      attributes: [
        'productId',
        'productName',
        [sequelize.fn('SUM', sequelize.col('quantity')), 'totalSold'],
        [sequelize.fn('SUM', sequelize.col('totalPrice')), 'totalRevenue']
      ],
      include: [
        {
          model: Product,
          attributes: ['id', 'name', 'imageUrl', 'price', 'stock']
        }
      ],
      group: ['productId', 'productName'],
      order: [[sequelize.fn('SUM', sequelize.col('quantity')), 'DESC']],
      limit: 4
    });

    res.status(200).json({
      success: true,
      data: {
        totalSales,
        totalOrders,
        totalProducts,
        totalCustomers,
        recentOrders: recentOrders.map(order => ({
          id: order.id,
          orderNumber: order.orderNumber,
          customerName: order.User.name,
          customerEmail: order.User.email,
          date: order.createdAt,
          total: order.grandTotal,
          status: order.status,
          items: order.items ? order.items.length : 0
        })),
        topProducts: topProducts.map(item => ({
          id: item.productId,
          name: item.productName,
          sold: parseInt(item.getDataValue('totalSold')),
          revenue: parseFloat(item.getDataValue('totalRevenue')),
          stock: item.Product ? item.Product.stock : 0,
          price: item.Product ? item.Product.price : 0,
          image: item.Product ? item.Product.imageUrl : null
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard summary',
      error: error.message
    });
  }
};

exports.getSalesData = async (req, res) => {
  try {
    const period = req.query.period || 'weekly';
    let salesData = [];
    
    const now = new Date();
    
    const dateFormat = { hour12: false };
    
    if (period === 'weekly') {
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        const startOfDay = new Date(date.setHours(0, 0, 0, 0));
        const endOfDay = new Date(date.setHours(23, 59, 59, 999));
        
        const result = await Order.findOne({
          attributes: [
            [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('grandTotal')), 0), 'sales']
          ],
          where: {
            createdAt: {
              [Op.between]: [startOfDay, endOfDay]
            },
            status: {
              [Op.notIn]: ['cancelled']
            }
          }
        });
        
        const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
        salesData.push({
          date: dayOfWeek,
          sales: parseFloat(result.getDataValue('sales') || 0)
        });
      }
    } else if (period === 'monthly') {
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
        
        const result = await Order.findOne({
          attributes: [
            [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('grandTotal')), 0), 'sales']
          ],
          where: {
            createdAt: {
              [Op.between]: [startOfMonth, endOfMonth]
            },
            status: {
              [Op.notIn]: ['cancelled']
            }
          }
        });
        
        const monthName = date.toLocaleDateString('en-US', { month: 'short' });
        salesData.push({
          date: monthName,
          sales: parseFloat(result.getDataValue('sales') || 0)
        });
      }
    } else if (period === 'yearly') {
      for (let i = 4; i >= 0; i--) {
        const date = new Date();
        date.setFullYear(date.getFullYear() - i);
        
        const startOfYear = new Date(date.getFullYear(), 0, 1);
        const endOfYear = new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
        
        const result = await Order.findOne({
          attributes: [
            [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('grandTotal')), 0), 'sales']
          ],
          where: {
            createdAt: {
              [Op.between]: [startOfYear, endOfYear]
            },
            status: {
              [Op.notIn]: ['cancelled']
            }
          }
        });
        
        salesData.push({
          date: date.getFullYear().toString(),
          sales: parseFloat(result.getDataValue('sales') || 0)
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