const { Review, Product, User, Order, OrderItem } = require('../models');
const { Op } = require('sequelize');
const uploadMiddleware = require('../middlewares/uploadMiddleware');
const { PAGINATION } = require('../utils/constants');
const sequelize = require('../config/database');

exports.getProductReviews = async (productId, params) => {
  try {
    const page = parseInt(params.page) || PAGINATION.DEFAULT_PAGE;
    const limit = parseInt(params.limit) || 5;
    const offset = (page - 1) * limit;
    const product = await Product.findByPk(productId);
    if (!product) {
      throw new Error('Product not found');
    }
    const { count, rows: reviews } = await Review.findAndCountAll({
      where: { 
        productId,
        isActive: true
      },
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'profileImage']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });
    const avgRating = await Review.findOne({
      where: { 
        productId,
        isActive: true
      },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('rating')), 'avgRating'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalReviews']
      ],
      raw: true
    });
    const ratingBreakdown = await Review.findAll({
      where: { 
        productId,
        isActive: true
      },
      attributes: [
        'rating',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['rating'],
      raw: true
    });
    const formattedBreakdown = {};
    ratingBreakdown.forEach(item => {
      formattedBreakdown[item.rating] = parseInt(item.count);
    });
    const verifiedCount = await Review.count({
      where: {
        productId,
        isActive: true,
        isVerifiedPurchase: true
      }
    });
    const verifiedPercentage = count > 0 ? (verifiedCount / count) * 100 : 0;
    const totalPages = Math.ceil(count / limit);
    return {
      reviews,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: count,
        limit
      },
      statistics: {
        avgRating: avgRating.avgRating ? parseFloat(avgRating.avgRating).toFixed(1) : 0,
        totalReviews: parseInt(avgRating.totalReviews) || 0,
        verifiedPercentage: parseFloat(verifiedPercentage.toFixed(1)),
        breakdown: formattedBreakdown
      }
    };
  } catch (error) {
    throw error;
  }
};

exports.createReview = async (userId, reviewData, files) => {
  try {
    const { productId, rating, title, comment, orderId } = reviewData;
    if (!productId || !rating) {
      throw new Error('Product ID and rating are required');
    }
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }
    const product = await Product.findByPk(productId);
    if (!product) {
      throw new Error('Product not found');
    }
    const existingReview = await Review.findOne({
      where: {
        userId,
        productId
      }
    });
    if (existingReview) {
      throw new Error('You have already reviewed this product');
    }
    let isVerifiedPurchase = false;
    let verifiedOrderId = null;
    if (orderId) {
      const orderItem = await OrderItem.findOne({
        where: {
          productId
        },
        include: [
          {
            model: Order,
            where: {
              id: orderId,
              userId,
              status: 'delivered'
            }
          }
        ]
      });
      isVerifiedPurchase = !!orderItem;
      verifiedOrderId = orderId;
    } else {
      const orderItem = await OrderItem.findOne({
        where: {
          productId
        },
        include: [
          {
            model: Order,
            where: {
              userId,
              status: 'delivered'
            }
          }
        ]
      });
      isVerifiedPurchase = !!orderItem;
      verifiedOrderId = orderItem ? orderItem.Order.id : null;
    }
    let images = [];
    if (files && files.length > 0) {
      for (const file of files) {
        const result = await uploadMiddleware.uploadToCloudinary(
          file.path, 
          'reviews'
        );
        images.push({
          url: result.url,
          publicId: result.publicId
        });
      }
    }
    const review = await Review.create({
      userId,
      productId,
      orderId: verifiedOrderId,
      rating,
      title,
      comment,
      images,
      isVerifiedPurchase,
      isRecommended: rating >= 4
    });
    const createdReview = await Review.findByPk(review.id, {
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'profileImage']
        }
      ]
    });
    return createdReview;
  } catch (error) {
    throw error;
  }
};

exports.updateReview = async (id, userId, reviewData, files) => {
  try {
    const { rating, title, comment, isRecommended, removeImages } = reviewData;
    const review = await Review.findOne({
      where: {
        id,
        userId
      }
    });
    if (!review) {
      throw new Error('Review not found');
    }
    if (rating && (rating < 1 || rating > 5)) {
      throw new Error('Rating must be between 1 and 5');
    }
    let images = review.images || [];
    if (removeImages && removeImages.length) {
      const imagesToRemove = Array.isArray(removeImages)
        ? removeImages
        : removeImages.split(',');
      const newImages = [];
      for (const image of images) {
        if (!imagesToRemove.includes(image.publicId)) {
          newImages.push(image);
        } else {
          await uploadMiddleware.deleteFromCloudinary(image.publicId);
        }
      }
      images = newImages;
    }
    if (files && files.length > 0) {
      for (const file of files) {
        const result = await uploadMiddleware.uploadToCloudinary(
          file.path, 
          'reviews'
        );
        images.push({
          url: result.url,
          publicId: result.publicId
        });
      }
    }
    await review.update({
      rating: rating || review.rating,
      title: title !== undefined ? title : review.title,
      comment: comment !== undefined ? comment : review.comment,
      images,
      isRecommended: isRecommended !== undefined ? isRecommended : review.isRecommended
    });
    const updatedReview = await Review.findByPk(review.id, {
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'profileImage']
        }
      ]
    });
    return updatedReview;
  } catch (error) {
    throw error;
  }
};

