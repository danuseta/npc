const { User, AdminActivity, SystemLog, Order, Product, Category, OrderItem } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

exports.getAdmins = async (req, res) => {
  try {
    console.log("getAdmins requested with query params:", req.query);
    const { page = 1, limit = 10, search = '', status = 'all' } = req.query;
    const skip = (page - 1) * limit;
    const query = { role: { [Op.in]: ['admin', 'superadmin'] } };
    if (status !== 'all') {
      query.isActive = status === 'active';
    }
    if (search) {
      query[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } }
      ];
    }
    console.log("Executing query with params:", query);
    const admins = await User.findAndCountAll({
      where: query,
      limit: parseInt(limit),
      offset: skip,
      attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpire'] },
      order: [['createdAt', 'DESC']]
    });
    console.log(`Found ${admins.count} admins matching criteria`);
    const totalPages = Math.ceil(admins.count / limit);
    res.status(200).json({
      success: true,
      data: {
        admins: admins.rows,
        totalItems: admins.count,
        totalPages,
        currentPage: parseInt(page)
      }
    });
  } catch (error) {
    console.error('Error fetching admins:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching admins',
      error: error.message
    });
  }
};

exports.getAdminById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`getAdminById requested for ID: ${id}`);
    const admin = await User.findOne({
      where: { 
        id,
        role: { [Op.in]: ['admin', 'superadmin'] }
      },
      attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpire'] }
    });
    if (!admin) {
      console.log(`Admin with ID ${id} not found`);
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }
    console.log(`Admin found: ${admin.name}`);
    res.status(200).json({
      success: true,
      data: admin
    });
  } catch (error) {
    console.error('Error fetching admin:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching admin',
      error: error.message
    });
  }
};

exports.createAdmin = async (req, res) => {
  try {
    const { name, email, password, phone, department, role, permissions } = req.body;
    console.log(`Creating new admin: ${name}, ${email}, role: ${role}`);
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      console.log(`Email ${email} already in use`);
      return res.status(400).json({
        success: false,
        message: 'Email already in use'
      });
    }
    const admin = await User.create({
      name,
      email,
      password,
      phone,
      role: role === 'superadmin' ? 'superadmin' : 'admin',
      department,
      permissions: JSON.stringify(permissions),
      isActive: true,
      isEmailVerified: true
    });
    console.log(`Admin created successfully with ID: ${admin.id}`);
    await AdminActivity.create({
      userId: req.user.id,
      action: 'CREATE_ADMIN',
      details: `Created new admin: ${name} (${email})`,
      entityType: 'User',
      entityId: admin.id,
      ipAddress: req.ip
    });
    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      data: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Error creating admin:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating admin',
      error: error.message
    });
  }
};

exports.updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, department, role, permissions } = req.body;
    console.log(`Updating admin ID ${id}: ${name}, ${email}`);
    const admin = await User.findOne({
      where: { 
        id,
        role: { [Op.in]: ['admin', 'superadmin'] }
      }
    });
    if (!admin) {
      console.log(`Admin with ID ${id} not found for update`);
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }
    if (email !== admin.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        console.log(`Email ${email} already in use by another user`);
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }
    }
    admin.name = name;
    admin.email = email;
    admin.phone = phone;
    admin.department = department;
    admin.role = role === 'superadmin' ? 'superadmin' : 'admin';
    admin.permissions = JSON.stringify(permissions);
    await admin.save();
    console.log(`Admin ${id} updated successfully`);
    await AdminActivity.create({
      userId: req.user.id,
      action: 'UPDATE_ADMIN',
      details: `Updated admin: ${name} (${email})`,
      entityType: 'User',
      entityId: admin.id,
      ipAddress: req.ip
    });
    res.status(200).json({
      success: true,
      message: 'Admin updated successfully',
      data: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Error updating admin:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating admin',
      error: error.message
    });
  }
};

