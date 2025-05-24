import React, { useState, useEffect } from 'react';

const CategoryForm = ({ category, categories, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parentId: '',
    imageUrl: null
  });
  
  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        description: category.description || '',
        parentId: category.parentId || '',
        imageUrl: null
      });
      
      if (category.imageUrl) {
        setImagePreview(category.imageUrl);
      }
    }
  }, [category]);
  
  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    
    if (type === 'file' && files && files.length > 0) {
      const file = files[0];
      
      setFormData({
        ...formData,
        imageUrl: file
      });
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
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
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required';
    }
    
    if (category && formData.parentId === category.id) {
      newErrors.parentId = 'A category cannot be its own parent';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const categoryFormData = new FormData();
      
      categoryFormData.append('name', formData.name);
      if (formData.description) categoryFormData.append('description', formData.description);
      if (formData.parentId) categoryFormData.append('parentId', formData.parentId);
      
      if (formData.imageUrl instanceof File) {
        categoryFormData.append('categoryImage', formData.imageUrl);
      }
      
      console.log('Form Data contents:');
      for (let [key, value] of categoryFormData.entries()) {
        console.log(`${key}: ${value instanceof File ? value.name : value}`);
      }
      
      await onSubmit(categoryFormData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const availableParentCategories = categories.filter(cat => {
    if (category && cat.id === category.id) return false;
    
    if (category && category.children) {
      const getAllDescendantIds = (items) => {
        let ids = [];
        items.forEach(item => {
          ids.push(item.id);
          if (item.children && item.children.length > 0) {
            ids = [...ids, ...getAllDescendantIds(item.children)];
          }
        });
        return ids;
      };
      
      const descendantIds = getAllDescendantIds(category.children);
      if (descendantIds.includes(cat.id)) return false;
    }
    
    return true;
  });
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" onClick={onClose}>
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex justify-between items-center pb-4 mb-4 border-b">
                <h3 className="text-lg font-bold text-npc-navy">
                  {category ? 'Edit Category' : 'Add New Category'}
                </h3>
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-500"
                  onClick={onClose}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              <div className="space-y-5">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium text-gray-700">Category Name *</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`input input-bordered w-full rounded-md px-4 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-npc-gold focus:border-transparent bg-npc-light text-gray-700`}
                    placeholder="Enter category name"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                  )}
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium text-gray-700">Description</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className={`textarea textarea-bordered h-24 w-full rounded-md px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-npc-gold focus:border-transparent bg-npc-light text-gray-700`}
                    placeholder="Enter category description"
                  ></textarea>
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium text-gray-700">Parent Category</span>
                  </label>
                  <select
                    name="parentId"
                    value={formData.parentId}
                    onChange={handleChange}
                    className={`select select-bordered w-full rounded-md px-4 py-2 border ${errors.parentId ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-npc-gold focus:border-transparent bg-npc-light text-gray-700`}
                  >
                    <option value="">None (Root Category)</option>
                    {availableParentCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  {errors.parentId && (
                    <p className="mt-1 text-sm text-red-500">{errors.parentId}</p>
                  )}
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium text-gray-700">Category Image</span>
                  </label>
                  <div className={`border-2 border-dashed rounded-lg p-4 text-center ${errors.imageUrl ? 'border-red-300' : 'border-gray-300'} bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer`}>
                    {imagePreview ? (
                      <div className="mb-3">
                        <img 
                          src={imagePreview} 
                          alt="Category preview" 
                          className="max-h-40 mx-auto rounded-md object-contain"
                        />
                      </div>
                    ) : (
                      <div className="text-gray-500 mb-3">
                        <i className="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-2"></i>
                        <p>Upload category image</p>
                      </div>
                    )}
                    
                    <input
                      type="file"
                      name="imageUrl"
                      accept="image/*"
                      onChange={handleChange}
                      className="hidden"
                      id="category-image"
                    />
                    <label htmlFor="category-image" className="btn btn-sm bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 mt-2">
                      {imagePreview ? 'Change Image' : 'Upload Image'}
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t">
              <button
                type="submit"
                className="btn bg-npc-gold hover:bg-npc-darkGold text-white border-none w-full sm:w-auto sm:ml-3 rounded-md focus:outline-none focus:ring-2 focus:ring-npc-gold focus:ring-opacity-50 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="loading loading-spinner loading-xs mr-2"></span>
                    {category ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  category ? 'Update Category' : 'Create Category'
                )}
              </button>
              <button
                type="button"
                className="btn bg-white text-gray-700 mt-3 sm:mt-0 w-full sm:w-auto rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 transition-colors"
                onClick={onClose}
                disabled={isSubmitting}
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

export default CategoryForm;