const { User, Order } = require('../models');
const { Op } = require('sequelize');
const uploadMiddleware = require('../middlewares/uploadMiddleware');
const { PAGINATION } = require('../utils/constants');

exports.getAllUsers = async (params) => {
  try {
    const page = parseInt(params.page) || PAGINATION.DEFAULT_PAGE;
    const limit = parseInt(params.limit) || PAGINATION.DEFAULT_LIMIT;
    const offset = (page - 1) * limit;
    const role = params.role;
    const search = params.search;
    const whereClause = {};
    if (role) {
      whereClause.role = role;
    }
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
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
    return {
      users,
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

exports.getUserById = async (id, isAdmin = false) => {
  try {
    const user = await User.findByPk(id, {
      attributes: {
        exclude: ['password', 'resetPasswordToken', 'resetPasswordExpire', 'emailVerificationToken', 'emailVerificationCode', 'emailVerificationExpire']
      }
    });
    if (!user) {
      throw new Error('User not found');
    }
    if (isAdmin) {
      const orderCount = await Order.count({ where: { userId: id } });
      return {
        ...user.toJSON(),
        orderCount
      };
    }
    return user;
  } catch (error) {
    throw error;
  }
};

exports.updateProfile = async (id, userData, file) => {
  try {
    const { name, phone, dateOfBirth, gender } = userData;
    const user = await User.findByPk(id);
    if (!user) {
      throw new Error('User not found');
    }
    let profileImage = user.profileImage;
    let profileImagePublicId = user.profileImagePublicId;
    if (file) {
      const result = await uploadMiddleware.uploadToCloudinary(
        file.path,
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
    const updatedUser = await User.findByPk(id, {
      attributes: {
        exclude: ['password', 'resetPasswordToken', 'resetPasswordExpire', 'emailVerificationToken', 'emailVerificationCode', 'emailVerificationExpire']
      }
    });
    return updatedUser;
  } catch (error) {
    throw error;
  }
};

exports.updateAddress = async (id, addressData) => {
  try {
    const { address, city, state, zipCode, country } = addressData;
    const user = await User.findByPk(id);
    if (!user) {
      throw new Error('User not found');
    }
    await user.update({
      address: address || user.address,
      city: city || user.city,
      state: state || user.state,
      zipCode: zipCode || user.zipCode,
      country: country || user.country
    });
    const updatedUser = await User.findByPk(id, {
      attributes: {
        exclude: ['password', 'resetPasswordToken', 'resetPasswordExpire', 'emailVerificationToken', 'emailVerificationCode', 'emailVerificationExpire']
      }
    });
    return updatedUser;
  } catch (error) {
    throw error;
  }
};

exports.updateUserStatus = async (id, isActive) => {
  try {
    const user = await User.findByPk(id);
    if (!user) {
      throw new Error('User not found');
    }
    await user.update({ isActive });
    return true;
  } catch (error) {
    throw error;
  }
};

exports.updateUserRole = async (id, role) => {
  try {
    const validRoles = ['buyer', 'admin', 'superadmin'];
    if (!role || !validRoles.includes(role)) {
      throw new Error('Invalid role');
    }
    const user = await User.findByPk(id);
    if (!user) {
      throw new Error('User not found');
    }
    await user.update({ role });
    return true;
  } catch (error) {
    throw error;
  }
};

exports.deleteUser = async (id) => {
  try {
    const user = await User.findByPk(id);
    if (!user) {
      throw new Error('User not found');
    }
    const orderCount = await Order.count({ where: { userId: id } });
    if (orderCount > 0) {
      throw new Error('Cannot delete user with orders. Deactivate the account instead.');
    }
    if (user.profileImagePublicId) {
      await uploadMiddleware.deleteFromCloudinary(user.profileImagePublicId);
    }
    await user.destroy();
    return true;
  } catch (error) {
    throw error;
  }
};

exports.getUserStatistics = async () => {
  try {
    const totalUsers = await User.count();
    const usersByRole = await User.findAll({
      attributes: [
        'role',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['role']
    });
    const activeUsers = await User.count({ where: { isActive: true } });
    const inactiveUsers = totalUsers - activeUsers;
    const recentSignups = await User.count({
      where: {
        createdAt: {
          [Op.gte]: new Date(new Date() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    });
    const statistics = {
      totalUsers,
      activeUsers,
      inactiveUsers,
      recentSignups,
      usersByRole: usersByRole.reduce((acc, item) => {
        acc[item.role] = parseInt(item.getDataValue('count'));
        return acc;
      }, {})
    };
    return statistics;
  } catch (error) {
    throw error;
  }
};