const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
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
  orderNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'),
    defaultValue: 'pending'
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  tax: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  shippingFee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  grandTotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  shippingAddress: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  paymentMethod: {
    type: DataTypes.ENUM('credit_card', 'debit_card', 'bank_transfer', 'e_wallet', 
                        'cash_on_delivery', 'midtrans', 'qris'),
    defaultValue: 'midtrans'
  },
  paymentStatus: {
    type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded'),
    defaultValue: 'pending'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  trackingNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  estimatedDelivery: {
    type: DataTypes.DATE,
    allowNull: true
  },
  shippingMethod: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'ID of the selected shipping method'
  },
  shippingDetails: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'JSON string with shipping details'
  }
}, {
  timestamps: true,
  tableName: 'orders', 
  hooks: {
    beforeValidate: (order) => {
      if (!order.orderNumber) {
        const dateStr = new Date().toISOString()
          .replace(/[-:T.Z]/g, '')
          .substring(0, 14);
        const random = Math.floor(Math.random() * 10000)
          .toString()
          .padStart(4, '0');
        order.orderNumber = `ORD-${dateStr}-${random}`;
      }
      
      order.grandTotal = parseFloat(order.totalAmount || 0) + 
                        parseFloat(order.tax || 0) + 
                        parseFloat(order.shippingFee || 0);
    }
  }
});

module.exports = Order;