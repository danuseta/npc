const { Cart, CartItem, Product } = require('../models');
const { Op } = require('sequelize');

exports.getCart = async (userId) => {
  try {
    let [cart, created] = await Cart.findOrCreate({
      where: { userId },
      defaults: {
        userId,
        totalItems: 0,
        totalPrice: 0
      }
    });
    const cartItems = await CartItem.findAll({
      where: { cartId: cart.id },
      include: [
        {
          model: Product,
          attributes: ['id', 'name', 'price', 'imageUrl', 'stock', 'isActive']
        }
      ]
    });
    const validCartItems = cartItems.filter(item => 
      item.Product.isActive && item.Product.stock > 0
    );
    if (validCartItems.length !== cartItems.length) {
      for (const item of cartItems) {
        if (!item.Product.isActive || item.Product.stock <= 0) {
          await CartItem.destroy({ where: { id: item.id } });
        }
      }
      await recalculateCart(cart.id);
      cart = await Cart.findByPk(cart.id);
    }
    return {
      cart,
      items: validCartItems
    };
  } catch (error) {
    throw error;
  }
};

exports.addItemToCart = async (userId, itemData) => {
  try {
    const { productId, quantity = 1 } = itemData;
    if (quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }
    const product = await Product.findOne({
      where: { 
        id: productId,
        isActive: true
      }
    });
    if (!product) {
      throw new Error('Product not found or is not available');
    }
    if (product.stock < quantity) {
      throw new Error(`Only ${product.stock} items available in stock`);
    }
    const [cart, created] = await Cart.findOrCreate({
      where: { userId },
      defaults: {
        userId,
        totalItems: 0,
        totalPrice: 0
      }
    });
    let cartItem = await CartItem.findOne({
      where: {
        cartId: cart.id,
        productId
      }
    });
    if (cartItem) {
      const newQuantity = cartItem.quantity + quantity;
      if (newQuantity > product.stock) {
        throw new Error(`Cannot add more items. Only ${product.stock} items available in stock`);
      }
      cartItem.quantity = newQuantity;
      cartItem.price = product.price;
      cartItem.totalPrice = product.price * newQuantity;
      await cartItem.save();
    } else {
      cartItem = await CartItem.create({
        cartId: cart.id,
        productId,
        quantity,
        price: product.price,
        totalPrice: product.price * quantity
      });
    }
    await recalculateCart(cart.id);
    const updatedCart = await Cart.findByPk(cart.id);
    const cartItems = await CartItem.findAll({
      where: { cartId: cart.id },
      include: [
        {
          model: Product,
          attributes: ['id', 'name', 'price', 'imageUrl', 'stock']
        }
      ]
    });
    return {
      cart: updatedCart,
      items: cartItems
    };
  } catch (error) {
    throw error;
  }
};

exports.updateCartItem = async (userId, itemId, updateData) => {
  try {
    const { quantity } = updateData;
    if (!quantity || quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }
    const cartItem = await CartItem.findOne({
      where: { id: itemId },
      include: [
        {
          model: Cart,
          where: { userId }
        }
      ]
    });
    if (!cartItem) {
      throw new Error('Cart item not found');
    }
    const product = await Product.findOne({
      where: { 
        id: cartItem.productId,
        isActive: true
      }
    });
    if (!product) {
      throw new Error('Product is no longer available');
    }
    if (quantity > product.stock) {
      throw new Error(`Only ${product.stock} items available in stock`);
    }
    cartItem.quantity = quantity;
    cartItem.price = product.price;
    cartItem.totalPrice = product.price * quantity;
    await cartItem.save();
    await recalculateCart(cartItem.cartId);
    const updatedCart = await Cart.findByPk(cartItem.cartId);
    const cartItems = await CartItem.findAll({
      where: { cartId: cartItem.cartId },
      include: [
        {
          model: Product,
          attributes: ['id', 'name', 'price', 'imageUrl', 'stock']
        }
      ]
    });
    return {
      cart: updatedCart,
      items: cartItems
    };
  } catch (error) {
    throw error;
  }
};

exports.removeCartItem = async (userId, itemId) => {
  try {
    const cartItem = await CartItem.findOne({
      where: { id: itemId },
      include: [
        {
          model: Cart,
          where: { userId }
        }
      ]
    });
    if (!cartItem) {
      throw new Error('Cart item not found');
    }
    const cartId = cartItem.cartId;
    await cartItem.destroy();
    await recalculateCart(cartId);
    const updatedCart = await Cart.findByPk(cartId);
    const cartItems = await CartItem.findAll({
      where: { cartId },
      include: [
        {
          model: Product,
          attributes: ['id', 'name', 'price', 'imageUrl', 'stock']
        }
      ]
    });
    return {
      cart: updatedCart,
      items: cartItems
    };
  } catch (error) {
    throw error;
  }
};

exports.clearCart = async (userId) => {
  try {
    const cart = await Cart.findOne({
      where: { userId }
    });
    if (!cart) {
      throw new Error('Cart not found');
    }
    await CartItem.destroy({
      where: { cartId: cart.id }
    });
    cart.totalItems = 0;
    cart.totalPrice = 0;
    cart.lastUpdated = new Date();
    await cart.save();
    return {
      cart,
      items: []
    };
  } catch (error) {
    throw error;
  }
};

const recalculateCart = async (cartId) => {
  try {
    const cartItems = await CartItem.findAll({
      where: { cartId },
      include: [
        {
          model: Product,
          attributes: ['id', 'price', 'stock', 'isActive'],
          where: {
            isActive: true,
            stock: { [Op.gt]: 0 }
          }
        }
      ]
    });
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cartItems.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0);
    await Cart.update(
      {
        totalItems,
        totalPrice,
        lastUpdated: new Date()
      },
      { where: { id: cartId } }
    );
  } catch (error) {
    throw error;
  }
};