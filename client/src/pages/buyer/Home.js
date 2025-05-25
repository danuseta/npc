import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ProductCard from '../../components/common/ProductCard';
import Carousel from '../../components/ui/Carousel';
import { productAPI, categoryAPI, cartAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../contexts/CartContext';
import { canShop } from '../../utils/canShop';
import api from '../../services/api'; 
import Swal from 'sweetalert2'; 

import { HiDesktopComputer, HiChip } from 'react-icons/hi';
import { MdLaptop, MdHeadset, MdMouse, MdKeyboard, MdStorage, MdSdStorage, MdMonitor, MdGamepad, MdRouter, MdCable, MdPower } from 'react-icons/md';
import { FiCpu, FiMonitor, FiSpeaker } from 'react-icons/fi';
import { BsFan, BsMotherboard, BsGpuCard, BsWebcam } from 'react-icons/bs';
import { GiComputerFan, GiSoundWaves } from 'react-icons/gi';
import { FaMemory, FaNetworkWired, FaServer, FaChair, FaLightbulb } from 'react-icons/fa';
import { AiFillThunderbolt, AiFillTool } from 'react-icons/ai';
import { BiMicrophone, BiJoystick } from 'react-icons/bi';
import { LuPcCase } from "react-icons/lu";

const Home = () => {
  const { user } = useAuth();
  const { updateCartCount } = useCart();
  const [latestProducts, setLatestProducts] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [carouselSlides, setCarouselSlides] = useState([]);
  const [carouselLoading, setCarouselLoading] = useState(true);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [debug, setDebug] = useState({
    latestResponse: null,
    popularResponse: null,
    categoriesResponse: null,
    error: null
  });
  
  useEffect(() => {
    window.Swal = Swal;
  }, []);
    
  const userCanShop = user ? canShop(user.role) : true;
    
  useEffect(() => {
    const fetchCarouselData = async () => {
      try {
        setCarouselLoading(true);
        
        const response = await api.get('/carousel');
        
        const activeSlides = response.data.data
          .filter(slide => slide.isActive)
          .sort((a, b) => a.displayOrder - b.displayOrder);
        
        console.log('Carousel slides loaded:', activeSlides);
        setCarouselSlides(activeSlides);
      } catch (error) {
        console.error('Error fetching carousel slides:', error);
        setCarouselSlides([
          {
            id: 1,
            title: "20% Discount Voucher for Gaming PCs",
            description: "Get the best gaming experience with high-quality components at affordable prices.",
            tag: "Limited Offer",
            buttonText: "Shop Now",
            buttonLink: "/products",
            imageUrl: "/images/laptop-banner.png"
          }
        ]);
      } finally {
        setCarouselLoading(false);
      }
    };
      
    fetchCarouselData();
  }, []);
    
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        console.log('Fetching latest products...');
        const latestResponse = await productAPI.getAllProducts({
          limit: 5,
          sort: 'createdAt',
          order: 'DESC'
        });
        
        console.log('Fetching popular products...');
        let popularResponse;
        try {
          popularResponse = await productAPI.getPopularProducts({
            limit: 5
          });
        } catch (error) {
          console.log('Error fetching popular products, falling back to regular products');
          console.error('Error:', error);
          popularResponse = await productAPI.getAllProducts({
            limit: 5,
            sort: 'createdAt',
            order: 'DESC'
          });
        }
        
        console.log('Fetching categories...');
        const categoriesResponse = await categoryAPI.getAllCategories();
        
        setDebug({
          latestResponse,
          popularResponse,
          categoriesResponse,
          error: null
        });
        
        console.log('Latest products response:', latestResponse);
        console.log('Popular products response:', popularResponse);
        console.log('Categories response:', categoriesResponse);
        
        const mapProductData = (products) => {
          if (!products || !Array.isArray(products)) {
            console.error('Products data is not an array:', products);
            return [];
          }
          
          return products.map(product => {
            console.log('Mapping product:', product);
            
            const mappedProduct = {
              id: product.id,
              name: product.name || 'Unnamed Product',
              imageUrl: product.imageUrl || '/images/product-placeholder.png',
              price: parseFloat(product.price) || 0,
              discountedPrice: product.discountPercentage > 0 
                ? (parseFloat(product.price) * (1 - (parseFloat(product.discountPercentage) / 100)))
                : parseFloat(product.price),
              discount: parseFloat(product.discountPercentage) || 0,
              rating: product.avgRating || 0,
              reviews: product.reviewCount || 0,
              category: product.Category?.name || product.category || 'Uncategorized',
              stock: parseInt(product.stock) || 0,
              totalSold: product.totalSold || 0
            };
            
            console.log('Mapped to:', mappedProduct);
            return mappedProduct;
          });
        };
        
        let categoriesData = [];
        
        if (categoriesResponse?.data?.data && Array.isArray(categoriesResponse.data.data)) {
          categoriesData = categoriesResponse.data.data;
        } else if (categoriesResponse?.data && Array.isArray(categoriesResponse.data)) {
          categoriesData = categoriesResponse.data;
        } else if (categoriesResponse?.data) {
          console.log('Categories response format different than expected:', categoriesResponse.data);
          
          const keys = Object.keys(categoriesResponse.data);
          if (keys.includes('data') && Array.isArray(categoriesResponse.data.data)) {
            categoriesData = categoriesResponse.data.data;
          }
        }
        
        console.log('Categories data extracted:', categoriesData);
        
        const transformedCategories = categoriesData.map(category => {
          console.log('Transforming category:', category);
          return {
            id: category.id,
            name: category.name,
            icon: getCategoryIcon(category.name),
            imageUrl: category.imageUrl
          };
        });
        
        console.log('Transformed categories:', transformedCategories);
        
        let latestProductsData = [];
        if (latestResponse?.data?.data && Array.isArray(latestResponse.data.data)) {
          latestProductsData = latestResponse.data.data;
        } else if (latestResponse?.data && Array.isArray(latestResponse.data)) {
          latestProductsData = latestResponse.data;
        }
        
        console.log('Latest products data extracted:', latestProductsData);
        const mappedLatestProducts = mapProductData(latestProductsData);
        console.log('Mapped latest products:', mappedLatestProducts);
        setLatestProducts(mappedLatestProducts);
        
        if (popularResponse?.data?.data && Array.isArray(popularResponse.data.data)) {
          console.log('Popular products data found in response.data.data');
          const mappedPopularProducts = mapProductData(popularResponse.data.data);
          console.log('Mapped popular products:', mappedPopularProducts);
          setPopularProducts(mappedPopularProducts);
        } else if (popularResponse?.data && Array.isArray(popularResponse.data)) {
          console.log('Popular products data found in response.data');
          const mappedPopularProducts = mapProductData(popularResponse.data);
          console.log('Mapped popular products:', mappedPopularProducts);
          setPopularProducts(mappedPopularProducts);
        } else {
          console.log('No popular products data found in expected format');
          setPopularProducts([]);
        }
        
        setCategories(transformedCategories);
        
      } catch (error) {
        console.error('Error fetching data:', error);
        setDebug(prev => ({...prev, error}));
        setLatestProducts([]);
        setPopularProducts([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const getCategoryIcon = (categoryName) => {
    if (!categoryName) return <HiDesktopComputer className="text-npc-gold text-2xl" />;
    
    const name = categoryName.toLowerCase();
    
    if (name.includes('pc') || name === 'pc' || name.includes('computer')) 
      return <HiDesktopComputer className="text-npc-gold text-2xl" />;
    if (name.includes('laptop')) 
      return <MdLaptop className="text-npc-gold text-2xl" />;
    if (name.includes('server')) 
      return <FaServer className="text-npc-gold text-2xl" />;
      
    if (name.includes('processor') || name.includes('cpu')) 
      return <FiCpu className="text-npc-gold text-2xl" />;
    if (name.includes('motherboard') || name.includes('mainboard')) 
      return <BsMotherboard className="text-npc-gold text-2xl" />;
    if (name.includes('graphic') || name.includes('gpu') || name.includes('vga')) 
      return <BsGpuCard className="text-npc-gold text-2xl" />;
    if (name.includes('memory') || name.includes('ram')) 
      return <FaMemory className="text-npc-gold text-2xl" />;
    if (name.includes('storage') || name.includes('ssd') || name.includes('hdd') || name.includes('nvme')) 
      return <MdStorage className="text-npc-gold text-2xl" />;
    if (name.includes('power supply') || name.includes('psu')) 
      return <MdPower className="text-npc-gold text-2xl" />;
    if (name.includes('cooling') || name.includes('fan') || name.includes('cooler')) 
      return <BsFan className="text-npc-gold text-2xl" />;
    if (name.includes('casing') || name.includes('case') || name.includes('chassis')) 
      return <LuPcCase className="text-npc-gold text-2xl" />;
      
    if (name.includes('mouse')) 
      return <MdMouse className="text-npc-gold text-2xl" />;
    if (name.includes('keyboard')) 
      return <MdKeyboard className="text-npc-gold text-2xl" />;
    if (name.includes('headphone') || name.includes('headset')) 
      return <MdHeadset className="text-npc-gold text-2xl" />;
    if (name.includes('microphone') || name.includes('mic')) 
      return <BiMicrophone className="text-npc-gold text-2xl" />;
    if (name.includes('webcam') || name.includes('camera')) 
      return <BsWebcam className="text-npc-gold text-2xl" />;
      
    if (name.includes('monitor') || name.includes('display')) 
      return <MdMonitor className="text-npc-gold text-2xl" />;
    if (name.includes('speaker') || name.includes('audio')) 
      return <FiSpeaker className="text-npc-gold text-2xl" />;
      
    if (name.includes('gaming') || name.includes('game')) 
      return <MdGamepad className="text-npc-gold text-2xl" />;
    if (name.includes('controller') || name.includes('joystick')) 
      return <BiJoystick className="text-npc-gold text-2xl" />;
    if (name.includes('chair') || name.includes('kursi')) 
      return <FaChair className="text-npc-gold text-2xl" />;
      
    if (name.includes('network') || name.includes('lan')) 
      return <FaNetworkWired className="text-npc-gold text-2xl" />;
    if (name.includes('router') || name.includes('wifi')) 
      return <MdRouter className="text-npc-gold text-2xl" />;
      
    if (name.includes('cable') || name.includes('kabel')) 
      return <MdCable className="text-npc-gold text-2xl" />;
    if (name.includes('card reader') || name.includes('memory card')) 
      return <MdSdStorage className="text-npc-gold text-2xl" />;
    if (name.includes('tool') || name.includes('toolkit')) 
      return <AiFillTool className="text-npc-gold text-2xl" />;
    if (name.includes('lighting') || name.includes('rgb')) 
      return <FaLightbulb className="text-npc-gold text-2xl" />;
    if (name.includes('charger') || name.includes('power bank')) 
      return <AiFillThunderbolt className="text-npc-gold text-2xl" />;
    
    return <HiDesktopComputer className="text-npc-gold text-2xl" />;
  };
    
  const renderCarouselSlide = (slide, index, options = {}) => {
    const { getImageStyles } = options || {};
    
    return (
      <div className="relative w-full h-full">
        <div className="absolute inset-0 z-0">
          {getImageStyles ? (
            <img 
              src={slide.imageUrl} 
              alt={slide.title} 
              style={getImageStyles(slide)}
              loading="lazy"
              onError={(e) => {
                e.target.src = '/images/product-placeholder.png';
              }}
            />
          ) : (
            <img 
              src={slide.imageUrl} 
              alt={slide.title} 
              className="w-full h-full object-contain"
              loading="lazy"
              onError={(e) => {
                e.target.src = '/images/product-placeholder.png';
              }}
            />
          )}
        </div>
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/50 to-transparent hidden md:flex flex-col justify-center pl-16 sm:pl-20 md:pl-24 pr-4 sm:pr-8 md:pr-12">
          <div className="max-w-lg">
            {slide.tag && (
              <span className="inline-block bg-npc-gold text-white text-xs font-bold px-2 py-1 rounded mb-2">
                {slide.tag}
              </span>
            )}
            <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2 md:mb-4">
              {slide.title}
            </h1>
            <p className="text-sm md:text-base text-white/90 mb-4 md:mb-6 max-w-md">
              {slide.description}
            </p>
            <Link 
              to={slide.buttonLink || '/products'}
              className="btn btn-sm md:btn-md btn-primary bg-npc-gold hover:bg-npc-darkGold border-none inline-flex items-center gap-2"
            >
              {slide.buttonText || 'Shop Now'}
              <i className="fas fa-arrow-right"></i>
            </Link>
          </div>
        </div>
      </div>
    );
  };

  const addToCart = async (product) => {
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
        timerProgressBar: true
      });
    }
  };

  if (loading && carouselLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center pt-16 sm:pt-20">
        <div className="flex flex-col items-center">
          <span className="loading loading-spinner loading-lg text-npc-gold mb-4"></span>
          <p className="text-gray-500">Loading data...</p>
        </div>
      </div>
    );
  }
    
  const showDebugInfo = () => {
    if (process.env.NODE_ENV !== 'development') return null;
    
    return (
      <div className="bg-gray-800 text-white p-4 my-4 rounded-lg overflow-auto" style={{maxHeight: '300px'}}>
        <h3 className="text-lg font-bold mb-2">Debug Information</h3>
        <p>Categories loaded: {categories.length}</p>
        <p>Latest products loaded: {latestProducts.length}</p>
        <p>Popular products loaded: {popularProducts.length}</p>
        <p>Carousel slides loaded: {carouselSlides.length}</p>
        {debug.error && (
          <div className="mt-2">
            <p className="text-red-400">Error: {debug.error.message}</p>
            <pre className="text-xs mt-1">{debug.error.stack}</pre>
          </div>
        )}
      </div>
    );
  };
    
  const fallbackCarouselData = [
    {
      id: "fallback-1",
      title: "20% Discount Voucher for Gaming PCs",
      description: "Get the best gaming experience with high-quality components at affordable prices.",
      tag: "Limited Offer",
      buttonText: "Shop Now",
      buttonLink: "/products",
      imageUrl: "/images/laptop-banner.png"
    }
  ];
    
  const slidesToUse = carouselSlides.length > 0 ? carouselSlides : fallbackCarouselData;
    
  return (
    <div className="min-h-screen bg-gray-50 pt-6 sm:pt-8 md:pt-10">
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="w-full mb-6 sm:mb-10 rounded-lg sm:rounded-2xl overflow-hidden shadow-lg aspect-[16/9] max-h-[400px] mx-auto">
          {carouselLoading ? (
            <div className="bg-gray-100 w-full h-full flex items-center justify-center">
              <span className="loading loading-spinner loading-lg text-npc-gold"></span>
            </div>
          ) : (
            <div className="relative w-full h-full">
              <Carousel 
                slides={slidesToUse}
                renderSlide={renderCarouselSlide}
                autoPlay={true}
                interval={5000}
                showIndicators={true}
                showArrows={true}
                imageMode="contain"
                imagePosition="center"
                fixedHeight={true}
                indicatorContainerClass="flex justify-center w-full gap-2 absolute bottom-4 z-20"
                arrowPrevClass="btn btn-circle btn-sm md:btn-md bg-white/20 border-none text-white hover:bg-white/40 absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 z-30"
                arrowNextClass="btn btn-circle btn-sm md:btn-md bg-white/20 border-none text-white hover:bg-white/40 absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 z-30"
              />
            </div>
          )}
        </div>
        
        <div className="mb-8 sm:mb-10">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-npc-navy">
              Product Categories
            </h2>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3">
            {categories.length > 0 ? (
              <>
                {(showAllCategories ? categories : categories.slice(0, categories.length > 6 ? 6 : 7)).map(category => (
                  <Link 
                    key={category.id} 
                    to={`/products?category=${category.name}`}
                    className="card bg-white hover:shadow-md transition-all border border-gray-100 rounded-xl hover:border-npc-gold/30 group"
                  >
                    <div className="card-body items-center text-center p-2 sm:p-3 md:p-4">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-2 group-hover:bg-npc-gold/10 transition-colors">
                        {getCategoryIcon(category.name)}
                      </div>
                      <span className="text-xs sm:text-sm text-gray-700 font-medium group-hover:text-npc-gold transition-colors line-clamp-1">{category.name}</span>
                    </div>
                  </Link>
                ))}
                
                {categories.length > 6 && !showAllCategories && (
                  <button 
                    onClick={() => setShowAllCategories(true)}
                    className="card bg-white hover:shadow-md transition-all border border-gray-100 rounded-xl hover:border-npc-gold/30 group cursor-pointer"
                  >
                    <div className="card-body items-center text-center p-2 sm:p-3 md:p-4">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-2 group-hover:bg-npc-gold/10 transition-colors">
                        <i className="fas fa-plus text-npc-gold text-lg"></i>
                      </div>
                      <span className="text-xs sm:text-sm text-gray-700 font-medium group-hover:text-npc-gold transition-colors">More</span>
                    </div>
                  </button>
                )}
              </>
            ) : (
              <div className="col-span-full text-center p-4 sm:p-8 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-500 text-sm sm:text-base">
                  Product categories are not available yet. In the meantime, you can view all our products.
                </p>
                <Link 
                  to="/products"
                  className="btn btn-sm mt-3 md:mt-4 bg-npc-gold hover:bg-npc-darkGold border-none"
                >
                  View All Products
                </Link>
              </div>
            )}
          </div>
          
          {showAllCategories && categories.length > 6 && (
            <div className="text-center mt-3 sm:mt-4">
              <button 
                onClick={() => setShowAllCategories(false)}
                className="text-npc-gold hover:underline text-sm font-medium inline-flex items-center"
              >
                Show Less
                <i className="fas fa-chevron-up ml-1"></i>
              </button>
            </div>
          )}
        </div>
        
        <div className="mb-8 sm:mb-12">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-npc-navy">
              Latest Products
            </h2>
            <Link to="/products" className="text-npc-gold hover:underline text-xs sm:text-sm font-medium flex items-center">
              View All <i className="fas fa-chevron-right ml-1 text-xs"></i>
            </Link>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
            {latestProducts.length > 0 ? (
              latestProducts.map(product => (
                <ProductCard 
                  key={product.id} 
                  product={product}
                  addToCart={() => addToCart(product)}
                  userCanShop={userCanShop}
                />
              ))
            ) : (
              <div className="col-span-full text-center p-4 sm:p-8 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-500 text-sm sm:text-base">Latest products are not available yet.</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="mb-8 sm:mb-12">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-npc-navy">
              Popular Products
            </h2>
            <Link to="/products" className="text-npc-gold hover:underline text-xs sm:text-sm font-medium flex items-center">
              View All <i className="fas fa-chevron-right ml-1 text-xs"></i>
            </Link>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
            {popularProducts.length > 0 ? (
              popularProducts.map(product => (
                <ProductCard 
                  key={product.id} 
                  product={product}
                  addToCart={() => addToCart(product)}
                  userCanShop={userCanShop}
                />
              ))
            ) : (
              <div className="col-span-full text-center p-4 sm:p-8 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-500 text-sm sm:text-base">Popular products are not available yet.</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="mb-8 sm:mb-12">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-npc-navy text-center mb-4 sm:mb-8">
            Why Choose Us
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            <div className="card bg-white shadow-sm hover:shadow-md transition-all p-4 sm:p-6 text-center">
              <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-npc-gold/10 flex items-center justify-center mb-3 sm:mb-4">
                <i className="fas fa-check-circle text-npc-gold text-xl sm:text-2xl"></i>
              </div>
              <h3 className="font-bold text-md sm:text-lg mb-1 sm:mb-2 text-npc-navy">Warranty Products</h3>
              <p className="text-gray-600 text-xs sm:text-sm">All our products come with official factory warranty</p>
            </div>
            
            <div className="card bg-white shadow-sm hover:shadow-md transition-all p-4 sm:p-6 text-center">
              <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-npc-gold/10 flex items-center justify-center mb-3 sm:mb-4">
                <i className="fas fa-truck text-npc-gold text-xl sm:text-2xl"></i>
              </div>
              <h3 className="font-bold text-md sm:text-lg mb-1 sm:mb-2 text-npc-navy">Fast Shipping</h3>
              <p className="text-gray-600 text-xs sm:text-sm">Shipping nationwide with express delivery options</p>
            </div>
            
            <div className="card bg-white shadow-sm hover:shadow-md transition-all p-4 sm:p-6 text-center">
              <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-npc-gold/10 flex items-center justify-center mb-3 sm:mb-4">
                <i className="fas fa-headset text-npc-gold text-xl sm:text-2xl"></i>
              </div>
              <h3 className="font-bold text-md sm:text-lg mb-1 sm:mb-2 text-npc-navy">24/7 Support</h3>
              <p className="text-gray-600 text-xs sm:text-sm">Our support team is ready to help you anytime</p>
            </div>
            
            <div className="card bg-white shadow-sm hover:shadow-md transition-all p-4 sm:p-6 text-center">
              <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-npc-gold/10 flex items-center justify-center mb-3 sm:mb-4">
                <i className="fas fa-shield-alt text-npc-gold text-xl sm:text-2xl"></i>
              </div>
              <h3 className="font-bold text-md sm:text-lg mb-1 sm:mb-2 text-npc-navy">Secure Payment</h3>
              <p className="text-gray-600 text-xs sm:text-sm">Various secure and trusted payment methods</p>
            </div>
          </div>
        </div>
        
        <div className="mb-6 sm:mb-8">
          <div className="bg-gradient-to-r from-npc-gold to-npc-brown rounded-lg sm:rounded-2xl p-4 sm:p-6 md:p-8 text-center shadow-lg">
            <h2 className="text-white text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-2 sm:mb-3 md:mb-4">
              Need Help Choosing Components?
            </h2>
            <p className="text-white/90 mb-3 sm:mb-4 md:mb-6 max-w-lg mx-auto text-xs sm:text-sm md:text-base">
              Our expert team is ready to help you find and build
              the perfect gaming PC based on your needs and budget.
            </p>
            <Link 
              to="/contact" 
              className="btn btn-sm md:btn-md bg-white text-npc-gold hover:bg-gray-100 border-none normal-case px-4 sm:px-6 md:px-8"
            >
              Free Consultation
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;