const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Carousel = sequelize.define('Carousel', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tag: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Small tag/label shown above the title (e.g., "New Arrival", "Limited Offer")'
  },
  buttonText: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Shop Now'
  },
  buttonLink: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: '/products'
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: false
  },
  imagePublicId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Cloudinary public ID for image'
  },
  displayOrder: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Order in which slides are displayed (0 being first)'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  timestamps: true
});

module.exports = Carousel;