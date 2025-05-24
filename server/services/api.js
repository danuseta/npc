const axios = require('axios');
const { JWT } = require('../utils/constants');
require('dotenv').config();

const api = axios.create({
  baseURL: process.env.API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

exports.authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (userData) => api.post('/auth/login', userData),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
  verifyEmail: (data) => api.post('/auth/verify-email', data),
  resendVerification: (email) => api.post('/auth/resend-verification', { email }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  updateProfile: (data) => api.put('/auth/update-profile', data)
};

exports.userAPI = {
  getAllUsers: (params) => api.get('/users', { params }),
  getUserById: (id) => api.get(`/users/${id}`),
  updateProfile: (data) => api.put('/users/profile', data),
  updateAddress: (data) => api.put('/users/address', data),
  updateUserStatus: (id, isActive) => api.put(`/users/${id}/status`, { isActive }),
  updateUserRole: (id, role) => api.put(`/users/${id}/role`, { role }),
  deleteUser: (id) => api.delete(`/users/${id}`)
};

exports.productAPI = {
  getAllProducts: (params) => api.get('/products', { params }),
  getProductById: (id) => api.get(`/products/${id}`),
  getProductsByCategory: (categoryId, params) => api.get(`/products/category/${categoryId}`, { params }),
  getFeaturedProducts: (params) => api.get('/products/featured', { params }),
  searchProducts: (params) => api.get('/products/search', { params }),
  createProduct: (data) => api.post('/products', data),
  updateProduct: (id, data) => api.put(`/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/products/${id}`)
};

exports.categoryAPI = {
  getAllCategories: (params) => api.get('/categories', { params }),
  getCategoryById: (id) => api.get(`/categories/${id}`),
  getCategoryBySlug: (slug) => api.get(`/categories/slug/${slug}`),
  getSubcategories: (parentId) => api.get(`/categories/parent/${parentId}`),
  createCategory: (data) => api.post('/categories', data),
  updateCategory: (id, data) => api.put(`/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/categories/${id}`)
};

exports.cartAPI = {
  getCart: () => api.get('/cart'),
  addItemToCart: (data) => api.post('/cart/items', data),
  updateCartItem: (itemId, data) => api.put(`/cart/items/${itemId}`, data),
  removeCartItem: (itemId) => api.delete(`/cart/items/${itemId}`),
  clearCart: () => api.delete('/cart')
};

exports.orderAPI = {
  createOrder: (data) => api.post('/orders', data),
  getMyOrders: (params) => api.get('/orders/my-orders', { params }),
  getMyOrderById: (id) => api.get(`/orders/my-orders/${id}`),
  cancelOrder: (id) => api.post(`/orders/${id}/cancel`),
  getAllOrders: (params) => api.get('/orders', { params }),
  getOrderById: (id) => api.get(`/orders/${id}`),
  updateOrderStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
  updatePaymentStatus: (id, paymentStatus) => api.put(`/orders/${id}/payment-status`, { paymentStatus }),
  updateTrackingInfo: (id, data) => api.put(`/orders/${id}/tracking`, data)
};

exports.paymentAPI = {
  createPayment: (data) => api.post('/payments', data),
  getPaymentByOrderId: (orderId) => api.get(`/payments/order/${orderId}`),
  getAllPayments: (params) => api.get('/payments', { params }),
  updatePaymentStatus: (id, data) => api.put(`/payments/${id}/status`, data),
  processRefund: (id, data) => api.post(`/payments/${id}/refund`, data)
};

exports.reviewAPI = {
  getProductReviews: (productId, params) => api.get(`/reviews/product/${productId}`, { params }),
  createReview: (data) => api.post('/reviews', data),
  updateReview: (id, data) => api.put(`/reviews/${id}`, data),
  deleteReview: (id) => api.delete(`/reviews/${id}`),
  markReviewHelpful: (id) => api.post(`/reviews/${id}/helpful`),
  reportReview: (id, reason) => api.post(`/reviews/${id}/report`, { reason }),
  getAllReviews: (params) => api.get('/reviews', { params }),
  updateReviewStatus: (id, isActive) => api.put(`/reviews/${id}/status`, { isActive }),
  respondToReview: (id, response) => api.post(`/reviews/${id}/respond`, { response })
};