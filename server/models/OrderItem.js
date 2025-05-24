const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OrderItem = sequelize.define('OrderItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Orders',
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
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Price at the time of order'
  },
  totalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  productName: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Product name at the time of order'
  },
  productSku: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Product SKU at the time of order'
  },
  discountAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  }
}, {
  timestamps: true,
  hooks: {
    beforeValidate: (orderItem) => {
      if (orderItem.price && orderItem.quantity) {
        const itemPrice = parseFloat(orderItem.price);
        const discount = parseFloat(orderItem.discountAmount || 0);
        orderItem.totalPrice = (itemPrice - discount) * orderItem.quantity;
      }
    }
  }
});

module.exports = OrderItem;