import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cartAPI, categoryAPI, productAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../contexts/CartContext';
import { canShop, getAdminViewMessage } from '../../utils/canShop';
import Swal from 'sweetalert2';

const Cart = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { updateCartCount } = useCart();
  const [cartItems, setCartItems] = useState([]);
  const [cartInfo, setCartInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [categoriesMap, setCategoriesMap] = useState({});
  
  const userCanShop = user ? canShop(user.role) : false;
  
  const adminModeMessage = user ? getAdminViewMessage(user.role) : '';
  
  useEffect(() => {
    window.Swal = Swal;
  }, []);
  
  useEffect(() => {
    if (userCanShop) {
      fetchCartItems();
    }
    fetchCategories();
  }, [userCanShop]);
  
  useEffect(() => {
    if (selectAll) {
      setSelectedItems(cartItems.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  }, [selectAll, cartItems]);

  const [productsLoaded, setProductsLoaded] = useState(false);

  const fetchProductDetails = async () => {
    try {
      if (cartItems.length > 0 && cartItems.some(item => item.categoryId === undefined)) {
        setProductsLoaded(false);
        
        const productPromises = cartItems.map(item => 
          productAPI.getProductById(item.productId)
        );
        
        const productResponses = await Promise.all(productPromises);
        
        const updatedItems = cartItems.map((item, index) => {
          const productData = productResponses[index]?.data?.data || {};
          return {
            ...item,
            categoryId: productData.categoryId || null,
            discountPercentage: productData.discountPercentage || 0
          };
        });
        
        setCartItems(updatedItems);
      }
      
      setProductsLoaded(true);
    } catch (error) {
      console.error('Error fetching product details:', error);
      setProductsLoaded(true);
    }
  };
  
  useEffect(() => {
    if (cartItems.length > 0 && !productsLoaded) {
      fetchProductDetails();
    } else if (cartItems.length === 0) {
      setProductsLoaded(true);
    }
  }, [cartItems]);
  
  const fetchCategories = async () => {
    try {
      const response = await categoryAPI.getAllCategories();
      
      let categories = [];
      if (response?.data?.data) {
        categories = response.data.data;
      } else if (response?.data) {
        categories = response.data;
      }
      
      const catMap = {};
      if (Array.isArray(categories)) {
        categories.forEach(cat => {
          if (cat && cat.id) {
            catMap[cat.id] = cat.name;
          }
        });
      }
      
      setCategoriesMap(catMap);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };
  
  const fetchCartItems = async () => {
    setLoading(true);
    
    try {
      const response = await cartAPI.getCart();
      
      let cart, items;
      
      if (response?.data?.data) {
        cart = response.data.data.cart;
        items = response.data.data.items;
      } else if (response?.data) {
        cart = response.data.cart;
        items = response.data.items;
      } else {
        throw new Error('Unexpected response format');
      }
      
      const formattedItems = items.map(item => {
        const product = item.Product || {};
        
        return {
          id: item.id,
          productId: item.productId,
          name: product.name || 'Unknown Product',
          price: parseFloat(item.price) || 0,
          image: product.imageUrl || '/images/placeholder.png',
          quantity: item.quantity || 1,
          stock: product.stock || 0,
          totalPrice: parseFloat(item.totalPrice) || 0,
          categoryId: product.categoryId || (product.Category ? product.Category.id : undefined),
          rating: product.avgRating || 0,
          reviews: product.reviewCount || 0,
          discountPercentage: parseFloat(product.discountPercentage) || 0,
          features: product.features || [],
          specifications: product.specifications || {},
          description: product.description || '',
          weight: product.weight || 0,
          sku: product.sku || ''
        };
      });
      
      
      setCartItems(formattedItems);
      setCartInfo(cart);
      setSelectedItems(formattedItems.map(item => item.id));
      setSelectAll(formattedItems.length > 0);
      
      updateCartCount(formattedItems.length);
    } catch (error) {
      console.error('Error fetching cart:', error);
      
      if (process.env.NODE_ENV === 'development') {
        setCartItems([]);
        setCartInfo({ totalItems: 0, totalPrice: 0 });
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleSelectAll = () => {
    const newSelectAllState = !selectAll;
    setSelectAll(newSelectAllState);
  };
  
  const handleSelectItem = (itemId) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter(id => id !== itemId));
    } else {
      setSelectedItems([...selectedItems, itemId]);
    }
  };
  
  const isItemSelected = (itemId) => {
    return selectedItems.includes(itemId);
  };
  
  const updateQuantity = async (itemId, newQuantity) => {
    if (!userCanShop) {
      window.Swal?.fire({
        title: 'Not Allowed',
        text: 'As an Admin, you cannot modify product quantities in the cart.',
        icon: 'info',
      });
      return;
    }
    
    const item = cartItems.find(item => item.id === itemId);
    
    if (!item) return;
    
    if (newQuantity < 1 || newQuantity > item.stock) return;
    
    try {
      await cartAPI.updateCartItem(itemId, { quantity: newQuantity });
      
      const updatedItems = cartItems.map(cartItem => {
        if (cartItem.id === itemId) {
          const discountedPrice = cartItem.discountPercentage > 0 
            ? cartItem.price * (1 - (cartItem.discountPercentage / 100)) 
            : cartItem.price;
          
          return {
            ...cartItem,
            quantity: newQuantity,
            totalPrice: discountedPrice * newQuantity
          };
        }
        return cartItem;
      });
      
      setCartItems(updatedItems);
    } catch (error) {
      console.error('Error updating cart item:', error);
    }
  };
  
  const removeItem = async (itemId) => {
    if (!userCanShop) {
      window.Swal?.fire({
        title: 'Not Allowed',
        text: 'As an Admin, you cannot remove products from the cart.',
        icon: 'info',
      });
      return;
    }
    
    try {
      const response = await cartAPI.removeCartItem(itemId);
      
      const updatedItems = cartItems.filter(item => item.id !== itemId);
      setCartItems(updatedItems);
      
      if (selectedItems.includes(itemId)) {
        setSelectedItems(selectedItems.filter(id => id !== itemId));
      }
      
      updateCartCount(updatedItems.length);
      
      window.Swal?.fire({
        title: 'Removed!',
        text: 'The product has been removed from your cart.',
        icon: 'success',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    } catch (error) {
      console.error('Error removing cart item:', error);
      window.Swal?.fire({
        title: 'Error!',
        text: 'Failed to remove the product from cart.',
        icon: 'error',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    }
  };
  
  const getDiscountedPrice = (item) => {
    if (item.discountPercentage && item.discountPercentage > 0) {
      return item.price * (1 - (item.discountPercentage / 100));
    }
    return item.price;
  };
  
  const calculateSubtotal = () => {
    return cartItems
      .filter(item => isItemSelected(item.id))
      .reduce((total, item) => total + (getDiscountedPrice(item) * item.quantity), 0);
  };
  
  const calculateTotalItems = () => {
    return cartItems
      .filter(item => isItemSelected(item.id))
      .reduce((total, item) => total + item.quantity, 0);
  };
  
  const calculateTotal = () => {
    return calculateSubtotal();
  };
  
  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };
  
  const proceedToCheckout = () => {
    if (!userCanShop) {
      window.Swal?.fire({
        title: 'Not Allowed',
        text: 'As an Admin, you cannot proceed to checkout.',
        icon: 'info',
      });
      return;
    }
    
    if (selectedItems.length === 0) {
      window.Swal.fire({
        title: 'No Products Selected',
        text: 'Please select at least one product to proceed to checkout',
        icon: 'warning',
        confirmButtonColor: '#F0A84E'
      });
      return;
    }
    
    const selectedCartItems = cartItems.filter(item => selectedItems.includes(item.id));
    
    const itemsWithDiscountedPrices = selectedCartItems.map(item => ({
      ...item,
      discountedPrice: getDiscountedPrice(item)
    }));
    
    localStorage.setItem('checkoutItems', JSON.stringify(itemsWithDiscountedPrices));
    
    navigate('/checkout');
  };
  
  const getSelectedItems = () => {
    return cartItems.filter(item => selectedItems.includes(item.id));
  };
  
  const getCategoryName = (categoryId) => {
    if (categoriesMap && Object.keys(categoriesMap).length > 0 && categoryId && categoriesMap[categoryId]) {
      return categoriesMap[categoryId];
    }
    return "General Category";
  };
  
  const truncateText = (text, length) => {
    if (!text) return '';
    return text.length > length ? text.substring(0, length) + '...' : text;
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {!userCanShop && adminModeMessage && (
        <div className="bg-blue-100 border-t border-b border-blue-500 text-blue-700 px-4 py-3 mb-4" role="alert">
          <div className="flex items-center">
            <div className="py-1">
              <svg className="fill-current h-6 w-6 text-blue-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 11.32 11.32zM9 11V9h2v6H9v-4zm0-6h2v2H9V5z"/>
              </svg>
            </div>
            <div>
              <p className="font-bold">{adminModeMessage}</p>
              <p className="text-sm">You can view content, but cannot make purchases.</p>
            </div>
          </div>
        </div>
      )}
      
      <main className="container mx-auto px-4 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Your Shopping Cart</h1>
          <Link to="/products" className="text-npc-gold hover:text-npc-darkGold flex items-center self-start">
            <i className="fas fa-arrow-left mr-1 text-xs"></i>
            <span className="text-sm">Continue Shopping</span>
          </Link>
        </div>
        
        {loading || !productsLoaded ? (
          <div className="flex justify-center items-center h-64">
            <span className="loading loading-spinner loading-lg text-npc-gold"></span>
          </div>
        ) : !userCanShop ? (
          <div className="card bg-white shadow-sm p-6 sm:p-8 text-center">
            <div className="mx-auto h-32 sm:h-40 mb-4 flex items-center justify-center">
              <i className="fas fa-user-shield text-6xl text-blue-500"></i>
            </div>
            <h2 className="text-lg sm:text-xl font-bold mb-2 text-gray-800">Admin Access</h2>
            <p className="text-gray-600 mb-6">
              As an {user?.role === 'admin' ? 'Admin' : 'Super Admin'}, you cannot access the shopping cart. This feature is only available for buyers.
            </p>
            <Link to="/products" className="btn btn-primary bg-npc-gold hover:bg-npc-darkGold border-none text-white">
              Browse Products
            </Link>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="card bg-white shadow-sm p-6 sm:p-8 text-center">
            <img 
              src="./empty-cart.png" 
              alt="Empty Cart" 
              className="mx-auto h-32 sm:h-40 mb-4"
            />
            <h2 className="text-lg sm:text-xl font-bold mb-2 text-gray-800">Your Cart is Empty</h2>
            <p className="text-gray-600 mb-6">
              It looks like you haven't added any products to your cart yet.
            </p>
            <Link to="/products" className="btn btn-primary bg-npc-gold hover:bg-npc-darkGold border-none text-white">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
            <div className="w-full lg:w-2/3">
              <div className="card bg-white shadow-sm rounded-lg overflow-hidden">
                <div className="p-3 sm:p-4 border-b bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="form-control">
                      <label className="cursor-pointer flex items-center">
                        <input 
                          type="checkbox" 
                          className="checkbox checkbox-primary checkbox-sm"
                          checked={selectAll}
                          onChange={handleSelectAll}
                          disabled={!userCanShop}
                        />
                        <span className="ml-2 text-sm sm:text-base text-gray-800 font-medium">Select All</span>
                      </label>
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500">
                      {cartItems.length} products in cart
                    </div>
                  </div>
                </div>
                
                <div className="divide-y divide-gray-100">
                  {cartItems.map(item => {
                    const discountedPrice = getDiscountedPrice(item);
                    const categoryName = getCategoryName(item.categoryId);
                    const hasDiscount = item.discountPercentage > 0;
                    
                    return (
                      <div key={item.id} className="p-3 sm:p-4 hover:bg-gray-50 transition duration-150">
                        <div className="flex">
                          <div className="pr-3">
                            <input 
                              type="checkbox" 
                              className="checkbox checkbox-primary checkbox-sm mt-1"
                              checked={isItemSelected(item.id)}
                              onChange={() => handleSelectItem(item.id)}
                              disabled={!userCanShop}
                            />
                          </div>
                          
                          <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 border border-gray-100 rounded-md overflow-hidden mr-3 sm:mr-4">
                            {hasDiscount && (
                              <div className="absolute top-0 left-0 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 z-10">
                                -{item.discountPercentage}%
                              </div>
                            )}
                            <img 
                              src={item.image} 
                              alt={item.name} 
                              className="w-full h-full object-contain p-1"
                              onError={(e) => {
                                e.target.src = '/images/product-placeholder.png';
                              }}
                            />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col">
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                                <div className="flex-1 min-w-0">
                                  <Link 
                                    to={`/product/${item.productId}`} 
                                    className="font-medium text-sm sm:text-base text-gray-800 hover:text-npc-gold line-clamp-2"
                                  >
                                    {item.name}
                                  </Link>
                                </div>
                                
                                <div className="flex flex-col items-start sm:items-end mt-1 sm:mt-0">
                                  {hasDiscount && (
                                    <div className="flex items-center mb-1">
                                      <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full mr-1">
                                        DISCOUNT
                                      </span>
                                      <span className="text-gray-500 text-xs line-through">
                                        {formatPrice(item.price)}
                                      </span>
                                    </div>
                                  )}
                                  <div className="text-npc-navy font-bold text-base sm:text-lg">
                                    {formatPrice(discountedPrice)}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                                <div className="flex items-center col-span-2 sm:col-span-1">
                                  <span className="text-xs text-gray-500 mr-1">Category:</span>
                                  <span className="text-xs font-medium bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                                    {getCategoryName(item.categoryId)}
                                  </span>
                                </div>
                                
                                {item.sku && (
                                  <div className="text-xs text-gray-500 col-span-2 sm:col-span-1">
                                    SKU: <span className="font-medium text-gray-700">{item.sku}</span>
                                  </div>
                                )}
                                
                                <div className="flex items-center col-span-2 mt-1">
                                  <span className="text-xs text-gray-500 mr-1.5">Rating:</span>
                                  <div className="flex">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <i 
                                        key={i}
                                        className={`fas fa-star text-xs ${
                                          i < Math.round(item.rating) ? 'text-yellow-400' : 'text-gray-300'
                                        }`}
                                      ></i>
                                    ))}
                                    <span className="ml-1.5 text-xs text-gray-500">
                                      ({item.rating.toFixed(1)}) {item.reviews} reviews
                                    </span>
                                  </div>
                                </div>
                                
                                {item.description && (
                                  <div className="text-xs text-gray-600 col-span-2 mt-1 line-clamp-2">
                                    {truncateText(item.description, 100)}
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex flex-wrap justify-between items-center mt-3 pt-2 border-t border-gray-100">
                                <div className="flex items-center space-x-2">
                                  <div className="flex items-center border border-gray-200 rounded-md overflow-hidden">
                                    <button 
                                      className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-gray-50 text-gray-600 hover:bg-gray-100 border-r border-gray-200 ${!userCanShop ? 'opacity-50 cursor-not-allowed' : ''}`}
                                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                      disabled={item.quantity <= 1 || !userCanShop}
                                    >
                                      <i className="fas fa-minus text-xs"></i>
                                    </button>
                                    <span className="w-8 h-7 sm:w-10 sm:h-8 flex items-center justify-center bg-white text-center text-gray-800 font-medium text-sm">
                                      {item.quantity}
                                    </span>
                                    <button 
                                      className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-gray-50 text-gray-600 hover:bg-gray-100 border-l border-gray-200 ${!userCanShop ? 'opacity-50 cursor-not-allowed' : ''}`}
                                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                      disabled={item.quantity >= item.stock || !userCanShop}
                                    >
                                      <i className="fas fa-plus text-xs"></i>
                                    </button>
                                  </div>
                                  
                                  {item.stock < 10 && (
                                    <span className="text-xs text-amber-600">
                                      Only {item.stock} left
                                    </span>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <div className="text-xs sm:text-sm font-medium text-gray-700">
                                    Subtotal: <span className="text-npc-navy">{formatPrice(discountedPrice * item.quantity)}</span>
                                  </div>
                                  
                                  <button 
                                    className={`btn btn-xs sm:btn-sm btn-ghost text-red-500 ${!userCanShop ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    onClick={() => removeItem(item.id)}
                                    disabled={!userCanShop}
                                  >
                                    <i className="fas fa-trash text-xs mr-1"></i>
                                    Remove
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            <div className="w-full lg:w-1/3">
              <div className="card bg-white shadow-sm rounded-lg overflow-hidden sticky top-16">
                <div className="card-body p-0">
                  <div className="bg-gray-50 p-3 sm:p-4 border-b">
                    <h3 className="text-lg font-bold text-gray-800">Order Summary</h3>
                  </div>
                  
                  <div className="p-3 sm:p-4 border-b max-h-60 overflow-y-auto">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Products ({calculateTotalItems()})</h4>
                    {getSelectedItems().length > 0 ? (
                      <div className="space-y-3">
                        {getSelectedItems().map(item => {
                          const hasDiscount = item.discountPercentage > 0;
                          const discountedPrice = getDiscountedPrice(item);
                          const itemTotal = discountedPrice * item.quantity;
                          
                          return (
                            <div key={item.id} className="flex items-center gap-2">
                              <div className="relative w-10 h-10 flex-shrink-0 border border-gray-100 rounded overflow-hidden">
                                <img 
                                  src={item.image} 
                                  alt={item.name} 
                                  className="w-full h-full object-contain p-1"
                                  onError={(e) => {
                                    e.target.src = '/images/product-placeholder.png';
                                  }}
                                />
                              </div>
                              <div className="flex-1 min-w-0 text-xs">
                                <p className="font-medium text-gray-800 truncate">{item.name}</p>
                                <div className="flex justify-between items-center">
                                  <p className="text-gray-500">
                                    {item.quantity} × {formatPrice(discountedPrice)}
                                    {hasDiscount && (
                                      <span className="ml-1 text-gray-400 line-through text-xs">
                                        ({formatPrice(item.price)})
                                      </span>
                                    )}
                                  </p>
                                  <p className="font-medium text-gray-800">
                                    <span className="text-gray-500 mr-1 text-xs">Subtotal:</span>
                                    {formatPrice(itemTotal)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-md">
                        No products selected
                      </div>
                    )}
                  </div>
                  
                  <div className="p-3 sm:p-4">
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal ({calculateTotalItems()} products)</span>
                        <span className="font-medium text-gray-800">{formatPrice(calculateSubtotal())}</span>
                      </div>
                      
                      <div className="pt-3 border-t">
                        <div className="flex justify-between">
                          <span className="text-gray-800 font-bold">Total</span>
                          <span className="text-npc-gold text-lg sm:text-xl font-bold">{formatPrice(calculateTotal())}</span>
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      className={`btn bg-npc-gold hover:bg-npc-darkGold text-black border-none w-full mb-2 transition-transform active:scale-95 font-bold ${!userCanShop ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={proceedToCheckout}
                      disabled={selectedItems.length === 0 || !userCanShop}
                    >
                      <i className="fas fa-shopping-bag mr-2"></i>
                      Proceed to Checkout
                    </button>
                    
                    <div className="mt-4 text-xs text-gray-500">
                      <p className="text-center">By proceeding with your purchase, you agree to our <span className="text-npc-gold hover:underline cursor-pointer">Terms and Conditions</span>.</p>
                    </div>
                    
                    <div className="mt-4 flex flex-col items-center gap-1">
                      <div className="flex gap-3 justify-center">
                        <i className="fas fa-lock text-gray-400"></i>
                        <i className="fas fa-shield-alt text-gray-400"></i>
                        <i className="fas fa-credit-card text-gray-400"></i>
                      </div>
                      <p className="text-xs text-gray-400 text-center">Secure transaction with SSL encryption</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Cart;