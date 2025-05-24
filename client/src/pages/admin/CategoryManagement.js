import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import { categoryAPI, productAPI } from '../../services/api';
import Swal from 'sweetalert2';
import CategoryForm from '../../components/admin/CategoryForm';

import { HiDesktopComputer, HiChip } from 'react-icons/hi';
import { MdLaptop, MdHeadset, MdMouse, MdKeyboard, MdStorage, MdSdStorage, MdMonitor, MdGamepad, MdRouter, MdCable, MdPower } from 'react-icons/md';
import { FiCpu, FiMonitor, FiSpeaker } from 'react-icons/fi';
import { BsFan, BsMotherboard, BsGpuCard, BsWebcam } from 'react-icons/bs';
import { GiComputerFan, GiSoundWaves } from 'react-icons/gi';
import { FaMemory, FaNetworkWired, FaServer, FaChair, FaLightbulb } from 'react-icons/fa';
import { AiFillThunderbolt, AiFillTool } from 'react-icons/ai';
import { BiMicrophone, BiJoystick } from 'react-icons/bi';
import { LuPcCase } from "react-icons/lu";

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryProductCounts, setCategoryProductCounts] = useState({});
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [activeFilter, setActiveFilter] = useState('simple'); 
  
  const getCategoryIcon = (categoryName) => {
    if (!categoryName) return <HiDesktopComputer className="text-npc-gold text-xl" />;
    
    const name = categoryName.toLowerCase();
    
    if (name.includes('pc') || name === 'pc' || name.includes('computer')) 
      return <HiDesktopComputer className="text-npc-gold text-xl" />;
    if (name.includes('laptop')) 
      return <MdLaptop className="text-npc-gold text-xl" />;
    if (name.includes('server')) 
      return <FaServer className="text-npc-gold text-xl" />;
      
    if (name.includes('processor') || name.includes('cpu')) 
      return <FiCpu className="text-npc-gold text-xl" />;
    if (name.includes('motherboard') || name.includes('mainboard')) 
      return <BsMotherboard className="text-npc-gold text-xl" />;
    if (name.includes('graphic') || name.includes('gpu') || name.includes('vga')) 
      return <BsGpuCard className="text-npc-gold text-xl" />;
    if (name.includes('memory') || name.includes('ram')) 
      return <FaMemory className="text-npc-gold text-xl" />;
    if (name.includes('storage') || name.includes('ssd') || name.includes('hdd') || name.includes('nvme')) 
      return <MdStorage className="text-npc-gold text-xl" />;
    if (name.includes('power supply') || name.includes('psu')) 
      return <MdPower className="text-npc-gold text-xl" />;
    if (name.includes('cooling') || name.includes('fan') || name.includes('cooler')) 
      return <BsFan className="text-npc-gold text-xl" />;
    if (name.includes('casing') || name.includes('case') || name.includes('chassis')) 
      return <LuPcCase className="text-npc-gold text-xl" />;
      
    if (name.includes('mouse')) 
      return <MdMouse className="text-npc-gold text-xl" />;
    if (name.includes('keyboard')) 
      return <MdKeyboard className="text-npc-gold text-xl" />;
    if (name.includes('headphone') || name.includes('headset')) 
      return <MdHeadset className="text-npc-gold text-xl" />;
    if (name.includes('microphone') || name.includes('mic')) 
      return <BiMicrophone className="text-npc-gold text-xl" />;
    if (name.includes('webcam') || name.includes('camera')) 
      return <BsWebcam className="text-npc-gold text-xl" />;
      
    if (name.includes('monitor') || name.includes('display')) 
      return <MdMonitor className="text-npc-gold text-xl" />;
    if (name.includes('speaker') || name.includes('audio')) 
      return <FiSpeaker className="text-npc-gold text-xl" />;
      
    if (name.includes('gaming') || name.includes('game')) 
      return <MdGamepad className="text-npc-gold text-xl" />;
    if (name.includes('controller') || name.includes('joystick')) 
      return <BiJoystick className="text-npc-gold text-xl" />;
    if (name.includes('chair') || name.includes('kursi')) 
      return <FaChair className="text-npc-gold text-xl" />;
      
    if (name.includes('network') || name.includes('lan')) 
      return <FaNetworkWired className="text-npc-gold text-xl" />;
    if (name.includes('router') || name.includes('wifi')) 
      return <MdRouter className="text-npc-gold text-xl" />;
      
    if (name.includes('cable') || name.includes('kabel')) 
      return <MdCable className="text-npc-gold text-xl" />;
    if (name.includes('card reader') || name.includes('memory card')) 
      return <MdSdStorage className="text-npc-gold text-xl" />;
    if (name.includes('tool') || name.includes('toolkit')) 
      return <AiFillTool className="text-npc-gold text-xl" />;
    if (name.includes('lighting') || name.includes('rgb')) 
      return <FaLightbulb className="text-npc-gold text-xl" />;
    if (name.includes('charger') || name.includes('power bank')) 
      return <AiFillThunderbolt className="text-npc-gold text-xl" />;
    
    return <HiDesktopComputer className="text-npc-gold text-xl" />;
  };
  
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const response = await categoryAPI.getAllCategories({ hierarchical: true });
      
      if (response.data?.success) {
        const categoriesData = response.data.data || [];
        setCategories(categoriesData);
        setFilteredCategories(categoriesData);
        setTotalCount(getFlattenedCategoriesCount(categoriesData));
        setError(null);
      } else {
        setError('Failed to load categories. Please try again.');
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError('Failed to load categories. Please try again.');
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    window.Swal = Swal;
  }, []);

  const getFlattenedCategoriesCount = (categoriesArray) => {
    let count = 0;
    
    function countCategories(cats) {
      count += cats.length;
      cats.forEach(cat => {
        if (cat.children && cat.children.length > 0) {
          countCategories(cat.children);
        }
      });
    }
    
    countCategories(categoriesArray);
    return count;
  };

  const flattenCategories = (categoriesArray, result = []) => {
    categoriesArray.forEach(category => {
      result.push({...category});
      if (category.children && category.children.length > 0) {
        flattenCategories(category.children, result);
      }
    });
    return result;
  };

  const fetchProductCounts = async () => {
    try {
      const response = await productAPI.getAllProducts({ limit: 1000 });
      if (response.data.success) {
        const products = response.data.data;
        const counts = {};
        
        products.forEach(product => {
          const categoryId = product.categoryId || product.Category?.id;
          if (categoryId) {
            counts[categoryId] = (counts[categoryId] || 0) + 1;
          }
        });
        
        setCategoryProductCounts(counts);
      }
    } catch (error) {
      console.error("Error fetching product counts:", error);
    }
  };
  
  useEffect(() => {
    fetchCategories();
    fetchProductCounts();
  }, [fetchCategories]);
  
  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    setIsSearching(true);
    
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    const timeoutId = setTimeout(() => {
      if (term.trim() === '') {
        setFilteredCategories(categories);
      } else {
        const searchLower = term.toLowerCase();
        
        const flattenedCategories = flattenCategories(categories);
        
        const matchedCategories = flattenedCategories.filter(
          category => category.name.toLowerCase().includes(searchLower) ||
                     (category.description || '').toLowerCase().includes(searchLower)
        );
        
        const matchedIds = new Set(matchedCategories.map(cat => cat.id));
        
        const shouldIncludeCategory = (category) => {
          if (category.name.toLowerCase().includes(searchLower) ||
              (category.description || '').toLowerCase().includes(searchLower)) {
            return true;
          }
          
          if (category.children && category.children.length > 0) {
            return category.children.some(child => shouldIncludeCategory(child) || matchedIds.has(child.id));
          }
          
          return false;
        };
        
        const filteredResults = categories.filter(shouldIncludeCategory);
        setFilteredCategories(filteredResults);
      }
      
      setIsSearching(false);
    }, 300); 
    
    setSearchTimeout(timeoutId);
  };
  
  const clearSearch = () => {
    setSearchTerm('');
    setFilteredCategories(categories);
  };
  
  const handleAddCategory = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };
  
  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleCategorySubmit = async (categoryData) => {
    try {
      if (editingCategory) {
        const response = await categoryAPI.updateCategory(editingCategory.id, categoryData);
        
        if (response.data && response.data.success) {
          fetchCategories();
          
          Swal.fire({
            icon: 'success',
            title: 'Category Updated',
            text: 'The category has been updated successfully.',
            timer: 2000,
            showConfirmButton: false,
            confirmButtonColor: '#F0A84E'
          });
        } else {
          console.error('Error updating category:', response.data?.message || 'Unknown error');
          Swal.fire({
            icon: 'error',
            title: 'Update Failed',
            text: response.data?.message || 'Failed to update category. Please try again.',
            confirmButtonColor: '#F0A84E'
          });
        }
      } else {
        const response = await categoryAPI.createCategory(categoryData);
        
        if (response.data && response.data.success) {
          fetchCategories();
          
          Swal.fire({
            icon: 'success',
            title: 'Category Added',
            text: 'The new category has been added successfully.',
            timer: 2000,
            showConfirmButton: false,
            confirmButtonColor: '#F0A84E'
          });
        } else {
          console.error('Error creating category:', response.data?.message || 'Unknown error');
          Swal.fire({
            icon: 'error',
            title: 'Creation Failed',
            text: response.data?.message || 'Failed to create category. Please try again.',
            confirmButtonColor: '#F0A84E'
          });
        }
      }
      
      handleCloseModal();
    } catch (err) {
      console.error("Error saving category:", err);
      
      Swal.fire({
        icon: 'error',
        title: 'Operation Failed',
        text: err.response?.data?.message || 'An error occurred. Please try again.',
        confirmButtonColor: '#F0A84E'
      });
    }
  };
  
  const handleDeleteCategory = async (categoryId) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this! All related products will need to be reassigned.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#F0A84E',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });
    
    if (result.isConfirmed) {
      try {
        await categoryAPI.deleteCategory(categoryId);
        
        Swal.fire({
          title: 'Deleted!',
          text: 'Category has been deleted.',
          icon: 'success',
          confirmButtonColor: '#F0A84E',
        });
        
        fetchCategories();
      } catch (err) {
        console.error("Error deleting category:", err);
        
        Swal.fire({
          title: 'Error!',
          text: err.response?.data?.message || 'Failed to delete category. It may have products or subcategories associated with it.',
          icon: 'error',
          confirmButtonColor: '#F0A84E'
        });
      }
    }
  };
  
  const countVisibleCategories = useCallback((categoryList) => {
    let count = 0;
    
    function countRecursive(categories) {
      categories.forEach(category => {
        count++;
        if (category.children && category.children.length > 0) {
          countRecursive(category.children);
        }
      });
    }
    
    countRecursive(categoryList);
    return count;
  }, []);
  
  const renderCategoryCard = (category, level = 0) => {
    const cards = [];
    
    cards.push(
      <div key={category.id} className="card bg-white shadow mb-4 overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow duration-200">
        <div className="p-4">
          <div className="flex flex-col">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div 
                  className={`flex items-center font-medium text-npc-navy mb-1 ${level > 0 ? 'text-sm' : ''}`}
                >
                  {level > 0 && (
                    <span className="text-gray-400 mr-2">└─</span>
                  )}
                  <div className="mr-2 flex-shrink-0">
                    {getCategoryIcon(category.name)}
                  </div>
                  {category.name}
                </div>
                <p className="text-sm text-gray-600 line-clamp-2 mb-1">
                  {category.description || 'No description'}
                </p>
                <div className="flex space-x-2 mt-1 text-xs">
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    {category.children?.length || 0} subcategories
                  </span>
                  <span className={`px-2 py-1 rounded ${
                    categoryProductCounts[category.id] ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {categoryProductCounts[category.id] || 0} products
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-3 pt-3 border-t">
              <button
                onClick={() => handleEditCategory(category)}
                className="btn btn-ghost btn-sm rounded"
                title="Edit Category"
              >
                <i className="fas fa-edit text-blue-600"></i>
              </button>
              <button
                onClick={() => handleDeleteCategory(category.id)}
                className="btn btn-ghost btn-sm rounded"
                disabled={category.children?.length > 0}
                title={category.children?.length > 0 ? "Cannot delete category with subcategories" : "Delete Category"}
              >
                <i className={`fas fa-trash ${category.children?.length > 0 ? 'text-gray-400' : 'text-red-600'}`}></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
    
    if (category.children && category.children.length > 0) {
      category.children.forEach(child => {
        cards.push(...renderCategoryCard(child, level + 1));
      });
    }
    
    return cards;
  };
  
  const renderCategoryRows = (categoryList, level = 0) => {
    return categoryList.map(category => (
      <React.Fragment key={category.id}>
        <tr className={`hover:bg-gray-50 border-b border-gray-100 ${level > 0 ? 'bg-gray-50/50' : ''}`}>
          <td className="px-4 py-3">
            <div 
              className="flex items-center"
              style={{ paddingLeft: `${level * 20}px` }}
            >
              {level > 0 && (
                <span className="text-gray-400 mr-2">└─</span>
              )}
              <div className="mr-2 flex-shrink-0">
                {getCategoryIcon(category.name)}
              </div>
              <span className="font-medium text-npc-navy">{category.name}</span>
            </div>
          </td>
          <td className="px-4 py-3">
            <div className="line-clamp-2 text-sm text-gray-600">
              {category.description || 'No description'}
            </div>
          </td>
          <td className="px-4 py-3 text-center">
            {category.children?.length || 0}
          </td>
          <td className="px-4 py-3 text-center">
            <span className={`inline-block rounded-full px-2 py-1 text-xs ${
              categoryProductCounts[category.id] ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'
            }`}>
              {categoryProductCounts[category.id] || 0} products
            </span>
          </td>
          <td className="px-4 py-3 text-right whitespace-nowrap">
            <div className="flex space-x-2 justify-end">
              <button
                onClick={() => handleEditCategory(category)}
                className="btn btn-ghost btn-sm rounded-md"
                title="Edit Category"
              >
                <i className="fas fa-edit text-blue-600"></i>
              </button>
              <button
                onClick={() => handleDeleteCategory(category.id)}
                className="btn btn-ghost btn-sm rounded-md"
                disabled={category.children?.length > 0}
                title={category.children?.length > 0 ? "Cannot delete category with subcategories" : "Delete Category"}
              >
                <i className="fas fa-trash text-red-600"></i>
              </button>
            </div>
          </td>
        </tr>
        {category.children && category.children.length > 0 && 
          renderCategoryRows(category.children, level + 1)
        }
      </React.Fragment>
    ));
  };
  
  const visibleCategoriesCount = countVisibleCategories(filteredCategories);
  
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      
      <div className="flex">
        <Sidebar isAdmin={true} />
        
        <div className="flex-1 p-4 sm:p-6 mb-16 md:mb-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h1 className="text-xl md:text-2xl font-bold text-npc-navy">Category Management</h1>
            
            <button 
              className="btn bg-npc-gold hover:bg-npc-darkGold text-white border-none w-full sm:w-auto"
              onClick={handleAddCategory}
            >
              <i className="fas fa-plus mr-2"></i>
              Add New Category
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
                Search
              </button>
              <button
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeFilter === 'advanced' 
                    ? 'bg-white text-npc-navy shadow' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => setActiveFilter('advanced')}
              >
                <i className="fas fa-info-circle mr-2"></i>
                Help
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
                      placeholder="Search by category name or description..."
                      className="input input-bordered w-full pr-10 bg-white text-gray-800 border-gray-300 focus:border-npc-gold focus:ring-npc-gold"
                      value={searchTerm}
                      onChange={handleSearchChange}
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
            </div>
            
            <div className="flex justify-between items-center mt-3">
              <div className="text-sm text-gray-500">
                {searchTerm && !loading && (
                  <span>
                    {visibleCategoriesCount} result{visibleCategoriesCount !== 1 ? 's' : ''} found for "{searchTerm}"
                  </span>
                )}
              </div>
              {searchTerm && (
                <button 
                  className="btn btn-ghost btn-sm text-gray-600 hover:text-white"
                  onClick={clearSearch}
                >
                  <i className="fas fa-undo mr-1"></i>
                  Clear Search
                </button>
              )}
            </div>
          </div>
          
          {activeFilter === 'simple' && (
            <div className="bg-white rounded-lg shadow p-4 mb-4 md:hidden">
              <div className="form-control">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search categories..."
                    className="input input-bordered w-full pr-10 bg-white text-gray-800 border-gray-300 focus:border-npc-gold focus:ring-npc-gold"
                    value={searchTerm}
                    onChange={handleSearchChange}
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
                {searchTerm && !loading && (
                  <span>
                    {visibleCategoriesCount} result{visibleCategoriesCount !== 1 ? 's' : ''} found
                  </span>
                )}
              </div>
              {searchTerm && (
                <button 
                  className="btn btn-ghost btn-sm text-gray-600 hover:text-white w-full mt-2"
                  onClick={clearSearch}
                >
                  <i className="fas fa-undo mr-1"></i>
                  Clear Search
                </button>
              )}
            </div>
          )}
          
          {activeFilter === 'advanced' && (
            <div className="bg-white rounded-lg shadow p-4 mb-4 md:hidden">
              <h3 className="font-medium text-npc-navy mb-2">Category Management Help</h3>
              <div className="text-sm text-gray-700 space-y-2">
                <p>
                  <i className="fas fa-info-circle text-blue-600 mr-1"></i>
                  Categories can have subcategories (nested categories).
                </p>
                <p>
                  <i className="fas fa-info-circle text-blue-600 mr-1"></i>
                  You cannot delete a category that has subcategories.
                </p>
                <p>
                  <i className="fas fa-info-circle text-blue-600 mr-1"></i>
                  Deleting a category will require reassigning products.
                </p>
              </div>
            </div>
          )}
          
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="font-bold text-npc-navy">Categories {visibleCategoriesCount > 0 && `(${visibleCategoriesCount})`}</h2>
                <p className="text-sm text-gray-600 hidden md:block">
                  Manage your product categories and subcategories
                </p>
              </div>
              
              <button 
                className="btn btn-outline border-npc-gold text-npc-navy hover:bg-npc-gold hover:text-white hover:border-npc-gold"
                onClick={fetchCategories}
              >
                <i className="fas fa-sync-alt mr-2"></i>
                <span className="hidden md:inline">Refresh</span>
              </button>
            </div>
          
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="flex flex-col items-center">
                  <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full border-gray-300 border-t-npc-gold" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-3 text-gray-600">Loading categories...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex flex-col justify-center items-center h-64">
                <div className="text-red-500 text-xl mb-4">
                  <i className="fas fa-exclamation-circle mr-2"></i>
                  {error}
                </div>
                <button 
                  className="btn btn-primary bg-npc-gold hover:bg-npc-darkGold border-none"
                  onClick={fetchCategories}
                >
                  Try Again
                </button>
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="p-8 text-center">
                <i className="fas fa-folder-open text-gray-400 text-4xl mb-4"></i>
                <h3 className="text-lg font-medium mb-2 text-gray-900">No Categories Found</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm ? 
                    `No categories match your search criteria "${searchTerm}".` : 
                    "You haven't created any categories yet."
                  }
                </p>
                {searchTerm ? (
                  <button
                    className="btn btn-outline btn-sm text-gray-600 hover:text-white"
                    onClick={clearSearch}
                  >
                    Clear Search
                  </button>
                ) : (
                  <button
                    onClick={handleAddCategory}
                    className="btn bg-npc-gold hover:bg-npc-darkGold text-white border-none"
                  >
                    <i className="fas fa-plus mr-2"></i>
                    Add New Category
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="block md:hidden p-4">
                  {filteredCategories.map(category => 
                    renderCategoryCard(category)
                  ).flat()}
                </div>
                
                <div className="hidden md:block">
                  <div className="overflow-x-auto">
                    <table className="table w-full text-gray-700">
                      <thead className='text-gray-700 bg-gray-200'>
                        <tr>
                          <th className="px-4 py-3 text-left">Name</th>
                          <th className="px-4 py-3 text-left">Description</th>
                          <th className="px-4 py-3 text-center">Subcategories</th>
                          <th className="px-4 py-3 text-center">Products</th>
                          <th className="px-4 py-3 text-right w-32">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {renderCategoryRows(filteredCategories)}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="px-4 py-3 bg-gray-50 border-t text-xs text-gray-500">
                  Showing {visibleCategoriesCount} of {totalCount} categories
                  {searchTerm && (
                    <span> (filtered by search)</span>
                  )}
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
                  <i className="fas fa-info-circle text-lg"></i>
                  <span className="text-xs mt-1">Help</span>
                </button>
                <button 
                  className="flex flex-col items-center px-4 py-2 text-gray-500"
                  onClick={handleAddCategory}
                >
                  <i className="fas fa-plus text-lg"></i>
                  <span className="text-xs mt-1">Add</span>
                </button>
                <button 
                  className="flex flex-col items-center px-4 py-2 text-gray-500"
                  onClick={fetchCategories}
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
        <CategoryForm
          category={editingCategory}
          categories={categories}
          onSubmit={handleCategorySubmit}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default CategoryManagement;