import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ProductCard from '../../components/common/ProductCard';
import SearchBar from '../../components/buyer/SearchBar';
import { productAPI, categoryAPI, cartAPI } from '../../services/api';
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
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../contexts/CartContext';
import { canShop } from '../../utils/canShop';

const ProductList = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { updateCartCount } = useCart();
  const userCanShop = user ? canShop(user.role) : true;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(25);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [debug, setDebug] = useState({
    apiResponse: null,
    categoryResponse: null,
    error: null
  });

  const searchParams = new URLSearchParams(location.search);
  const urlSearchQuery = searchParams.get('search') || '';
  const categoryParam = searchParams.get('category') || 'all';
  const pageParam = parseInt(searchParams.get('page')) || 1;
  const sortParam = searchParams.get('sort') || 'newest';

  const getCategoriesPerRow = () => {
    if (window.innerWidth >= 1280) return 10;
    if (window.innerWidth >= 1024) return 8;
    if (window.innerWidth >= 768) return 6;
    if (window.innerWidth >= 640) return 4;
    return 2;
  };
  
  const [categoriesPerRow, setCategoriesPerRow] = useState(getCategoriesPerRow());

  useEffect(() => {
    const handleResize = () => {
      setCategoriesPerRow(getCategoriesPerRow());
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    window.Swal = Swal;
  }, []);

  useEffect(() => {
    setSelectedCategory(categoryParam);
    setCurrentPage(pageParam);
    setSortBy(sortParam);
    setSearchQuery(urlSearchQuery);
    fetchCategories();
    window.scrollTo(0, 0);
  }, [categoryParam, pageParam, sortParam, urlSearchQuery]);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, currentPage, sortBy, searchQuery, categories]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      console.log(`Fetching products with sort type: ${sortBy}`);
      let response;
      if (sortBy === 'popular') {
        console.log('Using getPopularProducts API endpoint');
        const params = {
          limit: itemsPerPage,
          page: currentPage
        };
        if (searchQuery) {
          params.search = searchQuery;
        }
        if (selectedCategory !== 'all') {
          const categoryObj = categories.find(cat => cat.name === selectedCategory);
          if (categoryObj) {
            params.categoryId = categoryObj.id;
          } else {
            params.search = selectedCategory;
          }
        }
        response = await productAPI.getPopularProducts(params);
      } else if (sortBy === 'newest') {
        console.log('Using getAllProducts API endpoint with createdAt sort');
        const params = {
          page: currentPage,
          limit: itemsPerPage,
          search: searchQuery || undefined,
          sort: 'createdAt',
          order: 'DESC'
        };
        if (selectedCategory !== 'all') {
          const categoryObj = categories.find(cat => cat.name === selectedCategory);
          if (categoryObj) {
            console.log('Found category:', categoryObj);
            response = await productAPI.getProductsByCategory(categoryObj.id, params);
          } else {
            console.log('Category not found, using search');
            params.search = selectedCategory;
            response = await productAPI.getAllProducts(params);
          }
        } else {
          console.log('Getting all products');
          response = await productAPI.getAllProducts(params);
        }
      } else {
        console.log('Using getAllProducts API endpoint with standard sorting');
        const params = {
          page: currentPage,
          limit: itemsPerPage,
          search: searchQuery || undefined
        };
        switch(sortBy) {
          case 'price-low':
            params.sort = 'price';
            params.order = 'ASC';
            break;
          case 'price-high':
            params.sort = 'price';
            params.order = 'DESC';
            break;
          case 'rating':
            params.sort = 'avgRating';
            params.order = 'DESC';
            break;
          default:
            params.sort = 'createdAt';
            params.order = 'DESC';
            break;
        }
        console.log('Fetching with params:', params);
        if (selectedCategory !== 'all') {
          const categoryObj = categories.find(cat => cat.name === selectedCategory);
          if (categoryObj) {
            console.log('Found category:', categoryObj);
            response = await productAPI.getProductsByCategory(categoryObj.id, params);
          } else {
            console.log('Category not found, using search');
            params.search = selectedCategory;
            response = await productAPI.getAllProducts(params);
          }
        } else {
          console.log('Getting all products');
          response = await productAPI.getAllProducts(params);
        }
      }
      setDebug(prev => ({...prev, apiResponse: response}));
      console.log('API response:', response);
      const mapProductData = (products) => {
        if (!products || !Array.isArray(products)) {
          console.error('Products data is not an array:', products);
          return [];
        }
        return products.map(product => {
          console.log('Mapping product:', product);
          return {
            id: product.id,
            name: product.name || 'Unnamed Product',
            imageUrl: product.imageUrl || '/images/product-placeholder.png',
            price: parseFloat(product.price) || 0,
            originalPrice: product.discountPercentage > 0 
              ? (parseFloat(product.price) / (1 - (parseFloat(product.discountPercentage) / 100)))
              : null,
            discount: parseFloat(product.discountPercentage) || 0,
            rating: product.avgRating || 0,
            reviews: product.reviewCount || 0,
            category: product.Category?.name || product.category || 'Uncategorized',
            stock: parseInt(product.stock) || 0,
            totalSold: product.totalSold || 0
          };
        });
      };
      let productsData = [];
      let paginationInfo = { totalPages: 1, totalItems: 0 };
      if (response?.data?.success && Array.isArray(response.data.data)) {
        productsData = response.data.data;
        paginationInfo = response.data.pagination || { totalPages: 1, totalItems: productsData.length };
      } else if (response?.data?.data && Array.isArray(response.data.data)) {
        productsData = response.data.data;
        paginationInfo = response.data.pagination || { totalPages: 1, totalItems: productsData.length };
      } else if (Array.isArray(response?.data)) {
        productsData = response.data;
        paginationInfo = { totalPages: 1, totalItems: productsData.length };
      }
      console.log('Products data extracted:', productsData);
      console.log('Pagination info:', paginationInfo);
      const mappedProducts = mapProductData(productsData);
      console.log('Mapped products:', mappedProducts);
      setProducts(mappedProducts);
      setTotalPages(paginationInfo.totalPages || 1);
      setTotalItems(paginationInfo.totalItems || mappedProducts.length);
    } catch (error) {
      console.error('Error fetching products:', error);
      setDebug(prev => ({...prev, error}));
      setProducts([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoryAPI.getAllCategories();
      console.log('Categories response:', response);
      setDebug(prev => ({...prev, categoryResponse: response}));
      let categoriesData = [];
      if (response?.data?.data && Array.isArray(response.data.data)) {
        categoriesData = response.data.data;
      } else if (response?.data && Array.isArray(response.data)) {
        categoriesData = response.data;
      } else if (response?.data) {
        console.log('Categories response format different than expected:', response.data);
        const keys = Object.keys(response.data);
        if (keys.includes('data') && Array.isArray(response.data.data)) {
          categoriesData = response.data.data;
        }
      }
      console.log('Categories data extracted:', categoriesData);
      const transformedCategories = categoriesData.map(category => ({
        id: category.id,
        name: category.name,
        count: category.productCount || 0,
        icon: getCategoryIcon(category.name)
      }));
      console.log('Transformed categories:', transformedCategories);
      setCategories(transformedCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setDebug(prev => ({...prev, error}));
      setCategories([]);
    }
  };
  
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
    if (name.includes('chair')) 
      return <FaChair className="text-npc-gold text-2xl" />;
    if (name.includes('network') || name.includes('lan')) 
      return <FaNetworkWired className="text-npc-gold text-2xl" />;
    if (name.includes('router') || name.includes('wifi')) 
      return <MdRouter className="text-npc-gold text-2xl" />;
    if (name.includes('cable')) 
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

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setCurrentPage(1);
    updateUrlParams({
      category: category === 'all' ? null : category,
      page: 1
    });
  };

  const handleSortChange = (sort) => {
    setSortBy(sort);
    setCurrentPage(1);
    updateUrlParams({
      sort,
      page: 1
    });
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
    updateUrlParams({ page });
  };
  
  const handleSearch = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const query = formData.get('searchQuery');
    setSearchQuery(query);
    setCurrentPage(1);
    updateUrlParams({
      search: query,
      page: 1
    });
  };
  
  const updateUrlParams = (newParams) => {
    const params = new URLSearchParams(location.search);
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    navigate({
      pathname: location.pathname,
      search: params.toString()
    });
  };

  const addToCart = async (product) => {
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
  };
  
  const showDebugInfo = () => {
    if (process.env.NODE_ENV !== 'development') return null;
    return (
      <div className="bg-gray-800 text-white p-4 my-4 rounded-lg overflow-auto" style={{maxHeight: '300px'}}>
        <h3 className="text-lg font-bold mb-2">Debug Information</h3>
        <p>Selected Category: {selectedCategory}</p>
        <p>Categories loaded: {categories.length}</p>
        <p>Categories per row: {categoriesPerRow}</p>
        <p>Show all categories: {showAllCategories.toString()}</p>
        <p>Products loaded: {products.length}</p>
        <p>Total items: {totalItems}</p>
        <p>Total pages: {totalPages}</p>
        <p>Current page: {currentPage}</p>
        {debug.error && (
          <div className="mt-2">
            <p className="text-red-400">Error: {debug.error.message}</p>
            <pre className="text-xs mt-1">{debug.error.stack}</pre>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {showDebugInfo()}
        <div className="text-xs sm:text-sm breadcrumbs mb-3 sm:mb-4 overflow-x-auto whitespace-nowrap">
          <ul>
            <li><a href="/" className="text-npc-navy hover:text-npc-gold">Home</a></li>
            <li className="text-npc-gold">Products</li>
            {selectedCategory !== 'all' && <li>{selectedCategory}</li>}
          </ul>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 md:p-6 mb-4 sm:mb-6">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6 text-gray-800">
            {searchQuery ? `Search Results: "${searchQuery}"` : 
            selectedCategory !== 'all' ? selectedCategory : 'All Products'}
          </h1>
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="w-full sm:flex-1">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  name="searchQuery"
                  placeholder="Search products..."
                  className="input input-bordered w-full pl-3 pr-10 py-2 bg-white text-gray-800 border-gray-300 focus:border-npc-gold focus:ring-npc-gold text-sm rounded-md h-10 sm:h-auto"
                  defaultValue={searchQuery}
                />
                <button 
                  type="submit" 
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                >
                  <i className="fas fa-search text-gray-400"></i>
                </button>
              </form>
            </div>
            <div className="w-full sm:w-48">
              <select 
                className="select select-bordered w-full bg-white text-gray-800 border-gray-300 text-sm h-10"
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
              >
                <option value="popular">Most Popular</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="newest">Newest</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>
          <div className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
            Showing {products.length} of {totalItems} products
            {searchQuery && <span> matching "{searchQuery}"</span>}
            {selectedCategory !== 'all' && <span> in {selectedCategory}</span>}
          </div>
          <div className="mt-4 sm:mt-6">
            <div className="whitespace-nowrap overflow-x-auto pb-3 -mx-3 px-3 sm:mx-0 sm:px-0 sm:whitespace-normal sm:grid sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 sm:gap-3 mb-2 scrollbar-hide">
              <div className="inline-block sm:block mr-3 sm:mr-0">
                <button 
                  onClick={() => handleCategoryChange('all')}
                  className={`flex flex-col items-center ${selectedCategory === 'all' ? 'text-npc-gold' : 'text-gray-800'} min-w-[60px]`}
                >
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-1 ${
                    selectedCategory === 'all' ? 'border-2 border-npc-gold' : 'border border-gray-200'
                  }`}>
                    <HiDesktopComputer className={`text-lg sm:text-xl ${selectedCategory === 'all' ? 'text-npc-gold' : 'text-gray-700'}`} />
                  </div>
                  <span className="text-xs font-medium text-center truncate w-full">All</span>
                </button>
              </div>
              {categories.map((category, index) => (
                <div key={category.id} className={`inline-block mr-3 ${
                  index < (showAllCategories ? categoriesPerRow - 1 : categoriesPerRow - 2)
                    ? 'sm:block sm:mr-0'
                    : 'sm:hidden'
                }`}>
                  <button
                    onClick={() => handleCategoryChange(category.name)}
                    className={`flex flex-col items-center ${selectedCategory === category.name ? 'text-npc-gold' : 'text-gray-800'} min-w-[60px]`}
                  >
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-1 ${
                      selectedCategory === category.name ? 'border-2 border-npc-gold' : 'border border-gray-200'
                    }`}>
                      {React.cloneElement(getCategoryIcon(category.name), { 
                        className: `text-lg sm:text-xl ${selectedCategory === category.name ? 'text-npc-gold' : 'text-gray-700'}`
                      })}
                    </div>
                    <span className="text-xs font-medium text-center truncate w-full">{category.name}</span>
                  </button>
                </div>
              ))}
              {categories.length > categoriesPerRow - 1 && !showAllCategories && (
                <div className="hidden sm:block">
                  <button 
                    onClick={() => setShowAllCategories(true)}
                    className="flex flex-col items-center text-gray-800 hover:text-npc-gold min-w-[60px]"
                  >
                    <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-1 border border-gray-200 hover:border-npc-gold group">
                      <i className="fas fa-ellipsis-h text-gray-700 group-hover:text-npc-gold text-lg"></i>
                    </div>
                    <span className="text-xs font-medium text-center">More</span>
                  </button>
                </div>
              )}
            </div>
            {showAllCategories && categories.length > categoriesPerRow - 1 && (
              <div className="mt-3 hidden sm:block">
                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3 mb-3">
                  {categories.slice(categoriesPerRow - 1).map(category => (
                    <div key={category.id}>
                      <button
                        onClick={() => handleCategoryChange(category.name)}
                        className={`flex flex-col items-center ${selectedCategory === category.name ? 'text-npc-gold' : 'text-gray-800'}`}
                      >
                        <div className={`w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-1 ${
                          selectedCategory === category.name ? 'border-2 border-npc-gold' : 'border border-gray-200'
                        }`}>
                          {React.cloneElement(getCategoryIcon(category.name), { 
                            className: `text-xl ${selectedCategory === category.name ? 'text-npc-gold' : 'text-gray-700'}`
                          })}
                        </div>
                        <span className="text-xs font-medium text-center truncate w-full">{category.name}</span>
                      </button>
                    </div>
                  ))}
                </div>
                <div className="text-center mt-4">
                  <button 
                    onClick={() => setShowAllCategories(false)}
                    className="text-npc-gold hover:underline text-sm font-medium inline-flex items-center"
                  >
                    Show Less
                    <i className="fas fa-chevron-up ml-1"></i>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        {loading ? (
          <div className="flex justify-center items-center h-40 sm:h-64">
            <span className="loading loading-spinner loading-lg text-npc-gold"></span>
          </div>
        ) : (
          <>
            {products.length === 0 ? (
              <div className="text-center bg-white rounded-lg shadow-sm p-4 md:p-6 mb-6">
                <div className="flex flex-col items-center">
                  <div className="rounded-full bg-gray-100 p-4 mb-4">
                    <i className="fas fa-search text-gray-400 text-2xl sm:text-3xl"></i>
                  </div>
                  <h3 className="text-lg sm:text-xl font-medium mb-2 text-gray-800">No Products Found</h3>
                  <p className="text-gray-600 mb-4 max-w-md mx-auto text-sm sm:text-base">
                    We couldn't find any products that match your filters.
                    Please try with different filters.
                  </p>
                  <button 
                    className="btn btn-primary bg-npc-gold hover:bg-npc-darkGold border-none"
                    onClick={() => {
                      setSelectedCategory('all');
                      setSortBy('popular');
                      setSearchQuery('');
                      setCurrentPage(1);
                      navigate('/products');
                    }}
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4 mb-6 sm:mb-8">
                  {products.map(product => (
                    <ProductCard 
                      key={product.id} 
                      product={product}
                      addToCart={() => addToCart(product)}
                    />
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="flex justify-center mt-6 sm:mt-8">
                    <div className="join">
                      <button 
                        className="join-item btn btn-xs sm:btn-sm md:btn-md bg-white text-gray-700 hover:bg-gray-100"
                        disabled={currentPage === 1}
                        onClick={() => handlePageChange(currentPage - 1)}
                        aria-label="Previous page"
                      >
                        <i className="fas fa-chevron-left"></i>
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(number => 
                          number === 1 || 
                          number === totalPages || 
                          Math.abs(number - currentPage) <= (window.innerWidth < 640 ? 1 : 2)
                        )
                        .map((number, index, filteredArray) => (
                          <React.Fragment key={number}>
                            {index > 0 && filteredArray[index - 1] !== number - 1 && (
                              <button className="join-item btn btn-xs sm:btn-sm md:btn-md bg-white text-gray-700" disabled>
                                ...
                              </button>
                            )}
                            <button
                              className={`join-item btn btn-xs sm:btn-sm md:btn-md ${currentPage === number ? 'bg-npc-gold text-white hover:bg-npc-darkGold' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                              onClick={() => handlePageChange(number)}
                              aria-label={`Page ${number}`}
                              aria-current={currentPage === number ? 'page' : undefined}
                            >
                              {number}
                            </button>
                          </React.Fragment>
                        ))
                      }
                      <button 
                        className="join-item btn btn-xs sm:btn-sm md:btn-md bg-white text-gray-700 hover:bg-gray-100"
                        disabled={currentPage === totalPages}
                        onClick={() => handlePageChange(currentPage + 1)}
                        aria-label="Next page"
                      >
                        <i className="fas fa-chevron-right"></i>
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default ProductList;