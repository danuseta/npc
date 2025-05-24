const { User, Order } = require('../models');
const uploadMiddleware = require('../middlewares/uploadMiddleware');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const role = req.query.role;
    const search = req.query.search;
    const status = req.query.status;
    
    const whereClause = {};
    
    if (role) {
      whereClause.role = role;
    }
    
    if (status && status !== 'all') {
      whereClause.isActive = status === 'active';
    }
    
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } }
      ];
    }
    
    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      attributes: {
        exclude: ['password', 'resetPasswordToken', 'resetPasswordExpire', 'emailVerificationToken', 'emailVerificationCode', 'emailVerificationExpire']
      },
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });
    
    const totalPages = Math.ceil(count / limit);
    
    const usersWithDetails = await Promise.all(users.map(async (user) => {
      const orderCount = await Order.count({
        where: { userId: user.id }
      });
      
      const totalSpentResult = await Order.findOne({
        where: { 
          userId: user.id,
          status: {
            [Op.notIn]: ['cancelled']
          },
          paymentStatus: 'paid'
        },
        attributes: [
          [sequelize.fn('SUM', sequelize.col('grandTotal')), 'totalSpent']
        ],
        raw: true
      });
      
      const totalSpent = totalSpentResult?.totalSpent || 0;
      
      return {
        ...user.toJSON(),
        orderCount,
        totalSpent
      };
    }));
    
    res.status(200).json({
      success: true,
      count,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: count,
        limit
      },
      data: usersWithDetails
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin' && req.user.id !== parseInt(id)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to user data'
      });
    }
    
    const user = await User.findByPk(id, {
      attributes: {
        exclude: ['password', 'resetPasswordToken', 'resetPasswordExpire', 'emailVerificationToken', 'emailVerificationCode', 'emailVerificationExpire']
      }
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (req.user.role === 'admin' || req.user.role === 'superadmin') {
      const orderCount = await Order.count({ where: { userId: id } });
      
      const totalSpentResult = await Order.findOne({
        where: { 
          userId: id,
          status: {
            [Op.notIn]: ['cancelled']
          },
          paymentStatus: 'paid'
        },
        attributes: [
          [sequelize.fn('SUM', sequelize.col('grandTotal')), 'totalSpent']
        ],
        raw: true
      });
      
      const totalSpent = totalSpentResult?.totalSpent || 0;
      
      return res.status(200).json({
        success: true,
        data: {
          ...user.toJSON(),
          orderCount,
          totalSpent
        }
      });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, dateOfBirth, gender } = req.body;
    
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    let profileImage = user.profileImage;
    let profileImagePublicId = user.profileImagePublicId;
    
    if (req.file) {
      const result = await uploadMiddleware.uploadToCloudinary(
        req.file.path,
        'users/profile'
      );
      
      if (user.profileImagePublicId) {
        await uploadMiddleware.deleteFromCloudinary(user.profileImagePublicId);
      }
      
      profileImage = result.url;
      profileImagePublicId = result.publicId;
    }
    
    await user.update({
      name: name || user.name,
      phone: phone || user.phone,
      dateOfBirth: dateOfBirth || user.dateOfBirth,
      gender: gender || user.gender,
      profileImage,
      profileImagePublicId
    });
    
    const updatedUser = await User.findByPk(req.user.id, {
      attributes: {
        exclude: ['password', 'resetPasswordToken', 'resetPasswordExpire', 'emailVerificationToken', 'emailVerificationCode', 'emailVerificationExpire']
      }
    });
    
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

exports.updateAddress = async (req, res) => {
  try {
    const { address, city, state, zipCode, country } = req.body;
    
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    await user.update({
      address: address || user.address,
      city: city || user.city,
      state: state || user.state,
      zipCode: zipCode || user.zipCode,
      country: country || user.country
    });
    
    const updatedUser = await User.findByPk(req.user.id, {
      attributes: {
        exclude: ['password', 'resetPasswordToken', 'resetPasswordExpire', 'emailVerificationToken', 'emailVerificationCode', 'emailVerificationExpire']
      }
    });
    
    res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      data: updatedUser
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating address',
      error: error.message
    });
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    if (isActive === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }
    
    if (parseInt(id) === req.user.id && !isActive) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own account'
      });
    }
    
    const user = await User.findByPk(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    await user.update({ isActive });
    
    res.status(200).json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating user status',
      error: error.message
    });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    const validRoles = ['buyer', 'admin', 'superadmin'];
    
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Valid role is required'
      });
    }
    
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot change your own role'
      });
    }
    
    const user = await User.findByPk(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    await user.update({ role });
    
    res.status(200).json({
      success: true,
      message: `User role updated to ${role} successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating user role',
      error: error.message
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }
    
    const user = await User.findByPk(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const orderCount = await Order.count({ where: { userId: id } });
    
    if (orderCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete user with orders. Deactivate the account instead.'
      });
    }
    
    if (user.profileImagePublicId) {
      await uploadMiddleware.deleteFromCloudinary(user.profileImagePublicId);
    }
    
    await user.destroy();
    
    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
};

exports.getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.count();
    
    const activeUsers = await User.count({
      where: { isActive: true }
    });
    
    const buyerCount = await User.count({
      where: { role: 'buyer' }
    });
    
    const adminCount = await User.count({
      where: { role: 'admin' }
    });
    
    const superadminCount = await User.count({
      where: { role: 'superadmin' }
    });
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const newUsers = await User.count({
      where: {
        createdAt: {
          [Op.gte]: thirtyDaysAgo
        }
      }
    });
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const currentMonthStart = new Date(currentYear, currentMonth, 1);
    const currentMonthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);
    
    const prevMonthStart = new Date(currentYear, currentMonth - 1, 1);
    const prevMonthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);
    
    const currentMonthUsers = await User.count({
      where: {
        createdAt: {
          [Op.between]: [currentMonthStart, currentMonthEnd]
        }
      }
    });
    
    const prevMonthUsers = await User.count({
      where: {
        createdAt: {
          [Op.between]: [prevMonthStart, prevMonthEnd]
        }
      }
    });
    
    let growthRate = 0;
    if (prevMonthUsers > 0) {
      growthRate = ((currentMonthUsers - prevMonthUsers) / prevMonthUsers) * 100;
    }
    
    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        buyerCount,
        adminCount,
        superadminCount,
        newUsers,
        currentMonthUsers,
        prevMonthUsers,
        growthRate
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user statistics',
      error: error.message
    });
  }
};

exports.updateUserGeneral = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    if (req.user.id != id && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Not allowed to update other user data'
      });
    }
    
    const user = await User.findByPk(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    await user.update(updates);
    
    const updatedUser = await User.findByPk(id, {
      attributes: {
        exclude: ['password', 'resetPasswordToken', 'resetPasswordExpire', 'emailVerificationToken', 'emailVerificationCode', 'emailVerificationExpire']
      }
    });
    
    res.status(200).json({
      success: true,
      message: 'User data updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user data',
      error: error.message
    });
  }
};