import React, { useState, useEffect } from 'react';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import Swal from 'sweetalert2';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { carouselAPI } from '../../services/api';

const SortableItem = ({ id, slide, onEdit, onDelete, onToggleActive }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`p-4 hover:bg-gray-50 transition-colors border-b border-gray-200 ${!slide.isActive ? 'bg-gray-50 opacity-75' : ''}`}
    >
      <div className="flex items-center gap-4">
        <div 
          className="text-gray-400 cursor-move"
          {...attributes} 
          {...listeners}
        >
          <i className="fas fa-grip-vertical"></i>
        </div>
        
        <div className="relative w-20 h-20 md:w-24 md:h-24 flex-shrink-0 border border-gray-200 rounded-md overflow-hidden">
          <img
            src={slide.imageUrl}
            alt={slide.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = '/images/product-placeholder.png';
            }}
          />
          {slide.tag && (
            <div className="absolute top-0 left-0 bg-blue-500 text-white text-xs px-1.5 py-0.5">
              {slide.tag}
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-npc-navy truncate">{slide.title}</h3>
          {slide.description && (
            <p className="text-sm text-gray-600 line-clamp-2">{slide.description}</p>
          )}
          <div className="flex items-center mt-1 text-xs space-x-2">
            <span className="text-blue-600">
              <i className="fas fa-link mr-1"></i>
              {slide.buttonLink}
            </span>
            <span className="text-gray-500">
              <i className="fas fa-tag mr-1"></i>
              {slide.buttonText || 'Shop Now'}
            </span>
            <span className={`${slide.isActive ? 'text-green-600' : 'text-red-600'}`}>
              <i className={`fas fa-${slide.isActive ? 'check-circle' : 'times-circle'} mr-1`}></i>
              {slide.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => onToggleActive(slide.id, slide.isActive)}
            title={slide.isActive ? 'Deactivate' : 'Activate'}
          >
            <i className={`fas fa-${slide.isActive ? 'eye-slash' : 'eye'} ${slide.isActive ? 'text-yellow-600' : 'text-green-600'}`}></i>
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => onEdit(slide)}
            title="Edit"
          >
            <i className="fas fa-edit text-blue-600"></i>
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => onDelete(slide.id)}
            title="Delete"
          >
            <i className="fas fa-trash text-red-600"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

