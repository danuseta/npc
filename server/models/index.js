const User = require('./User');
const Product = require('./Product');
const Category = require('./Category');
const Cart = require('./Cart');
const CartItem = require('./CartItem');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const Review = require('./Review');
const Payment = require('./Payment');
const EmailVerification = require('./EmailVerification');
const SystemSettings = require('./SystemSettings'); 
const Carousel = require('./Carousel'); 
const SystemLog = require('./SystemLog');
const AdminActivity = require('./AdminActivity');

const crypto = require('crypto');

User.hasMany(Order, { foreignKey: 'userId' });
User.hasOne(Cart, { foreignKey: 'userId' });
User.hasMany(Review, { foreignKey: 'userId' });

Product.belongsTo(Category, { foreignKey: 'categoryId' });
Product.hasMany(Review, { foreignKey: 'productId' });
Product.hasMany(CartItem, { foreignKey: 'productId' });
Product.hasMany(OrderItem, { foreignKey: 'productId' });

Category.hasMany(Product, { foreignKey: 'categoryId' });

Cart.belongsTo(User, { foreignKey: 'userId' });
Cart.hasMany(CartItem, { foreignKey: 'cartId' });

CartItem.belongsTo(Cart, { foreignKey: 'cartId' });
CartItem.belongsTo(Product, { foreignKey: 'productId' });

Order.belongsTo(User, { foreignKey: 'userId' });
Order.hasMany(OrderItem, { foreignKey: 'orderId' });
Order.hasOne(Payment, { foreignKey: 'orderId' });

OrderItem.belongsTo(Order, { foreignKey: 'orderId' });
OrderItem.belongsTo(Product, { foreignKey: 'productId' });

Review.belongsTo(User, { foreignKey: 'userId' });
Review.belongsTo(Product, { foreignKey: 'productId' });

Payment.belongsTo(Order, { foreignKey: 'orderId' });

EmailVerification.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(EmailVerification, { foreignKey: 'userId' });

module.exports = {
  User,
  Product,
  Category,
  Cart,
  CartItem,
  Order,
  OrderItem,
  Review,
  Payment,
  EmailVerification,
  SystemSettings,
  Carousel,
  SystemLog,
  AdminActivity
};