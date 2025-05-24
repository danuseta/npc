const { Cart, CartItem, Product, Category } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

exports.getCart = async (req, res) => {
  try {
    let [cart, created] = await Cart.findOrCreate({
      where: { userId: req.user.id },
      defaults: {
        userId: req.user.id,
        totalItems: 0,
        totalPrice: 0
      }
    });

    const cartItems = await CartItem.findAll({
      where: { cartId: cart.id },
      include: [
        {
          model: Product,
          attributes: ['id', 'name', 'price', 'imageUrl', 'stock', 'isActive', 'categoryId', 'discountPercentage', 'sku', 'avgRating', 'reviewCount'],
          include: [
            {
              model: Category,
              attributes: ['id', 'name']
            }
          ]
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

    res.status(200).json({
      success: true,
      data: {
        cart,
        items: validCartItems
      }
    });
  } catch (error) {
    console.error('Error in getCart:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching cart',
      error: error.message
    });
  }
};

exports.addItemToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const userId = req.user.id;
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }
    
    const product = await Product.findByPk(productId);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    if (!product.isActive) {
      return res.status(400).json({
        success: false,
        message: 'This product is currently unavailable'
      });
    }
    
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} items available in stock`
      });
    }
    
    let cart = await Cart.findOne({ where: { userId } });
    
    if (!cart) {
      cart = await Cart.create({
        userId,
        totalItems: 0,
        totalPrice: 0
      });
    }
    
    const existingItem = await CartItem.findOne({
      where: {
        cartId: cart.id,
        productId
      }
    });
    
    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      
      if (newQuantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Cannot add more items. Only ${product.stock} available in stock.`
        });
      }
      
      await existingItem.update({
        quantity: newQuantity,
        totalPrice: product.price * newQuantity
      });
      
      await recalculateCart(cart.id);
      
      const updatedCart = await getCartWithItems(userId);
      
      return res.status(200).json({
        success: true,
        message: 'Item quantity updated in cart',
        data: updatedCart
      });
    } else {
      const cartItem = await CartItem.create({
        cartId: cart.id,
        productId: productId,
        quantity: quantity,
        price: product.price,
        totalPrice: product.price * quantity,
        weight: product.weight || 1,
        dimensions: product.dimensions
      });
      
      await recalculateCart(cart.id);
      
      const updatedCart = await getCartWithItems(userId);
      
      return res.status(201).json({
        success: true,
        message: 'Item added to cart',
        data: updatedCart
      });
    }
  } catch (error) {
    console.error('Error adding item to cart:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add item to cart',
      error: error.message
    });
  }
};