exports.deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Deleting admin ID: ${id}`);
    const admin = await User.findOne({
      where: { 
        id,
        role: { [Op.in]: ['admin', 'superadmin'] }
      }
    });
    if (!admin) {
      console.log(`Admin with ID ${id} not found for deletion`);
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }
    const adminName = admin.name;
    const adminEmail = admin.email;
    await admin.destroy();
    console.log(`Admin ${id} deleted successfully`);
    await AdminActivity.create({
      userId: req.user.id,
      action: 'DELETE_ADMIN',
      details: `Deleted admin: ${adminName} (${adminEmail})`,
      entityType: 'User',
      entityId: id,
      ipAddress: req.ip
    });
    res.status(200).json({
      success: true,
      message: 'Admin deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting admin:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting admin',
      error: error.message
    });
  }
};

exports.updateAdminStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const admin = await User.findOne({
      where: { 
        id,
        role: { [Op.in]: ['admin', 'superadmin'] }
      }
    });
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }
    admin.isActive = status === 'active';
    await admin.save();
    await AdminActivity.create({
      userId: req.user.id,
      action: status === 'active' ? 'ACTIVATE_ADMIN' : 'DEACTIVATE_ADMIN',
      details: `${status === 'active' ? 'Activated' : 'Deactivated'} admin: ${admin.name} (${admin.email})`,
      entityType: 'User',
      entityId: admin.id,
      ipAddress: req.ip
    });
    res.status(200).json({
      success: true,
      message: `Admin ${status === 'active' ? 'activated' : 'deactivated'} successfully`,
      data: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        isActive: admin.isActive
      }
    });
  } catch (error) {
    console.error('Error updating admin status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating admin status',
      error: error.message
    });
  }
};

exports.getAdminActivities = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    const admin = await User.findOne({
      where: { 
        id,
        role: { [Op.in]: ['admin', 'superadmin'] }
      }
    });
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }
    const activities = await AdminActivity.findAndCountAll({
      where: { userId: id },
      limit: parseInt(limit),
      offset: skip,
      order: [['createdAt', 'DESC']]
    });
    res.status(200).json({
      success: true,
      data: {
        activities: activities.rows,
        totalItems: activities.count,
        totalPages: Math.ceil(activities.count / limit),
        currentPage: parseInt(page)
      }
    });
  } catch (error) {
    console.error('Error fetching admin activities:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching admin activities',
      error: error.message
    });
  }
};

exports.getTopAdmins = async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    const admins = await User.findAll({
      where: { 
        role: { [Op.in]: ['admin', 'superadmin'] },
        isActive: true
      },
      attributes: ['id', 'name', 'email', 'phone', 'role', 'createdAt', 'lastLogin'],
      limit: parseInt(limit)
    });
    const adminIds = admins.map(admin => admin.id);
    const orderActivities = await AdminActivity.findAll({
      attributes: [
        'userId',
        [sequelize.fn('COUNT', sequelize.col('id')), 'orderCount']
      ],
      where: {
        userId: { [Op.in]: adminIds },
        [Op.or]: [
          { action: { [Op.like]: '%ORDER%' } },
          { entityType: 'Order' }
        ]
      },
      group: ['userId']
    });
    const orderCounts = {};
    orderActivities.forEach(activity => {
      orderCounts[activity.userId] = parseInt(activity.getDataValue('orderCount') || 0);
    });
    const responseTimes = await sequelize.query(`
      SELECT 
        a1.userId, 
        AVG(TIMESTAMPDIFF(HOUR, o.createdAt, a1.createdAt)) as avgResponseTime
      FROM AdminActivities a1
      JOIN orders o ON a1.entityId = o.id
      WHERE 
        a1.userId IN (${adminIds.join(',')})
        AND a1.entityType = 'Order'
        AND a1.action IN ('UPDATE_ORDER', 'PROCESS_ORDER')
      GROUP BY a1.userId
    `, {
      type: sequelize.QueryTypes.SELECT
    });
    const responseTimeMap = {};
    responseTimes.forEach(item => {
      responseTimeMap[item.userId] = parseFloat(item.avgResponseTime || 0).toFixed(1);
    });
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentOrderCounts = await AdminActivity.findAll({
      attributes: [
        'userId',
        [sequelize.fn('COUNT', sequelize.col('id')), 'recentOrderCount']
      ],
      where: {
        userId: { [Op.in]: adminIds },
        createdAt: { [Op.gte]: thirtyDaysAgo },
        [Op.or]: [
          { action: { [Op.like]: '%ORDER%' } },
          { entityType: 'Order' }
        ]
      },
      group: ['userId']
    });
    const recentOrderCountsMap = {};
    recentOrderCounts.forEach(activity => {
      recentOrderCountsMap[activity.userId] = parseInt(activity.getDataValue('recentOrderCount') || 0);
    });
    admins.sort((a, b) => {
      const countA = recentOrderCountsMap[a.id] || 0;
      const countB = recentOrderCountsMap[b.id] || 0;
      return countB - countA;
    });
    const formattedAdmins = admins.map(admin => {
      const ordersProcessed = orderCounts[admin.id] || 0;
      const responseTime = responseTimeMap[admin.id] || "0.0";
      return {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        ordersProcessed: ordersProcessed,
        responseTime: responseTime,
        lastLogin: admin.lastLogin
      };
    });
    res.status(200).json({
      success: true,
      data: formattedAdmins
    });
  } catch (error) {
    console.error('Error fetching top admins:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching top admins',
      error: error.message
    });
  }
};

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
    const adminCount = await User.count({
      where: {
        role: {
          [Op.in]: ['admin', 'superadmin']
        },
        isActive: true
      }
    });
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
    const conversionRate = 3.5;
    const systemUptime = 99.98;
    const recentCustomersRaw = await User.findAll({
      where: { role: 'buyer' },
      attributes: ['id', 'name', 'email', 'createdAt', 'profileImage'],
      limit: 5,
      order: [['createdAt', 'DESC']]
    });
    const customerIds = recentCustomersRaw.map(customer => customer.id);
    const customerSpending = await sequelize.query(`
      SELECT 
        o.userId, 
        SUM(o.grandTotal) as totalSpent
      FROM orders o
      WHERE 
        o.userId IN (${customerIds.join(',')})
        AND o.status NOT IN ('cancelled')
        AND o.paymentStatus = 'paid'
      GROUP BY o.userId
    `, {
      type: sequelize.QueryTypes.SELECT
    });
    const spendingMap = {};
    customerSpending.forEach(item => {
      spendingMap[item.userId] = parseFloat(item.totalSpent || 0);
    });
    const formattedRecentCustomers = recentCustomersRaw.map(customer => ({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      profileImage: customer.profileImage,
      registeredDate: customer.createdAt,
      totalSpent: spendingMap[customer.id] || 0
    }));
    const salesByCategory = await sequelize.query(`
