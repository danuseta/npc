const { Op } = require('sequelize');
const jwt = require('jsonwebtoken');
const { User, EmailVerification } = require('../models');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/emailService');
const uploadMiddleware = require('../middlewares/uploadMiddleware');
const fs = require('fs');
require('dotenv').config();

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      phone,
      address,
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

    res.status(201).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified
      },
      token,
      message: 'Registration successful. Please check your email for verification code.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error in user registration',
      error: error.message
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Please contact admin.'
      });
    }

    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user.id);

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified
      },
      token
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error in user login',
      error: error.message
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const { name, phone, dateOfBirth, gender } = req.body;

    user.name = name || user.name;
    user.phone = phone || user.phone;
    
    if (dateOfBirth === '') {
      user.dateOfBirth = null;
    } else if (dateOfBirth) {
      user.dateOfBirth = dateOfBirth;
    }
    
    if (gender === '') {
      user.gender = null;
    } else if (gender) {
      user.gender = gender;
    }

    if (req.file) {
      console.log('Profile image file received:', req.file.path);
      try {
        const result = await uploadMiddleware.uploadToCloudinary(
          req.file.path, 
          'users/profile'
        );

        console.log('Cloudinary upload result:', result);

        if (user.profileImagePublicId) {
          try {
            await uploadMiddleware.deleteFromCloudinary(user.profileImagePublicId);
          } catch (deleteError) {
            console.error('Error deleting previous image from Cloudinary:', deleteError);
          }
        }

        user.profileImage = result.url;
        user.profileImagePublicId = result.publicId;
      } catch (uploadError) {
        console.error('Error uploading to Cloudinary:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Error uploading profile image',
          error: uploadError.message
        });
      }
    }

    await user.save();

    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      role: user.role,
      profileImage: user.profileImage,
      profileImagePublicId: user.profileImagePublicId,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt
    };

    res.status(200).json({
      success: true,
      data: userData,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    if (
      user.emailVerificationCode !== code ||
      !user.emailVerificationExpire ||
      new Date() > new Date(user.emailVerificationExpire)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code'
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationCode = null;
    user.emailVerificationExpire = null;
    await user.save();

    await EmailVerification.update(
      { isUsed: true },
      { where: { userId: user.id, code } }
    );

    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error verifying email',
      error: error.message
    });
  }
};

exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
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

    res.status(200).json({
      success: true,
      message: 'Verification code resent successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error resending verification code',
      error: error.message
    });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const resetToken = user.generatePasswordResetToken();
    await user.save();

    await sendPasswordResetEmail(user.email, resetToken, user.name);

    res.status(200).json({
      success: true,
      message: 'Password reset link sent to your email'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error processing forgot password request',
      error: error.message
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    
    console.log('Received reset token:', token);
    
    const user = await User.findOne({
      where: { resetPasswordToken: token }
    });
    
    console.log('User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }
    
    console.log('Token expiration time:', user.resetPasswordExpire);
    console.log('Current time:', new Date());
    
    if (!user.resetPasswordExpire || new Date() > new Date(user.resetPasswordExpire)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password',
      error: error.message
    });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: [
        'id', 
        'name', 
        'email', 
        'phone', 
        'address', 
        'city', 
        'state', 
        'zipCode',
        'country',
        'role', 
        'profileImage', 
        'dateOfBirth',
        'gender',
        'isEmailVerified',
        'createdAt'
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting current user',
      error: error.message
    });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    await user.destroy();
    
    res.status(200).json({
      success: true,
      message: 'Account successfully deleted'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting account',
      error: error.message
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error changing password',
      error: error.message
    });
  }
};

exports.logout = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'User logged out successfully'
  });
};