exports.updateCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    
    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be greater than 0'
      });
    }

    const cartItem = await CartItem.findOne({
      where: { id: itemId },
      include: [
        {
          model: Cart,
          where: { userId: req.user.id }
        }
      ]
    });

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
    }

    const product = await Product.findOne({
      where: { 
        id: cartItem.productId,
        isActive: true
      }
    });

    if (!product) {
      return res.status(400).json({
        success: false,
        message: 'Product is no longer available'
      });
    }

    if (quantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} items available in stock`
      });
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
          attributes: ['id', 'name', 'price', 'imageUrl', 'stock', 'categoryId', 'discountPercentage', 'sku', 'avgRating', 'reviewCount'],
          include: [
            {
              model: Category,
              attributes: ['id', 'name']
            }
          ]
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Cart item updated successfully',
      data: {
        cart: updatedCart,
        items: cartItems
      }
    });
  } catch (error) {
    console.error('Error in updateCartItem:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating cart item',
      error: error.message
    });
  }
};

exports.removeCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;

    const cartItem = await CartItem.findOne({
      where: { id: itemId },
      include: [
        {
          model: Cart,
          where: { userId: req.user.id }
        }
      ]
    });

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
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
          attributes: ['id', 'name', 'price', 'imageUrl', 'stock', 'categoryId', 'discountPercentage', 'sku', 'avgRating', 'reviewCount'],
          include: [
            {
              model: Category,
              attributes: ['id', 'name']
            }
          ]
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Item removed from cart successfully',
      data: {
        cart: updatedCart,
        items: cartItems
      }
    });
  } catch (error) {
    console.error('Error in removeCartItem:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing item from cart',
      error: error.message
    });
  }
};

exports.clearCart = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const userId = req.user.id;
    console.log(`Attempting to clear cart for user ID: ${userId}`);
    
    const productIds = req.query.productIds || req.body.productIds;
    
    const cart = await Cart.findOne({
      where: { userId },
      transaction
    });

    if (!cart) {
      await transaction.rollback();
      console.log(`No cart found for user ID: ${userId}`);
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    console.log(`Found cart ID: ${cart.id} with ${cart.totalItems} items`);

    if (productIds && (Array.isArray(productIds) || typeof productIds === 'string') && 
        (Array.isArray(productIds) ? productIds.length > 0 : productIds.trim().length > 0)) {
      
      const productIdArray = Array.isArray(productIds) 
        ? productIds 
        : productIds.split(',').map(id => parseInt(id.trim()));
      
      console.log(`Removing specific products: ${JSON.stringify(productIdArray)}`);
      
      const itemsToRemove = await CartItem.findAll({
        where: { 
          cartId: cart.id,
          productId: { [Op.in]: productIdArray }
        },
        transaction
      });
      
      if (itemsToRemove.length === 0) {
        console.log('No matching items found in cart');
        await transaction.commit();
        return res.status(200).json({
          success: true,
          message: 'No matching items found in cart',
          data: { cart, items: [] }
        });
      }
      
      const removedQuantity = itemsToRemove.reduce((sum, item) => sum + item.quantity, 0);
      const removedPrice = itemsToRemove.reduce((sum, item) => sum + parseFloat(item.totalPrice || 0), 0);
      
      console.log(`About to remove ${removedQuantity} items totaling ${removedPrice}`);
      
      const deletedCount = await CartItem.destroy({
        where: { 
          cartId: cart.id,
          productId: { [Op.in]: productIdArray }
        },
        transaction
      });
      
      console.log(`Deleted ${deletedCount} cart items`);
      
      const newTotalItems = Math.max(0, cart.totalItems - removedQuantity);
      const newTotalPrice = Math.max(0, parseFloat(cart.totalPrice || 0) - removedPrice);
      
      await cart.update({
        totalItems: newTotalItems,
        totalPrice: newTotalPrice,
        lastUpdated: new Date()
      }, { transaction });
      
      console.log(`Updated cart totals: items=${newTotalItems}, price=${newTotalPrice}`);
      
    } else {
      const deletedCount = await CartItem.destroy({
        where: { cartId: cart.id },
        transaction
      });
      
      console.log(`Deleted all ${deletedCount} cart items`);

      await cart.update({
        totalItems: 0,
        totalPrice: 0,
        lastUpdated: new Date()
      }, { transaction });
    }

    await transaction.commit();
    console.log(`Cart ${cart.id} updated successfully`);

    const updatedCart = await Cart.findByPk(cart.id);
    
    const remainingItems = await CartItem.findAll({
      where: { cartId: cart.id },
      include: [
        {
          model: Product,
          attributes: ['id', 'name', 'imageUrl', 'price', 'stock', 'categoryId', 'discountPercentage']
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: productIds ? 'Selected cart items removed successfully' : 'Cart cleared successfully',
      data: {
        cart: updatedCart,
        items: remainingItems
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error(`Error in cart operation for user ${req.user?.id}:`, error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error in cart operation',
      error: error.message
    });
  }
};

const getCartWithItems = async (userId) => {
  const cart = await Cart.findOne({
    where: { userId }
  });

  if (!cart) {
    return { cart: null, items: [] };
  }

  const cartItems = await CartItem.findAll({
    where: { cartId: cart.id },
    include: [
      {
        model: Product,
        attributes: ['id', 'name', 'price', 'imageUrl', 'stock', 'isActive', 'categoryId', 'discountPercentage', 'sku', 'avgRating', 'reviewCount'],
        include: [
          {
            model: Category,
            attributes: ['id', 'name']
          }
        ]
      }
    ]
  });

  const validCartItems = cartItems.filter(item => 
    item.Product.isActive && item.Product.stock > 0
  );

  return {
    cart,
    items: validCartItems
  };
};

const recalculateCart = async (cartId) => {
  const cartItems = await CartItem.findAll({
    where: { cartId },
    include: [
      {
        model: Product,
        attributes: ['id', 'price', 'stock', 'isActive', 'categoryId'],
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
};