const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CartItem = sequelize.define('CartItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  cartId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Carts',
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
    defaultValue: 1,
    validate: {
      min: 1
    }
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Price at the time of adding to cart'
  },
  totalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  }
}, {
  timestamps: true,
  hooks: {
    beforeValidate: (cartItem) => {
      if (cartItem.price && cartItem.quantity) {
        cartItem.totalPrice = parseFloat(cartItem.price) * cartItem.quantity;
      }
    }
  }
});

CartItem.addHook('afterSync', async () => {
  await sequelize.query('ALTER TABLE CartItems ADD UNIQUE (cartId, productId)');
});

module.exports = CartItem;