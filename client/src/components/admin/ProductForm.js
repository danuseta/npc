import React, { useState, useEffect } from 'react';

const ProductForm = ({ product, categories, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    categoryId: '',
    sku: '',
    weight: '',
    dimensions: '',
    discountPercentage: 0,
    isActive: true,
    images: [],  
    specifications: {},
    features: []
  });
  
  const [errors, setErrors] = useState({});
  const [mainImagePreview, setMainImagePreview] = useState('');
  const [galleryPreviews, setGalleryPreviews] = useState([]);
  const [newFeature, setNewFeature] = useState('');
  const [newSpecKey, setNewSpecKey] = useState('');
  const [newSpecValue, setNewSpecValue] = useState('');
  
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price || '',
        stock: product.stock || '',
        categoryId: product.categoryId || product.Category?.id || '',
        sku: product.sku || '',
        weight: product.weight || '',
        dimensions: product.dimensions || '',
        discountPercentage: product.discountPercentage || 0,
        isActive: product.isActive ?? true,
        images: [],
        specifications: product.specifications || {},
        features: product.features || []
      });
      
      if (product.imageUrl) {
        setMainImagePreview(product.imageUrl);
      }
      
      if (product.gallery && Array.isArray(product.gallery)) {
        const galleryUrls = product.gallery.map(img => typeof img === 'string' ? img : img.url);
        setGalleryPreviews(galleryUrls);
      }
    }
  }, [product]);
  
  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };
  
  const calculateDiscountedPrice = () => {
    if (!formData.price) return "0";
    const price = parseFloat(formData.price);
    const discount = parseFloat(formData.discountPercentage) || 0;
    const discountedPrice = price - (price * discount / 100);
    return formatNumber(Math.round(discountedPrice));
  };
  
  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (name === 'mainImage' && files && files.length > 0) {
      const file = files[0];
      setFormData(prev => {
        const newImages = [...prev.images];
        newImages[0] = file;
        return { ...prev, images: newImages };
      });
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setMainImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else if (name === 'galleryImages' && files && files.length > 0) {
      const newFiles = Array.from(files);
      
      setFormData(prev => {
        const currentMainImage = prev.images[0] || null;
        return { 
          ...prev, 
          images: [currentMainImage, ...newFiles]
        };
      });
      
      newFiles.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setGalleryPreviews(prev => [...prev, reader.result]);
        };
        reader.readAsDataURL(file);
      });
    } else if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: checked
      });
    } else if (type === 'number') {
      setFormData({
        ...formData,
        [name]: value === '' ? '' : parseFloat(value)
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
    
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };
  
  const removeGalleryImage = (index) => {
    const updatedGalleryPreviews = [...galleryPreviews];
    updatedGalleryPreviews.splice(index, 1);
    setGalleryPreviews(updatedGalleryPreviews);
    
    setFormData(prev => {
      const newImages = [...prev.images];
      newImages.splice(index + 1, 1);
      return { ...prev, images: newImages };
    });
  };
  
  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData({
        ...formData,
        features: [...formData.features, newFeature]
      });
      setNewFeature('');
    }
  };
  
  const removeFeature = (index) => {
    const updatedFeatures = [...formData.features];
    updatedFeatures.splice(index, 1);
    setFormData({
      ...formData,
      features: updatedFeatures
    });
  };
  
  const addSpecification = () => {
    if (newSpecKey.trim() && newSpecValue.trim()) {
      setFormData({
        ...formData,
        specifications: {
          ...formData.specifications,
          [newSpecKey]: newSpecValue
        }
      });
      setNewSpecKey('');
      setNewSpecValue('');
    }
  };
  
  const removeSpecification = (key) => {
    const updatedSpecs = { ...formData.specifications };
    delete updatedSpecs[key];
    setFormData({
      ...formData,
      specifications: updatedSpecs
    });
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.price || formData.price <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }
    
    if (formData.stock === '' || formData.stock < 0) {
      newErrors.stock = 'Stock must be 0 or greater';
    }
    
    if (!formData.categoryId) {
      newErrors.categoryId = 'Please select a category';
    }
    
    if (!product && !mainImagePreview) {
      newErrors.mainImage = 'Please upload a product image';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const productFormData = new FormData();
    
    productFormData.append('name', formData.name);
    productFormData.append('description', formData.description);
    productFormData.append('price', formData.price);
    productFormData.append('stock', formData.stock);
    productFormData.append('categoryId', formData.categoryId);
    productFormData.append('isActive', formData.isActive.toString());
    
    if (formData.sku) productFormData.append('sku', formData.sku);
    if (formData.weight) productFormData.append('weight', formData.weight);
    if (formData.dimensions) productFormData.append('dimensions', formData.dimensions);
    productFormData.append('discountPercentage', formData.discountPercentage || 0);
    
    if (formData.images[0] instanceof File) {
      productFormData.append('mainImage', formData.images[0]);
    }
    

    for (let i = 1; i < formData.images.length; i++) {
      if (formData.images[i] instanceof File) {
        productFormData.append('galleryImages', formData.images[i]);
      }
    }
    

    if (Object.keys(formData.specifications).length > 0) {
      const specificationsString = JSON.stringify(formData.specifications);
      productFormData.append('specifications', specificationsString);
    }
    
    if (formData.features.length > 0) {
      const featuresString = JSON.stringify(formData.features);
      productFormData.append('features', featuresString);
    }
    
    onSubmit(productFormData);
  };
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" onClick={onClose}>
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex justify-between items-center pb-4 mb-4 border-b">
                <h3 className="text-lg font-bold text-npc-navy">
                  {product ? 'Edit Product' : 'Add New Product'}
                </h3>
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-500"
                  onClick={onClose}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-5">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium text-gray-700">Product Name *</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`input input-bordered w-full rounded-md px-4 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-npc-gold focus:border-transparent bg-npc-light text-gray-700`}
                      placeholder="Enter product name"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                    )}
                  </div>
                  
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium text-gray-700">Description *</span>
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      className={`textarea textarea-bordered h-24 w-full rounded-md px-4 py-2 border ${errors.description ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-npc-gold focus:border-transparent bg-npc-light text-gray-700`}
                      placeholder="Enter product description"
                    ></textarea>
                    {errors.description && (
                      <p className="mt-1 text-sm text-red-500">{errors.description}</p>
                    )}
                  </div>
                  
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium text-gray-700">SKU (Stock Keeping Unit)</span>
                    </label>
                    <input
                      type="text"
                      name="sku"
                      value={formData.sku}
                      onChange={handleChange}
                      className="input input-bordered w-full rounded-md px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-npc-gold focus:border-transparent bg-npc-light text-gray-700"
                      placeholder="Enter product SKU (optional)"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium text-gray-700">Price (IDR) *</span>
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-700">
                          Rp
                        </span>
                        <input
                          type="text"
                          name="price"
                          value={formData.price}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^\d]/g, '');
                            setFormData({
                              ...formData,
                              price: value
                            });
                          }}
                          className={`input input-bordered w-full pl-10 rounded-md px-4 py-2 border ${errors.price ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-npc-gold focus:border-transparent bg-npc-light text-gray-700`}
                          placeholder="0"
                        />
                      </div>
                      {errors.price && (
                        <p className="mt-1 text-sm text-red-500">{errors.price}</p>
                      )}
                      {formData.price && (
                        <p className="mt-1 text-xs text-gray-500">
                          Formatted: Rp {formatNumber(formData.price)}
                        </p>
                      )}
                    </div>
                    
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium text-gray-700">Stock *</span>
                      </label>
                      <input
                        type="text"
                        name="stock"
                        value={formData.stock}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^\d]/g, '');
                          setFormData({
                            ...formData,
                            stock: value
                          });
                        }}
                        className={`input input-bordered w-full rounded-md px-4 py-2 border ${errors.stock ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-npc-gold focus:border-transparent bg-npc-light text-gray-700`}
                        placeholder="0"
                      />
                      {errors.stock && (
                        <p className="mt-1 text-sm text-red-500">{errors.stock}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium text-gray-700">Discount (%)</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="discountPercentage"
                        value={formData.discountPercentage}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^\d.]/g, '');
                          if ((value.match(/\./g) || []).length <= 1) {
                            setFormData({
                              ...formData,
                              discountPercentage: value
                            });
                          }
                        }}
                        className="input input-bordered w-full rounded-md px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-npc-gold focus:border-transparent bg-npc-light text-gray-700"
                        placeholder="0"
                      />
                      <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-700">
                        %
                      </span>
                    </div>
                    
                    {parseFloat(formData.price) > 0 && parseFloat(formData.discountPercentage) > 0 && (
                      <div className="mt-2 bg-green-50 p-2 rounded-md border border-green-200">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Price after discount:</span> Rp {calculateDiscountedPrice()}
                        </p>
                        <p className="text-xs text-green-600">
                          Customer saves: Rp {formatNumber(Math.round(formData.price * formData.discountPercentage / 100))}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium text-gray-700">Weight (kg)</span>
                      </label>
                      <input
                        type="text"
                        name="weight"
                        value={formData.weight}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^\d.]/g, '');
                          if ((value.match(/\./g) || []).length <= 1) {
                            setFormData({
                              ...formData,
                              weight: value
                            });
                          }
                        }}
                        className="input input-bordered w-full rounded-md px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-npc-gold focus:border-transparent bg-npc-light text-gray-700"
                        placeholder="0.00"
                      />
                    </div>
                    
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium text-gray-700">Dimensions (LxWxH)</span>
                      </label>
                      <input
                        type="text"
                        name="dimensions"
                        value={formData.dimensions}
                        onChange={handleChange}
                        className="input input-bordered w-full rounded-md px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-npc-gold focus:border-transparent bg-npc-light text-gray-700"
                        placeholder="Ex: 10x5x2 cm"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium text-gray-700">Category *</span>
                      </label>
                      <select
                        name="categoryId"
                        value={formData.categoryId}
                        onChange={handleChange}
                        className={`select select-bordered w-full rounded-md px-4 py-2 border ${errors.categoryId ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-npc-gold focus:border-transparent bg-npc-light text-gray-700`}
                      >
                        <option value="" disabled>Select category</option>
                        {categories.map(category => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                      {errors.categoryId && (
                        <p className="mt-1 text-sm text-red-500">{errors.categoryId}</p>
                      )}
                    </div>
                    
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium text-gray-700">Product Visibility</span>
                      </label>
                      <div className="flex items-center h-12 bg-gray-50 rounded-md px-4 border border-gray-300">
                        <label className="cursor-pointer flex items-center space-x-3">
                          <input
                            type="checkbox"
                            name="isActive"
                            checked={formData.isActive}
                            onChange={handleChange}
                            className="toggle toggle-primary"
                          />
                          <span className={`label-text ${formData.isActive ? 'text-green-600' : 'text-red-500'}`}>
                            {formData.isActive ? 'Visible to customers' : 'Hidden from customers'}
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-5">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium text-gray-700">Main Product Image *</span>
                    </label>
                    <div className={`border-2 border-dashed rounded-lg p-4 text-center ${errors.mainImage ? 'border-red-300' : 'border-gray-300'} bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer`}>
                      {mainImagePreview ? (
                        <div className="mb-3">
                          <img 
                            src={mainImagePreview} 
                            alt="Product preview" 
                            className="max-h-40 mx-auto rounded-md object-contain"
                          />
                        </div>
                      ) : (
                        <div className="text-gray-500 mb-3">
                          <i className="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-2"></i>
                          <p>Upload main product image</p>
                        </div>
                      )}
                      
                      <input
                        type="file"
                        name="mainImage"
                        accept="image/*"
                        onChange={handleChange}
                        className="hidden"
                        id="product-image"
                      />
                      <label htmlFor="product-image" className="btn btn-sm bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 mt-2">
                        {mainImagePreview ? 'Change Image' : 'Upload Image'}
                      </label>
                      
                      {errors.mainImage && (
                        <p className="mt-2 text-sm text-red-500">{errors.mainImage}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium text-gray-700">Product Gallery</span>
                    </label>
                    
                    <div className="border-2 border-dashed rounded-lg p-4 bg-gray-50 border-gray-300">
                      {galleryPreviews.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          {galleryPreviews.map((preview, index) => (
                            <div key={index} className="relative group">
                              <img 
                                src={preview} 
                                alt={`Gallery ${index + 1}`} 
                                className="h-20 w-full object-cover rounded-md border border-gray-200"
                              />
                              <button
                                type="button"
                                onClick={() => removeGalleryImage(index)}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <i className="fas fa-times text-xs"></i>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="text-center">
                        <input
                          type="file"
                          name="galleryImages"
                          accept="image/*"
                          onChange={handleChange}
                          className="hidden"
                          id="gallery-images"
                          multiple
                        />
                        <label htmlFor="gallery-images" className="btn btn-sm bg-white text-gray-700 border border-gray-300 hover:bg-gray-100">
                          <i className="fas fa-images mr-2"></i>
                          Add Gallery Images
                        </label>
                        <p className="text-xs text-gray-500 mt-2">You can upload multiple images at once</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium text-gray-700">Product Features</span>
                    </label>
                    <div className="flex mb-2">
                      <input
                        type="text"
                        value={newFeature}
                        onChange={(e) => setNewFeature(e.target.value)}
                        className="input input-bordered flex-1 mr-2 rounded-md px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-npc-gold focus:border-transparent bg-npc-light text-gray-700"
                        placeholder="Add a feature (e.g. 16GB RAM)"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                      />
                      <button
                        type="button"
                        className="btn bg-npc-navy hover:bg-npc-navy/80 text-white border-none rounded-md focus:outline-none focus:ring-2 focus:ring-npc-navy focus:ring-opacity-50 transition-colors"
                        onClick={addFeature}
                      >
                        Add
                      </button>
                    </div>
                    
                    <div className="space-y-2 max-h-40 overflow-y-auto rounded-md border border-gray-200 p-2 bg-gray-50">
                      {formData.features.map((feature, index) => (
                        <div key={index} className="flex items-center group">
                          <div className="flex-1 bg-white p-2 rounded-md border border-gray-100 group-hover:border-gray-300 text-gray-700 transition-colors">
                            <i className="fas fa-check-circle text-green-500 mr-2"></i>
                            {feature}
                          </div>
                          <button
                            type="button"
                            className="btn btn-sm btn-ghost text-gray-400 hover:text-red-500 ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeFeature(index)}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      ))}
                      
                      {formData.features.length === 0 && (
                        <div className="text-gray-500 text-center py-3">
                          <i className="fas fa-list-ul text-gray-300 text-3xl mb-2"></i>
                          <p>No features added yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium text-gray-700">Product Specifications</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <input
                        type="text"
                        value={newSpecKey}
                        onChange={(e) => setNewSpecKey(e.target.value)}
                        className="input input-bordered rounded-md px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-npc-gold focus:border-transparent bg-npc-light text-gray-700"
                        placeholder="Name (e.g. CPU)"
                      />
                      <input
                        type="text"
                        value={newSpecValue}
                        onChange={(e) => setNewSpecValue(e.target.value)}
                        className="input input-bordered rounded-md px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-npc-gold focus:border-transparent bg-npc-light text-gray-700"
                        placeholder="Value (e.g. Intel i7)"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecification())}
                      />
                    </div>
                    <button
                      type="button"
                      className="btn bg-npc-navy hover:bg-npc-navy/80 text-white border-none w-full rounded-md mb-2 focus:outline-none focus:ring-2 focus:ring-npc-navy focus:ring-opacity-50 transition-colors"
                      onClick={addSpecification}
                    >
                      Add Specification
                    </button>
                    
                    <div className="space-y-2 max-h-40 overflow-y-auto rounded-md border border-gray-200 p-2 bg-gray-50">
                      {Object.entries(formData.specifications).map(([key, value]) => (
                        <div key={key} className="flex items-center group">
                          <div className="flex-1 bg-white p-2 rounded-md border border-gray-100 group-hover:border-gray-300 transition-colors">
                            <span className="font-medium text-npc-navy">{key}: </span>
                            <span className="text-gray-700">{value}</span>
                          </div>
                          <button
                            type="button"
                            className="btn btn-sm btn-ghost text-gray-400 hover:text-red-500 ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeSpecification(key)}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      ))}
                      
                      {Object.keys(formData.specifications).length === 0 && (
                        <div className="text-gray-500 text-center py-3">
                          <i className="fas fa-cogs text-gray-300 text-3xl mb-2"></i>
                          <p>No specifications added yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t">
              <button
                type="submit"
                className="btn bg-npc-gold hover:bg-npc-darkGold text-white border-none w-full sm:w-auto sm:ml-3 rounded-md focus:outline-none focus:ring-2 focus:ring-npc-gold focus:ring-opacity-50 transition-colors"
              >
                {product ? 'Update Product' : 'Add Product'}
              </button>
              <button
                type="button"
                className="btn bg-white text-gray-700 mt-3 sm:mt-0 w-full sm:w-auto rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 transition-colors"
                onClick={onClose}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProductForm;