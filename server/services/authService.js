const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User, EmailVerification } = require('../models');
const { JWT, EMAIL_VERIFICATION, PASSWORD_RESET } = require('../utils/constants');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/emailService');
const crypto = require('crypto');

exports.register = async (userData) => {
  try {
    const existingUser = await User.findOne({ where: { email: userData.email } });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }
    const user = await User.create({
      name: userData.name,
      email: userData.email,
      password: userData.password,
      phone: userData.phone,
      role: 'buyer'
    });
    const verificationCode = user.generateEmailVerificationCode();
    await user.save();
    await EmailVerification.create({
      userId: user.id,
      email: user.email,
      code: verificationCode,
      expiresAt: user.emailVerificationExpire
    });
    await sendVerificationEmail(user.email, verificationCode, user.name);
    const token = generateToken(user.id);
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified
      },
      token
    };
  } catch (error) {
    throw error;
  }
};

exports.login = async (email, password) => {
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new Error('Invalid credentials');
    }
    if (!user.isActive) {
      throw new Error('Your account has been deactivated. Please contact admin.');
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }
    user.lastLogin = new Date();
    await user.save();
    const token = generateToken(user.id);
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified
      },
      token
    };
  } catch (error) {
    throw error;
  }
};

exports.verifyEmail = async (email, code) => {
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new Error('User not found');
    }
    if (user.isEmailVerified) {
      throw new Error('Email is already verified');
    }
    if (
      user.emailVerificationCode !== code ||
      !user.emailVerificationExpire ||
      new Date() > new Date(user.emailVerificationExpire)
    ) {
      throw new Error('Invalid or expired verification code');
    }
    user.isEmailVerified = true;
    user.emailVerificationCode = null;
    user.emailVerificationExpire = null;
    await user.save();
    await EmailVerification.update(
      { isUsed: true },
      { where: { userId: user.id, code } }
    );
    return true;
  } catch (error) {
    throw error;
  }
};

exports.resendVerification = async (email) => {
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new Error('User not found');
    }
    if (user.isEmailVerified) {
      throw new Error('Email is already verified');
    }
    const verificationCode = user.generateEmailVerificationCode();
    await user.save();
    await EmailVerification.create({
      userId: user.id,
      email: user.email,
      code: verificationCode,
      expiresAt: user.emailVerificationExpire
    });
    await sendVerificationEmail(user.email, verificationCode, user.name);
    return true;
  } catch (error) {
    throw error;
  }
};

exports.forgotPassword = async (email) => {
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new Error('User not found');
    }
    const resetToken = user.generatePasswordResetToken();
    await user.save();
    await sendPasswordResetEmail(user.email, resetToken, user.name);
    return true;
  } catch (error) {
    throw error;
  }
};

exports.resetPassword = async (token, password) => {
  try {
    const user = await User.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpire: { [Op.gt]: Date.now() }
      }
    });
    if (!user) {
      throw new Error('Invalid or expired reset token');
    }
    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;
    await user.save();
    return true;
  } catch (error) {
    throw error;
  }
};

exports.changePassword = async (userId, currentPassword, newPassword) => {
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new Error('Current password is incorrect');
    }
    user.password = newPassword;
    await user.save();
    return true;
  } catch (error) {
    throw error;
  }
};

exports.getCurrentUser = async (userId) => {
  try {
    const user = await User.findByPk(userId, {
      attributes: {
        exclude: ['password', 'resetPasswordToken', 'resetPasswordExpire', 'emailVerificationToken', 'emailVerificationCode', 'emailVerificationExpire']
      }
    });
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  } catch (error) {
    throw error;
  }
};

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT.SECRET, {
    expiresIn: JWT.EXPIRES_IN
  });
};