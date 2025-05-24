const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payment = sequelize.define('Payment', {
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
    },
    unique: true
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  method: {
    type: DataTypes.ENUM('credit_card', 'debit_card', 'bank_transfer', 'e_wallet', 'cash_on_delivery', 'qris'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
    defaultValue: 'pending'
  },
  transactionId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'External payment gateway transaction ID'
  },
  paymentDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  gatewayResponse: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Response from payment gateway'
  },
  receiptUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  refundAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  refundDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  refundReason: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  hooks: {
    beforeUpdate: (payment) => {
      if (payment.changed('status') && payment.status === 'completed' && !payment.paymentDate) {
        payment.paymentDate = new Date();
      }
      
      if (payment.changed('status') && payment.status === 'refunded' && !payment.refundDate) {
        payment.refundDate = new Date();
      }
    }
  }
});

module.exports = Payment;