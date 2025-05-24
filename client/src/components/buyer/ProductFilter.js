import React, { useState } from 'react';

const ProductFilter = ({ onFilter, className }) => {
  const [priceRange, setPriceRange] = useState([0, 20000000]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedConditions, setSelectedConditions] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  
  const categories = [
    { id: 1, name: 'Laptop' },
    { id: 2, name: 'Desktop PC' },
    { id: 3, name: 'Processor' },
    { id: 4, name: 'Graphic Card' },
    { id: 5, name: 'Memory' },
    { id: 6, name: 'Storage' },
    { id: 7, name: 'Monitor' },
    { id: 8, name: 'Peripherals' }
  ];
  
  const conditions = [
    { id: 'new', name: 'New' },
    { id: 'used', name: 'Used' },
    { id: 'refurbished', name: 'Refurbished' }
  ];
  
  const brands = [
    { id: 1, name: 'Asus' },
    { id: 2, name: 'MSI' },
    { id: 3, name: 'Gigabyte' },
    { id: 4, name: 'HP' },
    { id: 5, name: 'Dell' },
    { id: 6, name: 'Lenovo' },
    { id: 7, name: 'Acer' },
    { id: 8, name: 'Intel' },
    { id: 9, name: 'AMD' },
    { id: 10, name: 'Nvidia' }
  ];
  
  const handleCategoryChange = (categoryId) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };
  
  const handleConditionChange = (conditionId) => {
    setSelectedConditions(prev => {
      if (prev.includes(conditionId)) {
        return prev.filter(id => id !== conditionId);
      } else {
        return [...prev, conditionId];
      }
    });
  };
  
  const handleBrandChange = (brandId) => {
    setSelectedBrands(prev => {
      if (prev.includes(brandId)) {
        return prev.filter(id => id !== brandId);
      } else {
        return [...prev, brandId];
      }
    });
  };
  
  const handlePriceRangeChange = (index, value) => {
    const newPriceRange = [...priceRange];
    newPriceRange[index] = parseInt(value);
    setPriceRange(newPriceRange);
  };
  
  const applyFilters = () => {
    const filters = {
      priceRange,
      categories: selectedCategories,
      conditions: selectedConditions,
      brands: selectedBrands
    };
    
    onFilter(filters);
    setIsMobileFilterOpen(false);
  };
  
  const resetFilters = () => {
    setPriceRange([0, 20000000]);
    setSelectedCategories([]);
    setSelectedConditions([]);
    setSelectedBrands([]);
    
    onFilter({
      priceRange: [0, 20000000],
      categories: [],
      conditions: [],
      brands: []
    });
  };
  
  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };
  
  const filterContent = (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-medium mb-3 text-gray-800">Price Range</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-npc-gold">{formatPrice(priceRange[0])}</span>
            <span className="text-sm font-medium text-npc-gold">{formatPrice(priceRange[1])}</span>
          </div>
          <input
            type="range"
            min="0"
            max="20000000"
            value={priceRange[0]}
            onChange={(e) => handlePriceRangeChange(0, e.target.value)}
            className="range range-xs range-primary"
          />
          <input
            type="range"
            min="0"
            max="20000000"
            value={priceRange[1]}
            onChange={(e) => handlePriceRangeChange(1, e.target.value)}
            className="range range-xs range-primary"
          />
        </div>
      </div>
      
      <div>
        <h3 className="font-medium mb-3 text-gray-800">Categories</h3>
        <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
          {categories.map((category) => (
            <div key={category.id} className="form-control">
              <label className="label cursor-pointer hover:bg-gray-50 rounded-lg p-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm checkbox-primary"
                    checked={selectedCategories.includes(category.id)}
                    onChange={() => handleCategoryChange(category.id)}
                  />
                  <span className="label-text text-gray-700">{category.name}</span>
                </div>
              </label>
            </div>
          ))}
        </div>
      </div>
      
      <div>
        <h3 className="font-medium mb-3 text-gray-800">Condition</h3>
        <div className="space-y-2 flex flex-wrap gap-2">
          {conditions.map((condition) => (
            <label
              key={condition.id}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                selectedConditions.includes(condition.id) 
                  ? 'bg-npc-gold/10 border border-npc-gold/30' 
                  : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
              }`}
            >
              <input
                type="checkbox"
                className="checkbox checkbox-sm checkbox-primary"
                checked={selectedConditions.includes(condition.id)}
                onChange={() => handleConditionChange(condition.id)}
              />
              <span className="label-text text-gray-700">{condition.name}</span>
            </label>
          ))}
        </div>
      </div>
      
      <div>
        <h3 className="font-medium mb-3 text-gray-800">Brands</h3>
        <div className="space-y-2 max-h-40 overflow-y-auto pr-2 grid grid-cols-2 gap-1">
          {brands.map((brand) => (
            <div key={brand.id} className="form-control">
              <label className="label cursor-pointer hover:bg-gray-50 rounded-lg p-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm checkbox-primary"
                    checked={selectedBrands.includes(brand.id)}
                    onChange={() => handleBrandChange(brand.id)}
                  />
                  <span className="label-text text-gray-700">{brand.name}</span>
                </div>
              </label>
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex gap-2 pt-4 border-t">
        <button 
          onClick={applyFilters} 
          className="btn bg-npc-gold hover:bg-npc-darkGold text-white border-none flex-1"
        >
          <i className="fas fa-filter mr-2"></i>
          Apply Filters
        </button>
        <button 
          onClick={resetFilters} 
          className="btn btn-outline hover:bg-red-50 hover:border-red-500 hover:text-red-500"
        >
          <i className="fas fa-undo mr-2"></i>
          Reset
        </button>
      </div>
    </div>
  );
  
  return (
    <>
      <div className={`hidden md:block ${className} bg-white p-5 rounded-xl shadow-sm`}>
        <h2 className="text-lg font-semibold text-npc-navy mb-4 pb-2 border-b">Product Filters</h2>
        {filterContent}
      </div>
      
      <div className="md:hidden sticky top-16 z-30 bg-white p-3 border-b shadow-sm">
        <button
          onClick={() => setIsMobileFilterOpen(true)}
          className="btn w-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 flex justify-between items-center"
        >
          <span className="font-medium">Product Filters</span>
          <div className="bg-npc-gold/10 h-8 w-8 rounded-full flex items-center justify-center">
            <i className="fas fa-filter text-npc-gold"></i>
          </div>
        </button>
      </div>
      
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div 
            className="absolute inset-0 bg-black opacity-50"
            onClick={() => setIsMobileFilterOpen(false)}
          ></div>
          
          <div className="relative bg-white w-4/5 max-w-sm h-full overflow-y-auto p-5">
            <div className="flex justify-between items-center mb-6 pb-2 border-b">
              <h2 className="text-lg font-bold text-npc-navy">Product Filters</h2>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="btn btn-circle btn-sm bg-gray-100 hover:bg-gray-200 border-none text-gray-700"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            {filterContent}
          </div>
        </div>
      )}
    </>
  );
};

export default ProductFilter;