const SlideCard = ({ slide, onEdit, onDelete, onToggleActive }) => {
  return (
    <div className={`card bg-white shadow mb-4 overflow-hidden ${!slide.isActive ? 'bg-gray-50 opacity-75' : ''}`}>
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex items-start">
            <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden mr-3">
              <img 
                src={slide.imageUrl} 
                alt={slide.title} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = '/images/product-placeholder.png';
                }}
              />
            </div>
            
            <div className="flex-1">
              <h3 className="font-medium text-npc-navy mb-1">{slide.title}</h3>
              {slide.description && (
                <p className="text-sm text-gray-600 line-clamp-2 mb-1">{slide.description}</p>
              )}
              <div className="flex flex-wrap text-xs text-gray-500">
                {slide.tag && <span className="mr-2 bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">{slide.tag}</span>}
                <span className={`${slide.isActive ? 'text-green-600' : 'text-red-600'}`}>
                  <i className={`fas fa-${slide.isActive ? 'check-circle' : 'times-circle'} mr-1`}></i>
                  {slide.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t flex justify-between items-center">
          <div className="text-xs text-gray-600">
            <i className="fas fa-link mr-1"></i>
            {slide.buttonLink}
          </div>
          
          <div className="flex space-x-2">
            <button 
              className="btn btn-ghost btn-sm rounded-full"
              onClick={() => onToggleActive(slide.id, slide.isActive)}
              aria-label={slide.isActive ? 'Deactivate' : 'Activate'}
            >
              <i className={`fas fa-${slide.isActive ? 'eye-slash' : 'eye'} ${slide.isActive ? 'text-yellow-600' : 'text-green-600'}`}></i>
            </button>
            
            <button 
              className="btn btn-ghost btn-sm rounded-full"
              onClick={() => onEdit(slide)}
              aria-label="Edit"
            >
              <i className="fas fa-edit text-blue-600"></i>
            </button>
            
            <button 
              className="btn btn-ghost btn-sm rounded-full"
              onClick={() => onDelete(slide.id)}
              aria-label="Delete"
            >
              <i className="fas fa-trash text-red-600"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CarouselManagement = () => {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSlide, setEditingSlide] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tag: '',
    buttonText: 'Shop Now',
    buttonLink: '/products',
    isActive: true,
    image: null
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeView, setActiveView] = useState('slides'); 
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchSlides();
    
    window.Swal = Swal;
  }, []);

  const fetchSlides = async () => {
    try {
      setLoading(true);
      const response = await carouselAPI.getAllSlidesAdmin();
      
      const sortedSlides = response.data.data.sort((a, b) => a.displayOrder - b.displayOrder);
      setSlides(sortedSlides);
    } catch (error) {
      console.error('Error fetching carousel slides:', error);
      Swal.fire({
        icon: 'error',
        title: 'Failed to Load Data',
        text: 'An error occurred while loading carousel data.',
        confirmButtonColor: '#F0A84E'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (type === 'file') {
      if (files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviewImage(e.target.result);
        };
        reader.readAsDataURL(files[0]);
        
        setFormData({
          ...formData,
          image: files[0]
        });
      }
    } else if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: checked
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Failed',
        text: 'Slide title is required.',
        confirmButtonColor: '#F0A84E'
      });
      return;
    }
    
    if (!formData.image && !editingSlide) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Failed',
        text: 'Slide image is required.',
        confirmButtonColor: '#F0A84E'
      });
      return;
    }
    
    const formDataObj = new FormData();
    formDataObj.append('title', formData.title);
    formDataObj.append('description', formData.description || '');
    formDataObj.append('tag', formData.tag || '');
    formDataObj.append('buttonText', formData.buttonText || 'Shop Now');
    formDataObj.append('buttonLink', formData.buttonLink || '/products');
    formDataObj.append('isActive', formData.isActive);
    
    if (formData.image) {
      formDataObj.append('image', formData.image);
    }
    
    try {
      setIsSaving(true);
      
      if (editingSlide) {
        await carouselAPI.updateSlide(editingSlide.id, formDataObj);
        
        Swal.fire({
          icon: 'success',
          title: 'Slide Updated',
          text: 'Carousel slide has been updated successfully.',
          timer: 2000,
          showConfirmButton: false,
          confirmButtonColor: '#F0A84E'
        });
      } else {
        await carouselAPI.createSlide(formDataObj);
        
        Swal.fire({
          icon: 'success',
          title: 'Slide Added',
          text: 'New carousel slide has been added successfully.',
          timer: 2000,
          showConfirmButton: false,
          confirmButtonColor: '#F0A84E'
        });
      }
      
      fetchSlides();
      
      resetForm();
    } catch (error) {
      console.error('Error saving carousel slide:', error);
      Swal.fire({
        icon: 'error',
        title: 'Failed to Save',
        text: 'An error occurred while saving the carousel slide.',
        confirmButtonColor: '#F0A84E'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      tag: '',
      buttonText: 'Shop Now',
      buttonLink: '/products',
      isActive: true,
      image: null
    });
    setPreviewImage(null);
    setEditingSlide(null);
    setShowForm(false);
    setActiveView('slides');
  };

  const handleEdit = (slide) => {
    setEditingSlide(slide);
    setFormData({
      title: slide.title || '',
      description: slide.description || '',
      tag: slide.tag || '',
      buttonText: slide.buttonText || 'Shop Now',
      buttonLink: slide.buttonLink || '/products',
      isActive: slide.isActive,
      image: null
    });
    setPreviewImage(slide.imageUrl);
    setShowForm(true);
    setActiveView('form');
    
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Delete Slide?',
      text: 'Deleted carousel slides cannot be recovered.',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6'
    });
    
    if (result.isConfirmed) {
      try {
        await carouselAPI.deleteSlide(id);
        
        Swal.fire({
          icon: 'success',
          title: 'Slide Deleted',
          text: 'Carousel slide has been deleted successfully.',
          timer: 2000,
          showConfirmButton: false,
          confirmButtonColor: '#F0A84E'
        });
        
        fetchSlides();
      } catch (error) {
        console.error('Error deleting carousel slide:', error);
        Swal.fire({
          icon: 'error',
          title: 'Failed to Delete',
          text: 'An error occurred while deleting the carousel slide.',
          confirmButtonColor: '#F0A84E'
        });
      }
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      await carouselAPI.toggleActive(id);
      
      setSlides(slides.map(slide => 
        slide.id === id ? { ...slide, isActive: !currentStatus } : slide
      ));
      
      Swal.fire({
        icon: 'success',
        title: `Slide ${currentStatus ? 'Deactivated' : 'Activated'}`,
        text: `Slide successfully ${currentStatus ? 'deactivated' : 'activated'}.`,
        toast: true,
        position: 'bottom-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        confirmButtonColor: '#F0A84E'
      });
    } catch (error) {
      console.error('Error toggling slide status:', error);
      Swal.fire({
        icon: 'error',
        title: 'Failed to Change Status',
        text: 'An error occurred while changing the slide status.',
        confirmButtonColor: '#F0A84E'
      });
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      setSlides((items) => {
        const oldIndex = items.findIndex(item => item.id.toString() === active.id);
        const newIndex = items.findIndex(item => item.id.toString() === over.id);
        
        const reorderedSlides = arrayMove(items, oldIndex, newIndex);
        
        updateServerOrder(reorderedSlides);
        
        return reorderedSlides;
      });
    }
  };
  
  const updateServerOrder = async (reorderedSlides) => {
    try {
      const updatedSlidesOrder = reorderedSlides.map((slide, index) => ({
        id: slide.id,
        displayOrder: index
      }));
      
      await carouselAPI.updateOrder({ slides: updatedSlidesOrder });
    } catch (error) {
      console.error('Error updating slide order:', error);
      Swal.fire({
        icon: 'error',
        title: 'Failed to Change Order',
        text: 'An error occurred while changing the slide order.',
        toast: true,
        position: 'bottom-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        confirmButtonColor: '#F0A84E'
      });
    }
  };

  const renderActiveContent = () => {
    if (activeView === 'form') {
      return (
        <div className="bg-white rounded-lg shadow-lg mb-6 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <h2 className="font-bold text-npc-navy">
              {editingSlide ? 'Edit Carousel Slide' : 'Add New Carousel Slide'}
            </h2>
          </div>
          
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Slide Image
                  </label>
                  <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md relative h-64">
                    {previewImage ? (
                      <>
                        <img 
                          src={previewImage} 
                          alt="Preview" 
                          className="absolute inset-0 w-full h-full object-contain" 
                        />
                        <button
                          type="button"
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                          onClick={() => {
                            setPreviewImage(null);
                            setFormData({
                              ...formData,
                              image: null
                            });
                          }}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </>
                    ) : (
                      <div className="space-y-1 text-center">
                        <i className="fas fa-image mx-auto h-12 w-12 text-gray-400"></i>
                        <div className="flex text-sm text-gray-600">
                          <label
                            htmlFor="image-upload"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-npc-gold hover:text-npc-darkGold focus-within:outline-none"
                          >
                            <span>Upload an image</span>
                            <input 
                              id="image-upload" 
                              name="image" 
                              type="file" 
                              accept="image/*"
                              className="sr-only"
                              onChange={handleInputChange} 
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, GIF up to 5MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Title</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      className="input input-bordered w-full pr-10 bg-white text-gray-800 border-gray-300 focus:border-npc-gold focus:ring-npc-gold"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Enter slide title"
                      required
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <i className="fas fa-heading text-gray-400"></i>
                    </div>
                  </div>
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Description</span>
                  </label>
                  <div className="relative">
                    <textarea
                      className="textarea textarea-bordered h-20 w-full pr-10 bg-white text-gray-800 border-gray-300 focus:border-npc-gold focus:ring-npc-gold"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Enter slide description (optional)"
                    ></textarea>
                    <div className="absolute top-3 right-0 flex items-start pr-3">
                      <i className="fas fa-align-left text-gray-400"></i>
                    </div>
                  </div>
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Tag (Optional)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      className="input input-bordered w-full pr-10 bg-white text-gray-800 border-gray-300 focus:border-npc-gold focus:ring-npc-gold"
                      name="tag"
                      value={formData.tag}
                      onChange={handleInputChange}
                      placeholder="Enter tag (e.g. New, Sale)"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <i className="fas fa-tag text-gray-400"></i>
                    </div>
                  </div>
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Button Text</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      className="input input-bordered w-full pr-10 bg-white text-gray-800 border-gray-300 focus:border-npc-gold focus:ring-npc-gold"
                      name="buttonText"
                      value={formData.buttonText}
                      onChange={handleInputChange}
                      placeholder="Enter button text"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <i className="fas fa-mouse-pointer text-gray-400"></i>
                    </div>
                  </div>
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Button Link</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      className="input input-bordered w-full pr-10 bg-white text-gray-800 border-gray-300 focus:border-npc-gold focus:ring-npc-gold"
                      name="buttonLink"
                      value={formData.buttonLink}
                      onChange={handleInputChange}
                      placeholder="Enter button link"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <i className="fas fa-link text-gray-400"></i>
                    </div>
                  </div>
                </div>
                
                <div className="form-control">
                  <label className="cursor-pointer label justify-start">
                    <input 
                      type="checkbox" 
                      className="toggle toggle-primary toggle-sm mr-2"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                    />
                    <span className="label-text">Active (Display on website)</span>
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button 
                  type="button" 
                  className="btn btn-outline border-gray-300 text-gray-700"
                  onClick={resetForm}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn bg-npc-gold hover:bg-npc-darkGold text-white border-none"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <span className="loading loading-spinner loading-sm mr-2"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save mr-2"></i>
                      {editingSlide ? 'Update Slide' : 'Save Slide'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      );
    }
    
    return (
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="font-bold text-npc-navy">Carousel Slides {slides.length > 0 && `(${slides.length})`}</h2>
            <p className="text-sm text-gray-600 hidden md:block">
              Drag and drop to change order. Click buttons to activate/deactivate.
            </p>
          </div>
          
          <button 
            className="btn btn-outline border-npc-gold text-npc-navy hover:bg-npc-gold hover:text-white hover:border-npc-gold"
            onClick={fetchSlides}
          >
            <i className="fas fa-sync-alt mr-2"></i>
            <span className="hidden md:inline">Refresh</span>
          </button>
        </div>
        
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center">
              <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full border-gray-300 border-t-npc-gold" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3 text-gray-600">Loading slides...</p>
            </div>
          </div>
        )}
        
        {!loading && slides.length === 0 && (
          <div className="p-8 text-center">
            <i className="fas fa-images text-gray-400 text-4xl mb-4"></i>
            <h3 className="text-lg font-medium text-gray-800 mb-2">No Slides Found</h3>
            <p className="text-gray-500 mb-4">
              Get started by adding your first carousel slide.
            </p>
            <button 
              className="btn bg-npc-gold hover:bg-npc-darkGold text-white border-none"
              onClick={() => {
                setShowForm(true);
                setActiveView('form');
              }}
            >
              <i className="fas fa-plus mr-2"></i> Add Slide
            </button>
          </div>
        )}
        
        {!loading && slides.length > 0 && (
          <div className="block md:hidden">
            {slides.map(slide => (
              <SlideCard
                key={slide.id}
                slide={slide}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleActive={handleToggleActive}
              />
            ))}
          </div>
        )}
        
        {!loading && slides.length > 0 && (
          <div className="hidden md:block">
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={slides.map(slide => slide.id.toString())}
                strategy={verticalListSortingStrategy}
              >
                <div className="divide-y divide-gray-200">
                  {slides.map((slide) => (
                    <SortableItem
                      key={slide.id}
                      id={slide.id.toString()}
                      slide={slide}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onToggleActive={handleToggleActive}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      
      <div className="flex">
        <Sidebar isAdmin={true} />
        
        <div className="flex-1 p-4 sm:p-6 mb-16 md:mb-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h1 className="text-xl md:text-2xl font-bold text-npc-navy">Carousel Management</h1>
            
            <button
              className={`btn ${showForm || activeView === 'form' ? 'btn-outline border-npc-gold text-npc-navy' : 'bg-npc-gold hover:bg-npc-darkGold text-white border-none'}`}
              onClick={() => {
                if (showForm || activeView === 'form') {
                  resetForm();
                } else {
                  setShowForm(true);
                  setActiveView('form');
                }
              }}
            >
              {showForm || activeView === 'form' ? (
                <>
                  <i className="fas fa-times mr-2"></i> Cancel
                </>
              ) : (
                <>
                  <i className="fas fa-plus mr-2"></i> Add New Slide
                </>
              )}
            </button>
          </div>
          
          {!loading && slides.length > 0 && (
            <div className="bg-white rounded-lg shadow p-4 mb-4 md:hidden">
              <div className="flex rounded-md bg-gray-200 p-1">
                <button
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeView === 'slides' 
                      ? 'bg-white text-npc-navy shadow' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                  onClick={() => setActiveView('slides')}
                >
                  <i className="fas fa-images mr-2"></i>
                  Slides
                </button>
                <button
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeView === 'form' 
                      ? 'bg-white text-npc-navy shadow' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                  onClick={() => {
                    setShowForm(true);
                    setActiveView('form');
                  }}
                >
                  <i className="fas fa-plus mr-2"></i>
                  Add New
                </button>
              </div>
            </div>
          )}
          
          {renderActiveContent()}
          
          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-10">
            <div className="container mx-auto px-4 py-2">
              <div className="flex justify-around">
                <button 
                  className={`flex flex-col items-center px-4 py-2 ${activeView === 'slides' ? 'text-npc-gold' : 'text-gray-500'}`}
                  onClick={() => setActiveView('slides')}
                >
                  <i className="fas fa-images text-lg"></i>
                  <span className="text-xs mt-1">Slides</span>
                </button>
                <button 
                  className={`flex flex-col items-center px-4 py-2 ${activeView === 'form' ? 'text-npc-gold' : 'text-gray-500'}`}
                  onClick={() => {
                    setShowForm(true);
                    setActiveView('form');
                  }}
                >
                  <i className="fas fa-plus text-lg"></i>
                  <span className="text-xs mt-1">Add New</span>
                </button>
                <button 
                  className="flex flex-col items-center px-4 py-2 text-gray-500"
                  onClick={fetchSlides}
                >
                  <i className="fas fa-sync-alt text-lg"></i>
                  <span className="text-xs mt-1">Refresh</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarouselManagement;