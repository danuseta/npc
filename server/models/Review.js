const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Review = sequelize.define('Review', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Products',
      key: 'id'
    }
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false, 
    references: {
      model: 'Orders',
      key: 'id'
    },
    comment: 'Reference to the order where this product was purchased'
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5
    }
  },
  title: {
    type: DataTypes.STRING,
    allowNull: true
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  images: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('images');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('images', JSON.stringify(value));
    },
    comment: 'JSON array of image URLs and public IDs'
  },
  isVerifiedPurchase: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isRecommended: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  helpfulCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  reportCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  adminResponse: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  adminResponseDate: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['userId', 'productId', 'orderId'] 
    }
  ]
});

let Product; 
setTimeout(() => {
  Product = require('./Product');
}, 0);

async function updateProductRatings(productId) {
  try {
    if (!Product) {
      Product = require('./Product');
    }
    
    const stats = await Review.findOne({
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
    
    const avgRating = stats && stats.avgRating ? parseFloat(stats.avgRating) : 0;
    const reviewCount = stats && stats.totalReviews ? parseInt(stats.totalReviews) : 0;
    
    await Product.update({
      avgRating: avgRating,
      reviewCount: reviewCount
    }, {
      where: { id: productId }
    });
    
    console.log(`Updated ratings for product ID ${productId}: Average ${avgRating}, Count ${reviewCount}`);
  } catch (error) {
    console.error(`Error updating ratings for product ID ${productId}:`, error);
  }
}

Review.afterCreate(async (review) => {
  await updateProductRatings(review.productId);
});

Review.afterUpdate(async (review) => {
  if (review.changed('rating') || review.changed('isActive')) {
    await updateProductRatings(review.productId);
  }
});

Review.afterDestroy(async (review) => {
  await updateProductRatings(review.productId);
});

module.exports = Review;
module.exports.updateProductRatings = updateProductRatings;