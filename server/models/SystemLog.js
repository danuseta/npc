const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const SystemLog = sequelize.define('SystemLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  level: {
    type: DataTypes.ENUM('INFO', 'WARNING', 'ERROR'),
    defaultValue: 'INFO'
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  source: {
    type: DataTypes.STRING,
    allowNull: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  metadata: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'JSON string with additional details'
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true
});

SystemLog.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

module.exports = SystemLog;