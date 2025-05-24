import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import ProductForm from '../../components/admin/ProductForm';
import { productAPI, categoryAPI } from '../../services/api';
import Swal from 'sweetalert2';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [activeFilter, setActiveFilter] = useState('simple');
  
  const [allProducts, setAllProducts] = useState([]);
  
  useEffect(() => {
    window.Swal = Swal;
  }, []);
  
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    
    try {
      const params = {
        page: 1,
        limit: 100,
        search: searchQuery || undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined
      };
      
      const response = await productAPI.getAllProducts(params);
      
      if (response.data?.success) {
        setAllProducts(response.data.data);
        
        let filteredProducts = response.data.data;
        
        setTotalCount(response.data.pagination?.totalItems || filteredProducts.length);
        
        const calculatedTotalPages = Math.ceil(filteredProducts.length / itemsPerPage);
        setTotalPages(calculatedTotalPages > 0 ? calculatedTotalPages : 1);
        
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
        
        setProducts(paginatedProducts);
      }
      
      setLoading(false);
      setIsSearching(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setLoading(false);
      setIsSearching(false);
      
      fetchMockProducts();
    }
  }, [currentPage, selectedCategory, searchQuery, itemsPerPage]);
  
  const fetchMockProducts = () => {
    const mockProducts = Array.from({ length: 25 }, (_, i) => ({
      id: i + 1,
      name: `Product ${i + 1} - ${i % 3 === 0 ? 'PC Gaming' : i % 3 === 1 ? 'Processor' : 'Graphics Card'}`,
      description: `Description for product ${i + 1}. This is a ${i % 3 === 0 ? 'gaming PC' : i % 3 === 1 ? 'processor' : 'graphics card'}.`,
      price: Math.floor(Math.random() * 15000000) + 1000000,
      stock: Math.floor(Math.random() * 50) + 1,
      discountPercentage: i % 5 === 0 ? 10 : i % 7 === 0 ? 15 : i % 3 === 0 ? 5 : 0,
      image: `/images/${i % 5 === 0 ? 'gaming-pc' : 
                      i % 5 === 1 ? 'processor' : 
                      i % 5 === 2 ? 'graphics-card' : 
                      i % 5 === 3 ? 'memory' : 'storage'}.png`,
      category: i % 5 === 0 ? 'Desktop PC' : 
                i % 5 === 1 ? 'Processor' : 
                i % 5 === 2 ? 'Graphic Card' : 
                i % 5 === 3 ? 'Memory' : 'Storage',
      isActive: Math.random() > 0.2,
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
      updatedAt: new Date(Date.now() - Math.floor(Math.random() * 1000000000)).toISOString()
    }));
    
    setAllProducts(mockProducts);
    
    let filteredProducts = mockProducts;
    if (searchQuery && searchQuery.trim() !== '') {
      const searchTerm = searchQuery.trim().toLowerCase();
      filteredProducts = mockProducts.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm) ||
                             product.description.toLowerCase().includes(searchTerm);
        
        return matchesSearch;
      });
    }
    
    if (selectedCategory !== 'all') {
      filteredProducts = filteredProducts.filter(product => {
        return product.category === selectedCategory;
      });
    }
    
    setTotalCount(filteredProducts.length);
    
    const calculatedTotalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    setTotalPages(calculatedTotalPages > 0 ? calculatedTotalPages : 1);
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
    
    setProducts(paginatedProducts);
  };
  
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);
  
  const fetchCategories = async () => {
    try {
      const response = await categoryAPI.getAllCategories();
      
      if (response.data?.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      
      const mockCategories = [
        { id: 1, name: 'Desktop PC' },
        { id: 2, name: 'Laptop' },
        { id: 3, name: 'Processor' },
        { id: 4, name: 'Graphic Card' },
        { id: 5, name: 'Memory' },
        { id: 6, name: 'Storage' },
        { id: 7, name: 'Monitor' },
        { id: 8, name: 'Peripherals' }
      ];
      
      setCategories(mockCategories);
    }
  };
  
  useEffect(() => {
    fetchCategories();
  }, []);
  
  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setIsSearching(true);
    
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      
      if (allProducts.length > 0) {
        const searchTerm = query.trim().toLowerCase();
        
        let filteredProducts = allProducts;
        if (searchTerm !== '') {
          filteredProducts = allProducts.filter(product => {
            const matchesSearch = (product.name || '').toLowerCase().includes(searchTerm) ||
                               (product.description || '').toLowerCase().includes(searchTerm);
            
            const matchesCategory = selectedCategory === 'all' || 
                                  product.Category?.id === selectedCategory || 
                                  product.category === selectedCategory;
            
            return matchesSearch && matchesCategory;
          });
        } else if (selectedCategory !== 'all') {
          filteredProducts = allProducts.filter(product => {
            return product.Category?.id === selectedCategory || 
                 product.category === selectedCategory;
          });
        }
        
        setTotalCount(filteredProducts.length);
        
        const calculatedTotalPages = Math.ceil(filteredProducts.length / itemsPerPage);
        setTotalPages(calculatedTotalPages > 0 ? calculatedTotalPages : 1);
        
        const startIndex = 0;
        const endIndex = startIndex + itemsPerPage;
        const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
        
        setProducts(paginatedProducts);
        setIsSearching(false);
      } else {
        fetchProducts();
      }
    }, 300);
    
    setSearchTimeout(timeoutId);
  };
  
  const handleCategoryFilter = (e) => {
    setSelectedCategory(e.target.value);
    setCurrentPage(1);
    
    if (allProducts.length > 0) {
      const categoryValue = e.target.value;
      
      let filteredProducts = allProducts;
      if (categoryValue !== 'all') {
        filteredProducts = allProducts.filter(product => {
          const matchesCategory = product.Category?.id === categoryValue || 
                                product.category === categoryValue;
          
          const matchesSearch = !searchQuery || 
                              (product.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                              (product.description || '').toLowerCase().includes(searchQuery.toLowerCase());
          
          return matchesCategory && matchesSearch;
        });
      } else if (searchQuery) {
        filteredProducts = allProducts.filter(product => {
          return (product.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (product.description || '').toLowerCase().includes(searchQuery.toLowerCase());
        });
      }
      
      setTotalCount(filteredProducts.length);
      
      const calculatedTotalPages = Math.ceil(filteredProducts.length / itemsPerPage);
      setTotalPages(calculatedTotalPages > 0 ? calculatedTotalPages : 1);
      
      const startIndex = 0;
      const endIndex = startIndex + itemsPerPage;
      const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
      
      setProducts(paginatedProducts);
    }
  };
  
  const handlePageChange = (page) => {
    setCurrentPage(page);
    
    if (allProducts.length > 0) {
      let filteredProducts = allProducts;
      
      if (searchQuery) {
        const searchTerm = searchQuery.trim().toLowerCase();
        filteredProducts = filteredProducts.filter(product => {
          return (product.name || '').toLowerCase().includes(searchTerm) ||
                (product.description || '').toLowerCase().includes(searchTerm);
        });
      }
      
      if (selectedCategory !== 'all') {
        filteredProducts = filteredProducts.filter(product => {
          return product.Category?.id === selectedCategory || 
               product.category === selectedCategory;
        });
      }
      
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
      
      setProducts(paginatedProducts);
    }
  };
  
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setCurrentPage(1);
    
    if (allProducts.length > 0) {
      setTotalCount(allProducts.length);
      
      const calculatedTotalPages = Math.ceil(allProducts.length / itemsPerPage);
      setTotalPages(calculatedTotalPages > 0 ? calculatedTotalPages : 1);
      
      const startIndex = 0;
      const endIndex = startIndex + itemsPerPage;
      const paginatedProducts = allProducts.slice(startIndex, endIndex);
      
      setProducts(paginatedProducts);
    } else {
      fetchProducts();
    }
  };
  
  const openProductModal = (product = null) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };
  
  const closeProductModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };
  
  const handleProductSubmit = async (productData) => {
    try {
      if (editingProduct) {
        const response = await productAPI.updateProduct(editingProduct.id, productData);
        
        if (response.data && response.data.success) {
          fetchProducts();
          
          Swal.fire({
            icon: 'success',
            title: 'Product Updated',
            text: 'The product has been updated successfully.',
            timer: 2000,
            showConfirmButton: false,
            confirmButtonColor: '#F0A84E'
          });
        } else {
          console.error('Error updating product:', response.data?.message || 'Unknown error');
          Swal.fire({
            icon: 'error',
            title: 'Update Failed',
            text: response.data?.message || 'Failed to update product. Please try again.',
            confirmButtonColor: '#F0A84E'
          });
        }
      } else {
        const response = await productAPI.createProduct(productData);
        
        if (response.data && response.data.success) {
          fetchProducts();
          
          Swal.fire({
            icon: 'success',
            title: 'Product Added',
            text: 'The new product has been added successfully.',
            timer: 2000,
            showConfirmButton: false,
            confirmButtonColor: '#F0A84E'
          });
        } else {
          console.error('Error creating product:', response.data?.message || 'Unknown error');
          Swal.fire({
            icon: 'error',
            title: 'Creation Failed',
            text: response.data?.message || 'Failed to create product. Please try again.',
            confirmButtonColor: '#F0A84E'
          });
        }
      }
      
      closeProductModal();
    } catch (error) {
      console.error('Error saving product:', error);
      
      Swal.fire({
        icon: 'error',
        title: 'Operation Failed',
        text: error.response?.data?.message || 'An error occurred. Please try again.',
        confirmButtonColor: '#F0A84E'
      });
      
      if (process.env.NODE_ENV === 'development') {
        handleMockProductSubmit(productData);
      }
    }
  };
  
  const handleMockProductSubmit = (productData) => {
    if (editingProduct) {
      const updatedProducts = products.map(p => 
        p.id === editingProduct.id ? { 
          ...p, 
          ...Object.fromEntries(productData.entries()),
          updatedAt: new Date().toISOString() 
        } : p
      );
      setProducts(updatedProducts);
      
      const updatedAllProducts = allProducts.map(p => 
        p.id === editingProduct.id ? { 
          ...p, 
          ...Object.fromEntries(productData.entries()),
          updatedAt: new Date().toISOString() 
        } : p
      );
      setAllProducts(updatedAllProducts);
      
      Swal.fire({
        icon: 'success',
        title: 'Product Updated (Mock)',
        text: 'The product has been updated successfully.',
        timer: 2000,
        showConfirmButton: false,
        confirmButtonColor: '#F0A84E'
      });
    } else {
      const formEntries = Object.fromEntries(productData.entries());
      const newProduct = {
        id: allProducts.length + 1,
        ...formEntries,
        price: parseFloat(formEntries.price) || 0,
        stock: parseInt(formEntries.stock) || 0,
        discountPercentage: parseFloat(formEntries.discountPercentage) || 0,
        featured: formEntries.featured === 'true' || formEntries.featured === true,
        isActive: formEntries.isActive === 'true' || formEntries.isActive === true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setProducts([newProduct, ...products]);
      
      setAllProducts([newProduct, ...allProducts]);
      
      Swal.fire({
        icon: 'success',
        title: 'Product Added (Mock)',
        text: 'The new product has been added successfully.',
        timer: 2000,
        showConfirmButton: false,
        confirmButtonColor: '#F0A84E'
      });
    }
    
    closeProductModal();
  };
  
  const openDeleteConfirmation = (product) => {
    Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete "${product.name}"? This cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#F0A84E',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        handleDeleteProduct(product.id);
      }
    });
  };
  
  const handleDeleteProduct = async (productId) => {
    try {
      const response = await productAPI.deleteProduct(productId);
      
      if (response.data && response.data.success) {
        const updatedProducts = products.filter(p => p.id !== productId);
        setProducts(updatedProducts);
        
        const updatedAllProducts = allProducts.filter(p => p.id !== productId);
        setAllProducts(updatedAllProducts);
        
        setTotalCount(prevCount => prevCount - 1);
        
        Swal.fire({
          icon: 'success',
          title: 'Product Deleted',
          text: 'The product has been deleted successfully.',
          timer: 2000,
          showConfirmButton: false,
          confirmButtonColor: '#F0A84E'
        });
      } else {
        console.error('Error deleting product:', response.data?.message || 'Unknown error');
        Swal.fire({
          icon: 'error',
          title: 'Deletion Failed',
          text: response.data?.message || 'Failed to delete product. Please try again.',
          confirmButtonColor: '#F0A84E'
        });
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      
      Swal.fire({
        icon: 'error',
        title: 'Deletion Failed',
        text: error.response?.data?.message || 'An error occurred while deleting the product.',
        confirmButtonColor: '#F0A84E'
      });
      
      if (process.env.NODE_ENV === 'development') {
        const updatedProducts = products.filter(p => p.id !== productId);
        setProducts(updatedProducts);
        
        const updatedAllProducts = allProducts.filter(p => p.id !== productId);
        setAllProducts(updatedAllProducts);
        
        setTotalCount(prevCount => prevCount - 1);
        
        Swal.fire({
          icon: 'success',
          title: 'Product Deleted (Mock)',
          text: 'The product has been deleted successfully.',
          timer: 2000,
          showConfirmButton: false,
          confirmButtonColor: '#F0A84E'
        });
      }
    }
  };
  
  const toggleProductStatus = async (productId) => {
    try {
      const product = products.find(p => p.id === productId);
      
      if (!product) return;
      
      const updatedStatus = !product.isActive;
      
      const formData = new FormData();
      formData.append('isActive', updatedStatus);
      
      const response = await productAPI.updateProduct(productId, formData);
      
      if (response.data && response.data.success) {
        const updatedProducts = products.map(p => 
          p.id === productId ? { ...p, isActive: updatedStatus, updatedAt: new Date().toISOString() } : p
        );
        setProducts(updatedProducts);
        
        const updatedAllProducts = allProducts.map(p => 
          p.id === productId ? { ...p, isActive: updatedStatus, updatedAt: new Date().toISOString() } : p
        );
        setAllProducts(updatedAllProducts);
        
        Swal.fire({
          icon: 'success',
          title: 'Status Updated',
          text: `The product is now ${updatedStatus ? 'active' : 'inactive'}.`,
          timer: 2000,
          showConfirmButton: false,
          confirmButtonColor: '#F0A84E'
        });
      } else {
        console.error('Error updating product status:', response.data?.message || 'Unknown error');
        Swal.fire({
          icon: 'error',
          title: 'Update Failed',
          text: response.data?.message || 'Failed to update product status. Please try again.',
          confirmButtonColor: '#F0A84E'
        });
      }
    } catch (error) {
      console.error('Error toggling product status:', error);
      
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: error.response?.data?.message || 'An error occurred while updating the product status.',
        confirmButtonColor: '#F0A84E'
      });
      
      if (process.env.NODE_ENV === 'development') {
        const product = products.find(p => p.id === productId);
        
        if (product) {
          const updatedProducts = products.map(p => 
            p.id === productId ? { ...p, isActive: !p.isActive, updatedAt: new Date().toISOString() } : p
          );
          setProducts(updatedProducts);
          
          const updatedAllProducts = allProducts.map(p => 
            p.id === productId ? { ...p, isActive: !p.isActive, updatedAt: new Date().toISOString() } : p
          );
          setAllProducts(updatedAllProducts);
          
          Swal.fire({
            icon: 'success',
            title: 'Status Updated (Mock)',
            text: `The product is now ${!product.isActive ? 'active' : 'inactive'}.`,
            timer: 2000,
            showConfirmButton: false,
            confirmButtonColor: '#F0A84E'
          });
        }
      }
    }
  };
  
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };
  
  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };
  
  const calculateDiscountedPrice = (price, discountPercentage) => {
    if (!discountPercentage) return price;
    return price - (price * discountPercentage / 100);
  };
  
  const renderProductCard = (product) => {
    return (
      <div key={product.id} className="card bg-white shadow mb-4 overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow duration-200">
        <div className="p-4">
          <div className="flex items-start">
            <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden mr-3">
              <img 
                src={product.imageUrl || product.image || '/images/product-placeholder.png'} 
                alt={product.name} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = '/images/product-placeholder.png';
                }}
              />
            </div>
            
            <div className="flex-1">
              <h3 className="font-medium text-npc-navy mb-1">{product.name}</h3>
              <div className="flex flex-wrap text-xs text-gray-500 mb-1">
                <span className="mr-2">{product.Category?.name || product.category || 'Uncategorized'}</span>
                <span>•</span>
                <span className="ml-2">
                  {product.stock > 10 ? (
                    <span className="text-green-600">In Stock ({product.stock})</span>
                  ) : product.stock > 0 ? (
                    <span className="text-orange-500">Low Stock ({product.stock})</span>
                  ) : (
                    <span className="text-red-500">Out of Stock</span>
                  )}
                </span>
              </div>
              
              <div className="flex items-center space-x-2 mt-2">
                <div className="form-control">
                  <label className="cursor-pointer label flex justify-start p-0">
                    <input 
                      type="checkbox" 
                      className="toggle toggle-primary toggle-sm"
                      checked={product.isActive}
                      onChange={() => toggleProductStatus(product.id)}
                    />
                    <span className={`label-text ml-2 text-xs ${product.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                      {product.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t">
            <div className="flex justify-between items-center">
              <div>
                {product.discountPercentage > 0 ? (
                  <div>
                    <div className="font-medium text-npc-navy">{formatPrice(calculateDiscountedPrice(product.price, product.discountPercentage))}</div>
                    <div className="line-through text-xs text-gray-500">{formatPrice(product.price)}</div>
                  </div>
                ) : (
                  <div className="font-medium text-npc-navy">{formatPrice(product.price)}</div>
                )}
              </div>
              
              <div className="flex space-x-2">
                <button 
                  className="btn btn-ghost btn-sm rounded"
                  onClick={() => openProductModal(product)}
                  aria-label="Edit"
                >
                  <i className="fas fa-edit text-blue-600"></i>
                </button>
                <button 
                  className="btn btn-ghost btn-sm rounded"
                  onClick={() => openDeleteConfirmation(product)}
                  aria-label="Delete"
                >
                  <i className="fas fa-trash text-red-600"></i>
                </button>
                <Link 
                  to={`/product/${product.id}`} 
                  className="btn btn-ghost btn-sm rounded"
                  target="_blank"
                  aria-label="View"
                >
                  <i className="fas fa-eye text-gray-600"></i>
                </Link>
              </div>
            </div>
            
            <div className="text-xs text-gray-500 mt-2">
              Last updated: {formatDate(product.updatedAt)}
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    let visiblePages = [];
    
    if (totalPages <= 7) {
      visiblePages = Array.from({ length: totalPages }, (_, i) => i + 1);
    } else {
      if (currentPage <= 3) {
        visiblePages = [1, 2, 3, 4, 5, '...', totalPages];
      } else if (currentPage >= totalPages - 2) {
        visiblePages = [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
      } else {
        visiblePages = [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
      }
    }
    
    return (
      <div className="flex justify-center items-center py-4">
        <div className="flex items-center space-x-1">
          <button 
            className="btn btn-sm px-3 rounded bg-white border border-gray-300 hover:bg-gray-100 disabled:bg-gray-100"
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            <i className="fas fa-chevron-left text-gray-600"></i>
          </button>
          
          {visiblePages.map((page, index) => (
            page === '...' ? (
              <span key={`ellipsis-${index}`} className="px-3 py-1 text-gray-500">...</span>
            ) : (
              <button
                key={`page-${page}`}
                className={`btn btn-sm min-w-[2.5rem] ${
                  currentPage === page 
                    ? 'bg-npc-gold border-npc-gold text-white hover:bg-npc-darkGold' 
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </button>
            )
          ))}
          
          <button 
            className="btn btn-sm px-3 rounded bg-white border border-gray-300 hover:bg-gray-100 disabled:bg-gray-100"
            disabled={currentPage === totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            <i className="fas fa-chevron-right text-gray-600"></i>
          </button>
        </div>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      
      <div className="flex overflow-hidden">
        <Sidebar isAdmin={true} />
        
        <div className="flex-1 p-4 sm:p-6 mb-16 md:mb-0 overflow-x-hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-4">
            <h1 className="text-xl md:text-2xl font-bold text-npc-navy">Product Management</h1>
            
            <button 
              className="btn bg-npc-gold hover:bg-npc-darkGold text-white border-none w-full sm:w-auto"
              onClick={() => openProductModal()}
            >
              <i className="fas fa-plus mr-2"></i>
              Add New Product
            </button>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 mb-4 md:hidden">
            <div className="flex rounded-md bg-gray-200 p-1">
              <button
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeFilter === 'simple' 
                    ? 'bg-white text-npc-navy shadow' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => setActiveFilter('simple')}
              >
                <i className="fas fa-search mr-2"></i>
                Basic Search
              </button>
              <button
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeFilter === 'advanced' 
                    ? 'bg-white text-npc-navy shadow' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => setActiveFilter('advanced')}
              >
                <i className="fas fa-filter mr-2"></i>
                Filters
              </button>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 mb-6 hidden md:block">
            <div className="flex flex-col md:flex-row gap-4 mb-2">
              <div className="flex-1">
                <div className="form-control">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by product name or description..."
                      className="input input-bordered w-full pr-10 bg-white text-gray-800 border-gray-300 focus:border-npc-gold focus:ring-npc-gold"
                      value={searchQuery}
                      onChange={handleSearch}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      {isSearching ? (
                        <div className="w-5 h-5 border-2 border-t-transparent border-npc-gold rounded-full animate-spin"></div>
                      ) : (
                        <i className="fas fa-search text-gray-400"></i>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="w-full md:w-48">
                <select 
                  className="select select-bordered w-full bg-white text-gray-800 border-gray-300 focus:border-npc-gold focus:ring-npc-gold"
                  value={selectedCategory}
                  onChange={handleCategoryFilter}
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex justify-between items-center mt-3">
              <div className="text-sm text-gray-500">
                {searchQuery && !loading && (
                  <span>
                    {totalCount} result{totalCount !== 1 ? 's' : ''} found for "{searchQuery}"
                  </span>
                )}
              </div>
              <button 
                className="btn btn-ghost btn-sm text-gray-600 hover:text-white"
                onClick={clearFilters}
              >
                <i className="fas fa-undo mr-1"></i>
                Clear Filters
              </button>
            </div>
          </div>
          
          {activeFilter === 'simple' && (
            <div className="bg-white rounded-lg shadow p-4 mb-4 md:hidden">
              <div className="form-control">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search products..."
                    className="input input-bordered w-full pr-10 bg-white text-gray-800 border-gray-300 focus:border-npc-gold focus:ring-npc-gold"
                    value={searchQuery}
                    onChange={handleSearch}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    {isSearching ? (
                      <div className="w-5 h-5 border-2 border-t-transparent border-npc-gold rounded-full animate-spin"></div>
                    ) : (
                      <i className="fas fa-search text-gray-400"></i>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-500 mt-2">
                {searchQuery && !loading && (
                  <span>
                    {totalCount} result{totalCount !== 1 ? 's' : ''} found for "{searchQuery}"
                  </span>
                )}
              </div>
            </div>
          )}
          
          {activeFilter === 'advanced' && (
            <div className="bg-white rounded-lg shadow p-4 mb-4 md:hidden">
              <div className="space-y-4">
                <div className="w-full">
                  <select 
                    className="select select-bordered w-full bg-white text-gray-800 border-gray-300 focus:border-npc-gold focus:ring-npc-gold"
                    value={selectedCategory}
                    onChange={handleCategoryFilter}
                  >
                    <option value="all">All Categories</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex justify-end">
                  <button 
                    className="btn btn-ghost btn-sm text-gray-600 hover:text-white"
                    onClick={clearFilters}
                  >
                    <i className="fas fa-undo mr-1"></i>
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          )}
          
          <div className="bg-white rounded-lg shadow overflow-hidden max-w-full">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="flex flex-col items-center">
                  <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full border-gray-300 border-t-npc-gold" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-3 text-gray-600">Loading products...</p>
                </div>
              </div>
            ) : products.length === 0 ? (
              <div className="p-8 text-center">
                <i className="fas fa-box-open text-gray-400 text-4xl mb-4"></i>
                <h3 className="text-lg font-medium mb-2">No Products Found</h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery ? 
                    `No products match your search criteria "${searchQuery}".` : 
                    "We couldn't find any products matching your filter criteria."
                  }
                </p>
                <button 
                  className="btn btn-outline btn-sm text-gray-700 hover:text-white"
                  onClick={clearFilters}
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <div className="block md:hidden p-4">
                  <div className="text-sm text-gray-500 mb-4">
                    Showing {products.length} of {totalCount} products
                  </div>
                  {products.map(product => renderProductCard(product))}
                </div>
                
                <div className="hidden md:block">
                  <div className="overflow-x-auto" style={{ maxWidth: '100%' }}>
                    <table className="table min-w-full text-gray-700">
                      <thead className='text-gray-700 bg-gray-200'>
                        <tr>
                          <th className="px-4 py-3" style={{ minWidth: '250px' }}>Product</th>
                          <th className="px-4 py-3" style={{ minWidth: '120px' }}>Category</th>
                          <th className="px-4 py-3" style={{ minWidth: '100px' }}>Price</th>
                          <th className="px-4 py-3" style={{ minWidth: '100px' }}>Discount</th>
                          <th className="px-4 py-3" style={{ minWidth: '80px' }}>Stock</th>
                          <th className="px-4 py-3" style={{ minWidth: '120px' }}>Status</th>
                          <th className="px-4 py-3" style={{ minWidth: '150px' }}>Last Updated</th>
                          <th className="px-4 py-3" style={{ minWidth: '120px' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map(product => (
                          <tr key={product.id} className="hover:bg-gray-50 border-b border-gray-100">
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-3">
                                <div className="avatar">
                                  <div className="mask mask-squircle w-12 h-12">
                                    <img 
                                      src={product.imageUrl || product.image || '/images/product-placeholder.png'} 
                                      alt={product.name} 
                                      className="bg-gray-100"
                                      onError={(e) => {
                                        e.target.src = '/images/product-placeholder.png';
                                      }}
                                    />
                                  </div>
                                </div>
                                <div>
                                  <div className="font-bold">{product.name}</div>
                                  <div className="text-xs opacity-50 truncate max-w-xs">
                                    {product.description}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">{product.Category?.name || product.category || 'Uncategorized'}</td>
                            <td className="px-4 py-3">
                              {product.discountPercentage > 0 ? (
                                <div>
                                  <div className="font-medium">{formatPrice(calculateDiscountedPrice(product.price, product.discountPercentage))}</div>
                                  <div className="line-through text-xs text-gray-500">{formatPrice(product.price)}</div>
                                </div>
                              ) : (
                                formatPrice(product.price)
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {product.discountPercentage > 0 ? (
                                <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded-full">
                                  {product.discountPercentage}% OFF
                                </span>
                              ) : (
                                <span className="bg-gray-100 text-gray-500 text-xs font-medium px-2 py-1 rounded-full">
                                  No discount
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`font-medium ${product.stock > 10 ? 'text-green-600' : product.stock > 0 ? 'text-orange-500' : 'text-red-500'}`}>
                                {product.stock}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="form-control">
                                <label className="cursor-pointer label flex justify-start p-0">
                                  <input 
                                    type="checkbox" 
                                    className="toggle toggle-primary toggle-sm"
                                    checked={product.isActive}
                                    onChange={() => toggleProductStatus(product.id)}
                                  />
                                  <span className={`label-text ml-2 ${product.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                                    {product.isActive ? 'Active' : 'Inactive'}
                                  </span>
                                </label>
                              </div>
                            </td>
                            <td className="px-4 py-3">{formatDate(product.updatedAt)}</td>
                            <td className="px-4 py-3">
                              <div className="flex space-x-2">
                                <button 
                                  className="btn btn-ghost btn-sm rounded-md"
                                  onClick={() => openProductModal(product)}
                                  title="Edit Product"
                                >
                                  <i className="fas fa-edit text-blue-600"></i>
                                </button>
                                <button 
                                  className="btn btn-ghost btn-sm rounded-md"
                                  onClick={() => openDeleteConfirmation(product)}
                                  title="Delete Product"
                                >
                                  <i className="fas fa-trash text-red-600"></i>
                                </button>
                                <Link 
                                  to={`/product/${product.id}`} 
                                  className="btn btn-ghost btn-sm rounded-md"
                                  target="_blank"
                                  title="View Product"
                                >
                                  <i className="fas fa-eye text-gray-600"></i>
                                </Link>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                {renderPagination()}
                
                <div className="px-4 py-3 bg-gray-50 border-t text-xs text-gray-500">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} products
                </div>
              </>
            )}
          </div>
          
          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-10">
            <div className="container mx-auto px-4 py-2">
              <div className="flex justify-around">
                <button 
                  className={`flex flex-col items-center px-4 py-2 ${activeFilter === 'simple' ? 'text-npc-gold' : 'text-gray-500'}`}
                  onClick={() => setActiveFilter('simple')}
                >
                  <i className="fas fa-search text-lg"></i>
                  <span className="text-xs mt-1">Search</span>
                </button>
                <button 
                  className={`flex flex-col items-center px-4 py-2 ${activeFilter === 'advanced' ? 'text-npc-gold' : 'text-gray-500'}`}
                  onClick={() => setActiveFilter('advanced')}
                >
                  <i className="fas fa-filter text-lg"></i>
                  <span className="text-xs mt-1">Filters</span>
                </button>
                <button 
                  className="flex flex-col items-center px-4 py-2 text-gray-500"
                  onClick={() => openProductModal()}
                >
                  <i className="fas fa-plus text-lg"></i>
                  <span className="text-xs mt-1">Add</span>
                </button>
                <button 
                  className="flex flex-col items-center px-4 py-2 text-gray-500"
                  onClick={fetchProducts}
                >
                  <i className="fas fa-sync-alt text-lg"></i>
                  <span className="text-xs mt-1">Refresh</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {isModalOpen && (
        <ProductForm
          product={editingProduct}
          categories={categories}
          onSubmit={handleProductSubmit}
          onClose={closeProductModal}
        />
      )}
    </div>
  );
};

export default ProductManagement;