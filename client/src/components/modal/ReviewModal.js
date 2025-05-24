import React, { useState } from 'react';
import { reviewAPI } from '../../services/api';

const ReviewModal = ({ item, orderId, isOpen, onClose, onSubmitSuccess }) => {
  const [formData, setFormData] = useState({
    rating: 5,
    title: '',
    comment: '',
    isRecommended: true
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleRatingChange = (rating) => {
    setFormData(prev => ({
      ...prev,
      rating
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Please provide a title for your review';
    }

    if (!formData.comment.trim()) {
      newErrors.comment = 'Please write your review';
    } else if (formData.comment.trim().length < 5) {
      newErrors.comment = 'Your review must be at least 5 characters';
    }

    if (!orderId) {
      newErrors.submit = 'Order information is missing. Please refresh the page and try again.';
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
      const reviewData = {
        productId: item.productId,
        orderId: orderId,
        rating: formData.rating,
        title: formData.title || `Review for ${item.name}`,
        comment: formData.comment,
        isRecommended: formData.isRecommended
      };

      console.log('Submitting review:', reviewData);

      const response = await reviewAPI.createReview(reviewData);

      console.log('Review submission response:', response);

      if (response.data && response.data.success) {
        if (onSubmitSuccess) {
          onSubmitSuccess(response.data.data);
        }

        onClose();
      } else {
        throw new Error(response.data?.message || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      
      let errorMessage = 'There was an error submitting your review. Please try again later.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
        
        if (errorMessage.includes('already reviewed')) {
          errorMessage = 'You have already submitted a review for this product in this order.';
        }
        else if (errorMessage.includes('not in the specified order')) {
          errorMessage = 'This product is not part of the selected order.';
        }
      }
      
      setErrors({
        submit: errorMessage
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-t-lg sm:rounded-lg shadow-xl w-full sm:max-w-lg md:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="bg-npc-navy text-white p-3 sm:p-4 rounded-t-lg">
          <div className="flex justify-between items-start sm:items-center">
            <div className="flex-1 pr-2">
              <h3 className="text-base sm:text-lg font-medium leading-tight">Review {item.name}</h3>
              <div className="text-xs sm:text-sm opacity-80 mt-1 sm:mt-0 sm:inline">Order #{orderId}</div>
            </div>
            <button 
              onClick={onClose}
              className="text-white hover:text-gray-300 transition-colors p-1 flex-shrink-0"
            >
              <i className="fas fa-times text-lg"></i>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-3 sm:p-4 md:p-6">
          <div className="mb-4 sm:mb-6 text-center">
            <img 
              src={item.image || '/images/placeholder.png'} 
              alt={item.name} 
              className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 object-contain mx-auto mb-2 sm:mb-3 border rounded-lg p-1"
              onError={(e) => {
                e.target.src = '/images/placeholder.png';
              }}
            />
            <h3 className="font-medium text-sm sm:text-base md:text-lg text-gray-800 px-2">{item.name}</h3>
          </div>

          <div className="form-control mb-4 sm:mb-5">
            <label className="label pb-2">
              <span className="label-text text-gray-700 text-sm sm:text-base">How would you rate this product?</span>
            </label>
            <div className="flex justify-center mb-3 sm:mb-4">
              {[1, 2, 3, 4, 5].map((value) => (
                <i 
                  key={value}
                  className={`${formData.rating >= value ? 'fas' : 'far'} fa-star text-yellow-400 cursor-pointer text-lg sm:text-xl mx-1 sm:mx-1.5 transition-colors`}
                  onClick={() => handleRatingChange(value)}
                ></i>
              ))}
            </div>
          </div>

          <div className="form-control mb-3 sm:mb-4">
            <label className="label pb-1 sm:pb-2">
              <span className="label-text text-gray-700 text-sm sm:text-base">Review Title</span>
            </label>
            <input 
              type="text" 
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Summarize your experience" 
              className={`input input-bordered w-full bg-white text-gray-800 border-gray-300 focus:border-npc-gold focus:ring-npc-gold text-sm sm:text-base ${errors.title ? 'input-error' : ''}`}
            />
            {errors.title && (
              <label className="label pt-1">
                <span className="label-text-alt text-error text-xs">{errors.title}</span>
              </label>
            )}
          </div>

          <div className="form-control mb-3 sm:mb-4">
            <label className="label pb-1 sm:pb-2">
              <span className="label-text text-gray-700 text-sm sm:text-base">Your Review</span>
            </label>
            <textarea 
              name="comment"
              value={formData.comment}
              onChange={handleChange}
              className={`textarea textarea-bordered w-full bg-white text-gray-800 border-gray-300 focus:border-npc-gold focus:ring-npc-gold text-sm sm:text-base ${errors.comment ? 'textarea-error' : ''}`}
              placeholder="Tell others what you liked or disliked about this product..." 
              rows="3"
            ></textarea>
            {errors.comment && (
              <label className="label pt-1">
                <span className="label-text-alt text-error text-xs">{errors.comment}</span>
              </label>
            )}
          </div>

          <div className="form-control mb-3 sm:mb-4">
            <label className="cursor-pointer label justify-start py-2">
              <input 
                type="checkbox" 
                name="isRecommended"
                checked={formData.isRecommended}
                onChange={handleChange}
                className="checkbox checkbox-primary mr-2 checkbox-sm sm:checkbox-md" 
              />
              <span className="label-text text-gray-700 text-sm sm:text-base">I recommend this product to others</span>
            </label>
          </div>

          {errors.submit && (
            <div className="alert alert-error mb-3 sm:mb-4 py-2 sm:py-3">
              <i className="fas fa-exclamation-circle mr-2 text-sm"></i>
              <span className="text-sm">{errors.submit}</span>
            </div>
          )}

          <div className="bg-blue-50 p-2 sm:p-3 rounded-md mb-4 sm:mb-6">
            <p className="text-xs text-blue-700">
              <i className="fas fa-info-circle mr-1"></i> Your honest feedback helps other customers make better purchasing decisions. You can leave a separate review for each order of this product.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="btn btn-outline w-full sm:w-auto order-2 sm:order-1 text-sm sm:text-base text-black hover:text-white"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="btn bg-npc-gold hover:bg-npc-darkGold text-white border-none w-full sm:w-auto order-1 sm:order-2 text-sm sm:text-base"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="loading loading-spinner loading-xs mr-2"></span>
                  <span className="hidden sm:inline">Submitting...</span>
                  <span className="sm:hidden">Submit...</span>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">Submit Review</span>
                  <span className="sm:hidden">Submit</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;