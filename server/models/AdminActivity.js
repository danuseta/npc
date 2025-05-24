const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const AdminActivity = sequelize.define('AdminActivity', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false
  },
  details: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  entityType: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Type of entity affected (product, order, user, etc.)'
  },
  entityId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID of the entity affected'
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true
});

AdminActivity.belongsTo(User, {
  foreignKey: 'userId',
  as: 'admin'
});

module.exports = AdminActivity;