import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ProductCard from '../../components/common/ProductCard';
import { productAPI, cartAPI, reviewAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../contexts/CartContext';
import { canShop } from '../../utils/canShop';
import Swal from 'sweetalert2';

const ProductDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { updateCartCount } = useCart();
  const navigate = useNavigate();
  const userCanShop = user ? canShop(user.role) : true;
  const isLoggedIn = !!user;
  const isAdmin = user && !canShop(user.role);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('description');
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState(null);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const imageViewerRef = useRef(null);
  const [debug, setDebug] = useState({
    productResponse: null,
    reviewsResponse: null,
    relatedResponse: null,
    error: null
  });
  
  useEffect(() => {
    fetchProductDetails();
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    window.Swal = Swal;
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (imageViewerOpen && imageViewerRef.current && !imageViewerRef.current.contains(event.target)) {
        setImageViewerOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [imageViewerOpen]);
  
  const fetchProductDetails = async () => {
    setLoading(true);
    
    try {
      const productResponse = await productAPI.getProductById(id);
      setDebug(prev => ({...prev, productResponse}));
      let productData;
      if (productResponse?.data?.data) {
        productData = productResponse.data.data;
      } else if (productResponse?.data) {
        productData = productResponse.data;
      } else {
        console.error('Unexpected product response format:', productResponse);
        throw new Error('Invalid product data format');
      }
      setProduct(productData);
      try {
        const reviewsResponse = await reviewAPI.getProductReviews(id, { limit: 5 });
        setDebug(prev => ({...prev, reviewsResponse}));
        let reviewsData;
        if (reviewsResponse?.data?.data) {
          reviewsData = {
            data: reviewsResponse.data.data,
            statistics: reviewsResponse.data.statistics
          };
        } else if (reviewsResponse?.data) {
          reviewsData = reviewsResponse.data;
        } else {
          console.warn('Unexpected reviews response format:', reviewsResponse);
          reviewsData = { data: [], statistics: null };
        }
        setReviews(reviewsData.data || []);
        setReviewStats(reviewsData.statistics || null);
      } catch (reviewError) {
        console.error('Error fetching reviews:', reviewError);
        setReviews([]);
        setReviewStats(null);
      }
      if (productData.categoryId) {
        try {
          const relatedResponse = await productAPI.getProductsByCategory(productData.categoryId, { limit: 4 });
          setDebug(prev => ({...prev, relatedResponse}));
          let relatedData;
          if (relatedResponse?.data?.data) {
            relatedData = relatedResponse.data.data;
          } else if (relatedResponse?.data) {
            relatedData = relatedResponse.data;
          } else {
            console.warn('Unexpected related products response format:', relatedResponse);
            relatedData = [];
          }
          relatedData = relatedData.filter(p => p.id !== parseInt(id));
          setRelatedProducts(relatedData);
        } catch (relatedError) {
          console.error('Error fetching related products:', relatedError);
          setRelatedProducts([]);
        }
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
      setDebug(prev => ({...prev, error}));
    } finally {
      setLoading(false);
    }
  };
  
  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (value > 0 && value <= (product?.stock || 1)) {
      setQuantity(value);
    }
  };
  
  const increaseQuantity = () => {
    if (quantity < (product?.stock || 1)) {
      setQuantity(quantity + 1);
    }
  };
  
  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };
  
  const addToCart = async () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    if (!userCanShop) {
      window.Swal?.fire({
        title: 'Not Allowed',
        text: 'As an Admin, you cannot add products to cart.',
        icon: 'info',
      });
      return;
    }
    try {
      await cartAPI.addItemToCart({
        productId: product.id,
        quantity: quantity
      });
      
      updateCartCount();
      
      window.Swal?.fire({
        title: 'Added to Cart!',
        text: `${product.name} (x${quantity}) has been added to your cart.`,
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
        text: 'There was an error adding the product to cart.',
        icon: 'error',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    }
  };
  
  const buyNow = async () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    if (!userCanShop) {
      window.Swal?.fire({
        title: 'Not Allowed',
        text: 'As an Admin, you cannot make purchases.',
        icon: 'info',
      });
      return;
    }
    try {
      await cartAPI.addItemToCart({
        productId: product.id,
        quantity: quantity
      });
      window.location.href = '/checkout';
    } catch (error) {
      console.error('Error processing buy now:', error);
      window.Swal?.fire({
        title: 'Failed!',
        text: 'There was an error processing your purchase.',
        icon: 'error',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    }
  };
  
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };
  
  const calculateDiscount = (original, current) => {
    if (!original || original <= current) return 0;
    return Math.round(((original - current) / original) * 100);
  };
  
  const toggleImageViewer = () => {
    setImageViewerOpen(!imageViewerOpen);
  };
  
  const showDebugInfo = () => {
    if (process.env.NODE_ENV !== 'development') return null;
    return (
      <div className="bg-gray-800 text-white p-4 my-4 rounded-lg overflow-auto" style={{maxHeight: '300px'}}>
        <h3 className="text-lg font-bold mb-2">Debug Information</h3>
        <p>Product ID: {id}</p>
        <p>Product loaded: {product ? 'Yes' : 'No'}</p>
        <p>Reviews loaded: {reviews.length}</p>
        <p>Related products loaded: {relatedProducts.length}</p>
        <p>User can shop: {userCanShop ? 'Yes' : 'No'}</p>
        {debug.error && (
          <div className="mt-2">
            <p className="text-red-400">Error: {debug.error.message}</p>
            <pre className="text-xs mt-1">{debug.error.stack}</pre>
          </div>
        )}
      </div>
    );
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center pt-16 sm:pt-20">
        <div className="flex flex-col items-center">
          <span className="loading loading-spinner loading-lg text-npc-gold mb-4"></span>
          <p className="text-gray-500 text-sm sm:text-base">Loading product details...</p>
        </div>
      </div>
    );
  }
  
  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center pt-16 sm:pt-20">
        <div className="card bg-white shadow-sm p-6 sm:p-8 text-center max-w-sm sm:max-w-lg mx-3">
          <div className="bg-red-100 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-exclamation-circle text-red-500 text-2xl sm:text-3xl"></i>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mb-2">Product Not Found</h2>
          <p className="text-gray-600 mb-6 text-sm sm:text-base">
            We couldn't find the product you're looking for.
          </p>
          <Link to="/products" className="btn btn-primary">
            Back to Product List
          </Link>
        </div>
      </div>
    );
  }
  
  const discountedPrice = product.discountPercentage > 0 ? 
  (product.price * (1 - product.discountPercentage / 100)) : product.price;
  
  const productImages = [
    product.imageUrl,
    ...(product.gallery && Array.isArray(product.gallery) ? 
        product.gallery.map(img => typeof img === 'string' ? img : img.url) : 
        [])
  ].filter(Boolean);
  
  return (
    <div className="min-h-screen bg-gray-50 pt-6 sm:pt-8 md:pt-10">
      <main className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
        {isAdmin && (
          <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-3 sm:p-4 mb-3 sm:mb-4 rounded text-sm">
            <div className="flex items-center">
              <div className="py-1">
                <i className="fas fa-info-circle mr-2"></i>
                <span className="font-medium">Admin Mode:</span> You are viewing this page as Admin. Purchase features are disabled.
              </div>
            </div>
          </div>
        )}
        <div className="text-xs sm:text-sm breadcrumbs mb-2 sm:mb-3 overflow-x-auto whitespace-nowrap">
          <ul>
            <li><Link to="/" className="text-gray-600 hover:text-npc-gold">Home</Link></li>
            <li><Link to="/products" className="text-gray-600 hover:text-npc-gold">Products</Link></li>
            <li className="text-npc-gold truncate max-w-[150px] sm:max-w-none">{product.name}</li>
          </ul>
        </div>
        <div className="card bg-white shadow-sm mb-4 rounded-lg overflow-hidden">
          <div className="card-body p-0">
            <div className="flex flex-col md:flex-row md:gap-4">
              <div className="w-full md:w-1/2 p-3 sm:p-4">
                <div className="relative">
                  {product.discountPercentage > 0 && (
                    <div className="absolute top-2 left-2 z-10 bg-red-500 text-white py-1 px-2 sm:px-3 rounded-full text-xs font-medium">
                      -{product.discountPercentage}%
                    </div>
                  )}
                  <button 
                    className="absolute top-2 right-2 z-10 bg-white bg-opacity-70 hover:bg-opacity-100 p-2 rounded-full text-gray-700 hover:text-npc-gold transition-all duration-200"
                    onClick={toggleImageViewer}
                    aria-label="View larger image"
                  >
                    <i className="fas fa-eye"></i>
                  </button>
                  <div className="h-56 sm:h-64 md:h-72 lg:h-80 flex items-center justify-center rounded-lg overflow-hidden bg-white border border-gray-100">
                    <img 
                      src={productImages[selectedImage] || '/images/product-placeholder.png'} 
                      alt={product.name} 
                      className="max-h-full max-w-full object-contain p-4 cursor-pointer"
                      onClick={toggleImageViewer}
                      onError={(e) => {
                        e.target.src = '/images/product-placeholder.png';
                      }}
                    />
                  </div>
                </div>
                {productImages.length > 1 && (
                  <div className="flex gap-2 mt-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    {productImages.map((image, index) => (
                      <div 
                        key={index}
                        className={`cursor-pointer w-12 h-12 sm:w-14 sm:h-14 border rounded-lg overflow-hidden flex-shrink-0 ${
                          selectedImage === index ? 'border-npc-gold border-2' : 'border-gray-200'
                        } bg-white`}
                        onClick={() => setSelectedImage(index)}
                      >
                        <img 
                          src={image} 
                          alt={`${product.name} - View ${index + 1}`} 
                          className="w-full h-full object-contain p-1"
                          onError={(e) => {
                            e.target.src = '/images/product-placeholder.png';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="w-full md:w-1/2 p-3 sm:p-4">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-npc-navy mb-2">{product.name}</h1>
                <div className="flex items-center gap-2 mb-2">
                  <div className="rating rating-sm">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <input 
                        key={i} 
                        type="radio" 
                        name="rating-product" 
                        className="mask mask-star-2 bg-yellow-400" 
                        checked={Math.floor(product.avgRating || 0) === i + 1}
                        readOnly
                      />
                    ))}
                  </div>
                  <span className="text-gray-600 text-xs sm:text-sm">
                    {parseFloat(product.avgRating || 0).toFixed(1)} ({product.reviewCount || 0} reviews)
                  </span>
                </div>
                <div className="mb-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl sm:text-2xl font-bold text-npc-navy">
                      {formatPrice(discountedPrice)}
                    </span>
                    {product.discountPercentage > 0 && (
                      <span className="text-gray-500 line-through text-xs sm:text-sm">
                        {formatPrice(product.price)}
                      </span>
                    )}
                  </div>
                </div>
                {product.description && (
                  <div className="mb-3">
                    <p className="text-gray-700 text-xs sm:text-sm">
                      {product.description.substring(0, 150)}
                      {product.description.length > 150 ? '...' : ''}
                    </p>
                  </div>
                )}
                <div className="flex flex-wrap gap-3 sm:gap-4 mb-3">
                  <div className="flex items-center gap-2">
                    <i className={`fas fa-box ${product.stock > 0 ? 'text-green-500' : 'text-red-500'}`}></i>
                    <span className="text-gray-700 text-xs sm:text-sm">
                      Stock: <span className="font-medium text-gray-800">
                        {product.stock > 0 ? `${product.stock} available` : 'Out of stock'}
                      </span>
                    </span>
                  </div>
                  {product.Category && (
                    <div className="flex items-center gap-2">
                      <i className="fas fa-tag text-npc-gold"></i>
                      <span className="text-gray-700 text-xs sm:text-sm">
                        Category: <span className="font-medium text-gray-800">{product.Category.name}</span>
                      </span>
                    </div>
                  )}
                </div>
                <div className="divider my-2 sm:my-3"></div>
                <div className="mb-3">
                  <div className="flex items-center gap-3 mb-3 sm:mb-4">
                    <span className="text-gray-700 text-sm">Quantity:</span>
                    <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
                      <button 
                        className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-gray-100 text-gray-700 hover:bg-gray-200 border-r border-gray-300"
                        onClick={decreaseQuantity}
                        disabled={quantity <= 1 || !userCanShop}
                      >
                        -
                      </button>
                      <span className="w-10 h-8 sm:w-12 sm:h-10 flex items-center justify-center bg-white text-center text-gray-800 font-medium">
                        {quantity}
                      </span>
                      <button 
                        className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-gray-100 text-gray-700 hover:bg-gray-200 border-l border-gray-300"
                        onClick={increaseQuantity}
                        disabled={quantity >= product.stock || !userCanShop}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button 
                      className="w-full sm:flex-1 btn btn-sm sm:btn-md btn-outline normal-case border-npc-gold text-npc-gold hover:bg-npc-gold hover:text-white hover:border-npc-gold"
                      onClick={addToCart}
                      disabled={product.stock <= 0}
                    >
                      <i className="fas fa-shopping-cart mr-2"></i>
                      {!isLoggedIn ? 'Login to Add' : isAdmin ? 'Admin Mode' : 'Add to Cart'}
                    </button>
                    <button 
                      className="w-full sm:flex-1 btn btn-sm sm:btn-md normal-case text-white border-none bg-npc-gold hover:bg-npc-darkGold"
                      onClick={buyNow}
                      disabled={product.stock <= 0}
                    >
                      <i className="fas fa-bolt mr-2"></i>
                      {!isLoggedIn ? 'Login to Buy' : isAdmin ? 'Admin Mode' : 'Buy Now'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="card bg-white shadow-sm mb-4 rounded-lg">
          <div className="card-body p-0">
            <div className="flex overflow-x-auto border-b">
              <button 
                className={`px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 hover:text-npc-gold flex-shrink-0 border-b-2 ${activeTab === 'description' ? 'border-npc-gold text-npc-gold' : 'border-transparent'}`}
                onClick={() => setActiveTab('description')}
              >
                Description
              </button>
              <button 
                className={`px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 hover:text-npc-gold flex-shrink-0 border-b-2 ${activeTab === 'specifications' ? 'border-npc-gold text-npc-gold' : 'border-transparent'}`}
                onClick={() => setActiveTab('specifications')}
              >
                Specifications
              </button>
              <button 
                className={`px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 hover:text-npc-gold flex-shrink-0 border-b-2 ${activeTab === 'features' ? 'border-npc-gold text-npc-gold' : 'border-transparent'}`}
                onClick={() => setActiveTab('features')}
              >
                Features
              </button>
              <button 
                className={`px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 hover:text-npc-gold flex-shrink-0 border-b-2 ${activeTab === 'reviews' ? 'border-npc-gold text-npc-gold' : 'border-transparent'}`}
                onClick={() => setActiveTab('reviews')}
              >
                Reviews ({product.reviewCount || 0})
              </button>
            </div>
                    
            <div className="p-3 sm:p-4">
              {activeTab === 'description' && (
                <div className="prose max-w-none text-gray-700 text-sm sm:text-base">
                  {product.description ? (
                    typeof product.description === 'string' && product.description.startsWith('<') ?
                      <div dangerouslySetInnerHTML={{ __html: product.description }} /> :
                      <p>{product.description}</p>
                  ) : (
                    <p>No description available for this product.</p>
                  )}
                </div>
              )}
              
              {activeTab === 'specifications' && (
                <div className="overflow-x-auto">
                  {product.specifications && Object.keys(product.specifications).length > 0 ? (
                    <table className="table w-full text-sm">
                      <tbody>
                        {Object.entries(product.specifications).map(([key, value], index) => (
                          <tr key={key} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                            <td className="font-medium capitalize w-1/3 text-gray-700 py-2 text-xs sm:text-sm">
                              {key.replace(/_/g, ' ')}
                            </td>
                            <td className="text-gray-700 py-2 text-xs sm:text-sm">{value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-gray-600 text-sm">No specifications available for this product.</p>
                  )}
                </div>
              )}
              
              {activeTab === 'features' && (
                <div>
                  {product.features && product.features.length > 0 ? (
                    <ul className="space-y-2">
                      {product.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <i className="fas fa-check-circle text-green-500 mt-1 mr-2"></i>
                          <span className="text-gray-700 text-sm sm:text-base">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-600 text-sm">No features available for this product.</p>
                  )}
                </div>
              )}
              
              {activeTab === 'reviews' && (
                <div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <div className="text-center mr-0 sm:mr-4">
                      <div className="text-2xl sm:text-3xl font-bold text-npc-navy">{parseFloat(reviewStats?.avgRating || 0).toFixed(1)}</div>
                      <div className="rating rating-sm">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <input 
                            key={i} 
                            type="radio" 
                            name="rating-overview" 
                            className="mask mask-star-2 bg-yellow-400" 
                            checked={Math.floor(reviewStats?.avgRating || 0) === i + 1}
                            readOnly
                          />
                        ))}
                      </div>
                      <div className="text-xs text-gray-600">{reviewStats?.totalReviews || 0} reviews</div>
                    </div>
                    
                    <div className="flex-1 w-full sm:w-auto">
                      {reviewStats?.breakdown && Object.entries(reviewStats.breakdown)
                        .sort((a, b) => b[0] - a[0])
                        .map(([rating, count]) => {
                          const percentage = (count / reviewStats.totalReviews) * 100;
                          return (
                            <div key={rating} className="flex items-center mb-1">
                              <span className="w-12 text-xs text-gray-700">{rating} stars</span>
                              <div className="flex-1 h-2 bg-gray-200 rounded mx-2">
                                <div className="h-2 bg-yellow-400 rounded" style={{ width: `${percentage}%` }}></div>
                              </div>
                              <span className="w-8 text-xs text-gray-700">{percentage.toFixed(0)}%</span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                  {reviews.length > 0 ? (
                    reviews.map(review => (
                      <div key={review.id} className="card bg-white border border-gray-100 rounded-lg mb-3 sm:mb-4">
                        <div className="card-body p-3 sm:p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="avatar">
                              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full">
                                {review.User?.profileImage ? (
                                  <img 
                                    src={review.User.profileImage} 
                                    alt={review.User.name}
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-npc-gold text-white flex items-center justify-center font-bold text-xs sm:text-sm">
                                    {review.User?.name ? review.User.name[0].toUpperCase() : 'U'}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div>
                              <div className="font-medium text-gray-800 text-xs sm:text-sm">{review.User?.name || 'User'}</div>
                              <div className="text-xs text-gray-500">
                                {new Date(review.createdAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </div>
                            </div>
                            <div className="ml-auto">
                              <div className="rating rating-xs">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <input
                                    key={i}
                                    type="radio"
                                    name={`review-${review.id}-rating`}
                                    className="mask mask-star-2 bg-yellow-400"
                                    checked={i === review.rating - 1}
                                    readOnly
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                          {review.title && (
                            <h4 className="font-medium text-gray-800 text-sm sm:text-base">{review.title}</h4>
                          )}
                          <p className="text-xs sm:text-sm text-gray-700">
                            {review.comment}
                          </p>
                          {review.images && review.images.length > 0 && (
                            <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                              {review.images.map((image, index) => (
                                <div key={index} className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden flex-shrink-0">
                                  <img 
                                    src={typeof image === 'string' ? image : image.url} 
                                    alt={`Review image ${index + 1}`}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.src = '/images/product-placeholder.png';
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-gray-500 text-sm">No reviews yet for this product.</p>
                    </div>
                  )}
                  {reviews.length > 0 && reviewStats?.totalReviews > reviews.length && (
                    <button 
                      className="btn btn-outline btn-sm normal-case text-gray-700 w-full sm:w-auto"
                      onClick={() => setActiveTab('reviews')}
                    >
                      View All Reviews
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        {relatedProducts.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-npc-navy mb-3 sm:mb-4">
              Related Products
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
              {relatedProducts.map(product => (
                <ProductCard 
                  key={product.id} 
                  product={{
                    id: product.id,
                    name: product.name,
                    imageUrl: product.imageUrl,
                    price: product.price,
                    originalPrice: product.discountPercentage ? (product.price / (1 - product.discountPercentage / 100)) : null,
                    discount: product.discountPercentage,
                    rating: product.avgRating || 0,
                    reviews: product.reviewCount || 0,
                    category: product.Category?.name || '',
                    stock: product.stock
                  }}
                  addToCart={() => {
                    if (!userCanShop) {
                      window.Swal?.fire({
                        title: 'Not Allowed',
                        text: 'As an Admin, you cannot add products to cart.',
                        icon: 'info',
                      });
                      return;
                    }
                    cartAPI.addItemToCart({
                      productId: product.id,
                      quantity: 1
                    }).then(() => {
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
                    }).catch(error => {
                      console.error('Error adding related product to cart:', error);
                    });
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </main>
      {imageViewerOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-2 sm:p-4"
          onClick={() => setImageViewerOpen(false)}
        >
          <div 
            className="relative max-w-4xl w-full max-h-screen"
            onClick={(e) => e.stopPropagation()}
            ref={imageViewerRef}
          >
            <button 
              type="button"
              className="absolute top-0 right-0 m-2 sm:m-4 text-white bg-black bg-opacity-70 rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center hover:bg-opacity-90 z-10 focus:outline-none"
              onClick={() => setImageViewerOpen(false)}
              aria-label="Close"
            >
              <i className="fas fa-times"></i>
            </button>
            <div className="bg-white p-2 rounded-lg">
              <div className="relative h-[40vh] sm:h-[60vh] md:h-[70vh] flex items-center justify-center">
                <img 
                  src={productImages[selectedImage]} 
                  alt={product.name} 
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              {productImages.length > 1 && (
                <div className="flex justify-center gap-2 mt-3 sm:mt-4 bg-gray-100 p-2 rounded-lg overflow-x-auto">
                  {productImages.map((image, index) => (
                    <div 
                      key={index}
                      className={`cursor-pointer w-12 h-12 sm:w-16 sm:h-16 border rounded-lg overflow-hidden ${
                        selectedImage === index ? 'border-npc-gold border-2' : 'border-gray-200'
                      }`}
                      onClick={() => setSelectedImage(index)}
                    >
                      <img 
                        src={image} 
                        alt={`${product.name} - Thumbnail ${index + 1}`} 
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;