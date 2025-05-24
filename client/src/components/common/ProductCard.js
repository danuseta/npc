import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cartAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../contexts/CartContext';
import { canShop } from '../../utils/canShop';

const ProductCard = ({ product, addToCart, className }) => {
  const { user } = useAuth();
  const { updateCartCount } = useCart();
  const navigate = useNavigate();
  const userCanShop = user ? canShop(user.role) : true;
  
  const [isInCart, setIsInCart] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  
  useEffect(() => {
    if (!user || !userCanShop) return;
    
    const checkIfInCart = async () => {
      try {
        const response = await cartAPI.getCart();
        if (response?.data?.data?.items) {
          const cartItems = response.data.data.items;
          const inCart = cartItems.some(item => item.productId === product.id);
          setIsInCart(inCart);
        }
      } catch (error) {
        console.error('Error checking cart status:', error);
      }
    };
    
    checkIfInCart();
  }, [product.id, userCanShop, user]);
  
  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };
  
  const displayPrice = product.discountedPrice || product.price;
  const hasDiscount = product.discount > 0;
  const imageUrl = product.image || product.imageUrl || '/images/product-placeholder.png';

  const handleAddToCart = async (e) => {
    e.preventDefault();
    
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (!userCanShop) {
      return;
    }
    
    if (product.stock > 0) {
      if (addToCart) {
        addToCart(product);
      } else {
        try {
          await cartAPI.addItemToCart({
            productId: product.id,
            quantity: 1
          });
          
          updateCartCount();
          
          window.Swal?.fire({
            title: 'Added to Cart!',
            text: `${product.name} has been added to your cart.`,
            icon: 'success',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
          });
        } catch (error) {
          console.error('Error adding to cart:', error);
          window.Swal?.fire({
            title: 'Failed to Add!',
            text: 'There was an error adding the product to your cart.',
            icon: 'error',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
          });
        }
      }
      
      setIsInCart(true);
    }
  };
  
  return (
    <div className={`card bg-white hover:shadow-md transition-all duration-300 rounded-lg overflow-hidden h-full ${className || ''} group border border-gray-100`}>
      <div className="relative h-36 sm:h-40 md:h-48 overflow-hidden">
        {hasDiscount && (
          <div className="absolute top-1 sm:top-2 left-1 sm:left-2 z-10 bg-red-500 text-white py-0.5 px-1.5 sm:py-1 sm:px-2 rounded-full text-[10px] sm:text-xs font-semibold">
            -{product.discount}%
          </div>
        )}
        
        {isInCart && (
          <div className="absolute top-1 sm:top-2 right-1 sm:right-2 z-10 bg-green-500 text-white py-0.5 px-1.5 sm:py-1 sm:px-2 rounded-full text-[10px] sm:text-xs font-semibold">
            In Cart
          </div>
        )}
        
        {user && !userCanShop && (
          <div className="absolute bottom-1 sm:bottom-2 right-1 sm:right-2 z-10 bg-blue-500 text-white py-0.5 px-1.5 sm:py-1 sm:px-2 rounded-full text-[10px] sm:text-xs font-semibold">
            Admin View
          </div>
        )}
        
        <Link to={`/product/${product.id}`} className="h-full">
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-npc-gold"></div>
            </div>
          )}
          
          <img 
            src={imageUrl} 
            alt={product.name} 
            className="object-contain w-full h-full p-1 transform group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onLoad={() => setImageLoading(false)}
            onError={(e) => {
              setImageLoading(false);
              e.target.src = '/images/product-placeholder.png';
            }}
          />
        </Link>
      </div>
      
      <div className="card-body p-3 sm:p-4 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-1">
            <span className="text-[10px] sm:text-xs font-medium px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800 truncate max-w-[60%]">
              {product.category || 'Uncategorized'}
            </span>
            {product.rating > 0 && (
              <div className="flex items-center gap-0.5 sm:gap-1">
                <i className="fas fa-star text-yellow-400 text-[10px] sm:text-xs"></i>
                <span className="text-[10px] sm:text-xs font-medium text-gray-600">{parseFloat(product.rating).toFixed(1)}</span>
              </div>
            )}
          </div>
          
          <h2 className="font-medium text-xs sm:text-sm text-gray-800 line-clamp-2 h-8 sm:h-10 mb-1 sm:mb-2 mt-1 hover:text-npc-gold transition-colors">
            <Link to={`/product/${product.id}`}>
              {product.name}
            </Link>
          </h2>
        </div>
        
        <div>
          <div className="flex flex-col mb-2 sm:mb-3">
            <span className="text-base sm:text-lg font-bold text-npc-navy">
              {formatPrice(displayPrice)}
            </span>
            {hasDiscount && (
              <span className="text-[10px] sm:text-xs text-gray-500 line-through">
                {formatPrice(product.price)}
              </span>
            )}
          </div>
          
          <div className="space-y-1 sm:space-y-2">
            <button 
              onClick={handleAddToCart}
              className={`text-[10px] sm:text-xs py-1 sm:py-1.5 px-2 sm:px-3 rounded font-medium w-full flex items-center justify-center gap-1 sm:gap-2 shadow-sm hover:shadow ${
                user && !userCanShop ? 'bg-gray-400 hover:bg-gray-500 cursor-not-allowed' : 'bg-npc-gold hover:bg-npc-darkGold'
              } text-white border-none transition-colors`}
              disabled={product.stock === 0 || (user && !userCanShop)}
            >
              <i className="fas fa-shopping-cart text-[10px] sm:text-xs"></i>
              {user ? (!userCanShop ? 'Admin Mode' : product.stock > 0 ? 'Add to Cart' : 'Out of Stock') : 'Login to Add'}
            </button>
            
            {product.stock <= 5 && product.stock > 0 && (
              <div className="text-[10px] sm:text-xs text-orange-500 flex items-center gap-0.5 sm:gap-1">
                <i className="fas fa-exclamation-circle"></i>
                <span>Only {product.stock} left</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;