exports.deleteReview = async (id, userId) => {
  try {
    const review = await Review.findOne({
      where: {
        id,
        userId
      }
    });
    if (!review) {
      throw new Error('Review not found');
    }
    if (review.images && review.images.length > 0) {
      for (const image of review.images) {
        if (image.publicId) {
          await uploadMiddleware.deleteFromCloudinary(image.publicId);
        }
      }
    }
    await review.destroy();
    return true;
  } catch (error) {
    throw error;
  }
};

exports.markReviewHelpful = async (id) => {
  try {
    const review = await Review.findByPk(id);
    if (!review) {
      throw new Error('Review not found');
    }
    await review.update({
      helpfulCount: review.helpfulCount + 1
    });
    return review.helpfulCount;
  } catch (error) {
    throw error;
  }
};

exports.reportReview = async (id, reason) => {
  try {
    const review = await Review.findByPk(id);
    if (!review) {
      throw new Error('Review not found');
    }
    await review.update({
      reportCount: review.reportCount + 1
    });
    let isHidden = false;
    if (review.reportCount >= 3 && review.isActive) {
      await review.update({
        isActive: false
      });
      isHidden = true;
    }
    return {
      reportCount: review.reportCount,
      isHidden
    };
  } catch (error) {
    throw error;
  }
};

exports.getAllReviews = async (params) => {
  try {
    const page = parseInt(params.page) || PAGINATION.DEFAULT_PAGE;
    const limit = parseInt(params.limit) || PAGINATION.DEFAULT_LIMIT;
    const offset = (page - 1) * limit;
    const isActive = params.isActive !== undefined ? params.isActive === 'true' : undefined;
    const reportedOnly = params.reportedOnly === 'true';
    const whereClause = {};
    if (isActive !== undefined) {
      whereClause.isActive = isActive;
    }
    if (reportedOnly) {
      whereClause.reportCount = { [Op.gt]: 0 };
    }
    const { count, rows: reviews } = await Review.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email']
        },
        {
          model: Product,
          attributes: ['id', 'name', 'imageUrl']
        }
      ],
      order: [
        [reportedOnly ? 'reportCount' : 'createdAt', 'DESC']
      ],
      limit,
      offset
    });
    const totalPages = Math.ceil(count / limit);
    return {
      reviews,
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

exports.updateReviewStatus = async (id, isActive) => {
  try {
    const review = await Review.findByPk(id);
    if (!review) {
      throw new Error('Review not found');
    }
    await review.update({
      isActive,
      reportCount: isActive ? 0 : review.reportCount
    });
    return review;
  } catch (error) {
    throw error;
  }
};

exports.respondToReview = async (id, response) => {
  try {
    if (!response) {
      throw new Error('Response is required');
    }
    const review = await Review.findByPk(id);
    if (!review) {
      throw new Error('Review not found');
    }
    await review.update({
      adminResponse: response,
      adminResponseDate: new Date()
    });
    return review;
  } catch (error) {
    throw error;
  }
};

exports.getReviewStatistics = async () => {
  try {
    const totalReviews = await Review.count();
    const avgRating = await Review.findOne({
      attributes: [
        [sequelize.fn('AVG', sequelize.col('rating')), 'avgRating']
      ],
      raw: true
    });
    const ratingsDistribution = await Review.findAll({
      attributes: [
        'rating',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['rating'],
      order: [['rating', 'DESC']],
      raw: true
    });
    const reportedCount = await Review.count({
      where: {
        reportCount: { [Op.gt]: 0 }
      }
    });
    const verifiedCount = await Review.count({
      where: {
        isVerifiedPurchase: true
      }
    });
    const verifiedPercentage = totalReviews > 0 ? (verifiedCount / totalReviews) * 100 : 0;
    const formattedDistribution = {};
    ratingsDistribution.forEach(item => {
      formattedDistribution[item.rating] = parseInt(item.count);
    });
    return {
      totalReviews,
      avgRating: avgRating.avgRating ? parseFloat(avgRating.avgRating).toFixed(1) : 0,
      ratingsDistribution: formattedDistribution,
      reportedCount,
      verifiedCount,
      verifiedPercentage: parseFloat(verifiedPercentage.toFixed(1))
    };
  } catch (error) {
    throw error;
  }
};