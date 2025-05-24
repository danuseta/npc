const { Review, Product, User, Order, OrderItem } = require('../models');
const { Op } = require('sequelize');
const uploadMiddleware = require('../middlewares/uploadMiddleware');
const sequelize = require('../config/database'); 

exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const offset = (page - 1) * limit;
    
    const product = await Product.findByPk(productId);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
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

    const reviewsWithUserFlag = reviews.map(review => {
      const reviewObj = review.toJSON();
      reviewObj.isUserReview = req.user ? review.userId === req.user.id : false;
      return reviewObj;
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
      statistics: {
        avgRating: avgRating.avgRating ? parseFloat(avgRating.avgRating).toFixed(1) : 0,
        totalReviews: parseInt(avgRating.totalReviews) || 0,
        breakdown: formattedBreakdown
      },
      data: reviewsWithUserFlag
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching product reviews',
      error: error.message
    });
  }
};

exports.getUserProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { orderId } = req.query;
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }
    
    const whereCondition = {
      userId: req.user.id,
      productId,
      isActive: true
    };
    
    if (orderId) {
      whereCondition.orderId = orderId;
    }
    
    const userReview = await Review.findOne({
      where: whereCondition,
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'profileImage']
        }
      ]
    });
    
    res.status(200).json({
      success: true,
      data: userReview
    });
  } catch (error) {
    console.error('Error fetching user product review:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user product review',
      error: error.message
    });
  }
};

exports.createReview = async (req, res) => {
  try {
    const { productId, rating, title, comment, orderId } = req.body;
    
    if (!productId || !rating || !orderId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID, Order ID, and rating are required'
      });
    }
    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }
    
    const product = await Product.findByPk(productId);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    const existingReview = await Review.findOne({
      where: {
        userId: req.user.id,
        productId,
        orderId
      }
    });
    
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product for this order'
      });
    }
    
    const order = await Order.findOne({
      where: {
        id: orderId,
        userId: req.user.id,
        status: { [Op.in]: ['delivered', 'completed'] }
      }
    });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or not eligible for review'
      });
    }
    
    const orderItem = await OrderItem.findOne({
      where: {
        orderId,
        productId
      }
    });
    
    if (!orderItem) {
      return res.status(400).json({
        success: false,
        message: 'This product was not in the specified order'
      });
    }
    
    let images = [];
    
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
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
      userId: req.user.id,
      productId,
      orderId,
      rating,
      title,
      comment,
      images,
      isVerifiedPurchase: true,
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
    
    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: createdReview
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating review',
      error: error.message
    });
  }
};

exports.updateReview = async (req, res) => {
  try {
    const { rating, title, comment, isRecommended } = req.body;
    
    const review = await Review.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
    
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }
    
    let images = review.images || [];
    
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
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
    
    res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      data: updatedReview
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating review',
      error: error.message
    });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
    
    if (review.images && review.images.length > 0) {
      for (const image of review.images) {
        if (image.publicId) {
          await uploadMiddleware.deleteFromCloudinary(image.publicId);
        }
      }
    }
    
    await review.destroy();
    
    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting review',
      error: error.message
    });
  }
};

exports.markReviewHelpful = async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
    
    await review.update({
      helpfulCount: review.helpfulCount + 1
    });
    
    res.status(200).json({
      success: true,
      message: 'Review marked as helpful',
      helpfulCount: review.helpfulCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error marking review as helpful',
      error: error.message
    });
  }
};

exports.reportReview = async (req, res) => {
  try {
    const { reason } = req.body;
    
    const review = await Review.findByPk(req.params.id);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
    
    await review.update({
      reportCount: review.reportCount + 1
    });
    
    if (review.reportCount >= 3) {
      await review.update({
        isActive: false
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Review reported successfully',
      reportCount: review.reportCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error reporting review',
      error: error.message
    });
  }
};

exports.getAllReviews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined;
    const reportedOnly = req.query.reportedOnly === 'true';
    
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
    
    res.status(200).json({
      success: true,
      count,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: count,
        limit
      },
      data: reviews
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews',
      error: error.message
    });
  }
};

exports.updateReviewStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    
    if (isActive === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }
    
    const review = await Review.findByPk(req.params.id);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
    
    await review.update({
      isActive,
      reportCount: isActive ? 0 : review.reportCount
    });
    
    res.status(200).json({
      success: true,
      message: `Review ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating review status',
      error: error.message
    });
  }
};

exports.respondToReview = async (req, res) => {
  try {
    const { response } = req.body;
    
    if (!response) {
      return res.status(400).json({
        success: false,
        message: 'Response is required'
      });
    }
    
    const review = await Review.findByPk(req.params.id);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
    
    await review.update({
      adminResponse: response,
      adminResponseDate: new Date()
    });
    
    res.status(200).json({
      success: true,
      message: 'Response added to review',
      data: review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error responding to review',
      error: error.message
    });
  }
};