SELECT 
  c.name as category, 
  SUM(oi.totalPrice) as totalAmount
FROM orderitems oi
LEFT JOIN Products p ON oi.productId = p.id
LEFT JOIN Categories c ON p.categoryId = c.id
LEFT JOIN orders o ON oi.orderId = o.id
WHERE o.status NOT IN ('cancelled')
GROUP BY p.categoryId, c.name
ORDER BY SUM(oi.totalPrice) DESC
LIMIT 5
    `, {
      type: sequelize.QueryTypes.SELECT
    });
    const formattedSalesByCategory = salesByCategory.map(item => {
      const categoryName = item.category || 'Uncategorized';
      const amount = parseFloat(item.totalAmount || 0);
      return {
        category: categoryName,
        amount: amount,
        percentage: totalSales > 0 ? Math.round((amount / totalSales) * 100) : 0
      };
    });

    res.status(200).json({
      success: true,
      data: {
        totalSales,
        totalOrders,
        totalProducts,
        totalCustomers,
        adminCount,
        avgOrderValue,
        conversionRate,
        systemUptime,
        recentCustomers: formattedRecentCustomers,
        salesByCategory: formattedSalesByCategory
      }
    });
  } catch (error) {
    console.error('Error fetching superadmin dashboard summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching superadmin dashboard summary',
      error: error.message
    });
  }
};

exports.getSalesData = async (req, res) => {
  try {
    const period = req.query.period || 'weekly';
    let salesData = [];
    if (period === 'weekly') {
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
        const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
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
            },
            paymentStatus: 'paid'
          }
        });
        const salesValue = parseFloat(result.getDataValue('sales') || 0);
        console.log(`Sales for ${date.toLocaleDateString()}: ${salesValue}`);
        const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
        salesData.push({
          date: dayOfWeek,
          sales: salesValue
        });
      }
    } else if (period === 'monthly') {
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        startOfMonth.setHours(startOfMonth.getHours() - 12);
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
        endOfMonth.setHours(endOfMonth.getHours() + 12);
        console.log(`Querying monthly orders for ${startOfMonth.toISOString()} to ${endOfMonth.toISOString()}`);
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
        const salesValue = parseFloat(result.getDataValue('sales') || 0);
        console.log(`Sales for ${date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}: ${salesValue}`);
        const monthName = date.toLocaleDateString('en-US', { month: 'short' });
        salesData.push({
          date: monthName,
          sales: salesValue
        });
      }
    } else if (period === 'yearly') {
      for (let i = 4; i >= 0; i--) {
        const date = new Date();
        date.setFullYear(date.getFullYear() - i);
        const startOfYear = new Date(date.getFullYear(), 0, 1);
        startOfYear.setHours(startOfYear.getHours() - 12);
        const endOfYear = new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
        endOfYear.setHours(endOfYear.getHours() + 12);
        console.log(`Querying yearly orders for ${startOfYear.toISOString()} to ${endOfYear.toISOString()}`);
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
        const salesValue = parseFloat(result.getDataValue('sales') || 0);
        console.log(`Sales for ${date.getFullYear()}: ${salesValue}`);
        salesData.push({
          date: date.getFullYear().toString(),
          sales: salesValue
        });
      }
    }
    const hasSalesData = salesData.some(item => item.sales > 0);
    res.status(200).json({
      success: true,
      period,
      salesData: salesData
    });
  } catch (error) {
    console.error('Error fetching superadmin sales data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching superadmin sales data',
      error: error.message
    });
  }
};