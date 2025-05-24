const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    imagePublicId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Cloudinary public ID for the main image'
    },
    gallery: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const rawValue = this.getDataValue('gallery');
        return rawValue ? JSON.parse(rawValue) : [];
      },
      set(value) {
        this.setDataValue('gallery', JSON.stringify(value));
      },
      comment: 'JSON array of image URLs and public IDs'
    },
    sku: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    weight: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    dimensions: {
      type: DataTypes.STRING,
      allowNull: true
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    discountPercentage: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0
    },
    avgRating: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      allowNull: false
    },
    reviewCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    featured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    features: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const rawValue = this.getDataValue('features');
        return rawValue ? JSON.parse(rawValue) : [];
      },
      set(value) {
        this.setDataValue('features', JSON.stringify(value));
      },
      comment: 'JSON array of product features'
    },
    specifications: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const rawValue = this.getDataValue('specifications');
        return rawValue ? JSON.parse(rawValue) : {};
      },
      set(value) {
        this.setDataValue('specifications', JSON.stringify(value));
      },
      comment: 'JSON object of product specifications'
    }
}, {
  timestamps: true
});

module.exports = Product;