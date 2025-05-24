import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    } else {
      config.headers['Content-Type'] = 'application/json';
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
    const token = localStorage.getItem('token');
    if (token && error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const productAPI = {
  getAllProducts: (params) => api.get('/products', { params }),
  getProductById: (id) => api.get(`/products/${id}`),
  getProductsByCategory: (categoryId, params) => api.get(`/products/category/${categoryId}`, { params }),
  getFeaturedProducts: (params) => api.get('/products/featured', { params }),
  searchProducts: (query, params) => api.get('/products/search', { params: { query, ...params } }),
  getPopularProducts: (params) => api.get('/products/popular', { params }),
  createProduct: (productData) => {
    console.log('Sending product data to server:', productData);
    if (productData instanceof FormData) {
      console.log('FormData contents:');
      for (let [key, value] of productData.entries()) {
        console.log(`${key}: ${value instanceof File ? value.name : value}`);
      }
    }
    return api.post('/products', productData);
  },
  updateProduct: (id, productData) => {
    console.log('Updating product data on server:', id, productData);
    if (productData instanceof FormData) {
      console.log('FormData contents:');
      for (let [key, value] of productData.entries()) {
        console.log(`${key}: ${value instanceof File ? value.name : value}`);
      }
    }
    return api.put(`/products/${id}`, productData);
  },
  deleteProduct: (id) => api.delete(`/products/${id}`),
  getProductStats: () => api.get('/products/stats'),
  getTopProducts: (limit = 5) => api.get(`/products/top?limit=${limit}`)
};

export const categoryAPI = {
  getAllCategories: (params) => api.get('/categories', { params }),
  getCategoryById: (id) => api.get(`/categories/${id}`),
  getCategoryBySlug: (slug) => api.get(`/categories/slug/${slug}`),
  getSubcategories: (parentId) => api.get(`/categories/parent/${parentId}`),
  createCategory: (data) => api.post('/categories', data),
  updateCategory: (id, data) => api.put(`/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/categories/${id}`)
};

export const cartAPI = {
  getCart: () => api.get('/cart'),
  addItemToCart: (data) => api.post('/cart/items', data),
  updateCartItem: (itemId, data) => api.put(`/cart/items/${itemId}`, data),
  removeCartItem: (itemId) => api.delete(`/cart/items/${itemId}`),
  clearCart: (productIds = null) => {
    if (productIds && (Array.isArray(productIds) ? productIds.length > 0 : productIds)) {
      return api.delete('/cart', { 
        data: { productIds } 
      });
    } else {
      return api.delete('/cart');
    }
  }
};

export const orderAPI = {
  createOrder: (data) => api.post('/orders', data),
  getMyOrders: (params) => api.get('/orders/my-orders', { params }),
  getMyOrderById: (id) => api.get(`/orders/my-orders/${id}`),
  cancelOrder: (id) => api.post(`/orders/${id}/cancel`),
  getOrderByNumber: (orderNumber) => api.get(`/orders/by-number/${orderNumber}`),
  updateOrderAfterPayment: (id, data) => api.put(`/orders/${id}/update-status`, data),
  getAllOrders: (params) => api.get('/orders', { params }),
  getOrderById: (id) => api.get(`/orders/${id}`),
  updateAdminOrderStatus: (id, data) => api.put(`/orders/${id}/status`, data),
  getOrderHistory: (params) => api.get('/orders/history', { params }),
  updateOrderStatus: (id, data) => api.put(`/orders/${id}/update-status`, data),
  updatePaymentStatus: (id, data) => api.put(`/orders/${id}/payment-status`, data),
  updateTrackingInfo: (id, data) => api.put(`/orders/${id}/tracking`, data),
  getRecentOrders: (limit = 5) => api.get(`/orders/recent?limit=${limit}`),
  getOrderStats: () => api.get('/orders/stats'),
  getSalesData: (period = 'weekly') => api.get(`/orders/sales?period=${period}`)
};

export const carouselAPI = {
  getAllSlides: () => api.get('/carousel'),
  getSlideById: (id) => api.get(`/carousel/${id}`),
  createSlide: (data) => api.post('/carousel', data),
  updateSlide: (id, data) => api.put(`/carousel/${id}`, data),
  deleteSlide: (id) => api.delete(`/carousel/${id}`),
  toggleActive: (id) => api.patch(`/carousel/${id}/toggle-active`),
  updateOrder: (data) => api.post('/carousel/order', data),
  getAllSlidesAdmin: () => api.get('/carousel?includeInactive=true')
};

export const paymentAPI = {
  createPayment: (data) => api.post('/payments', data),
  getPaymentByOrderId: (orderId) => api.get(`/payments/order/${orderId}`),
  createMidtransPayment: (data) => api.post('/payments/midtrans', data),
  getOrderByNumber: (orderNumber) => api.get(`/orders/by-number/${orderNumber}`),
  getSnapToken: (orderData) => api.post('/payments/midtrans/token', orderData)
};

export const reviewAPI = {
  getProductReviews: (productId, params) => api.get(`/reviews/product/${productId}`, { params }),
  createReview: (data) => api.post('/reviews', data),
  getUserProductReview: (productId, orderId) => api.get(`/reviews/my-product-reviews/${productId}`, { 
    params: { orderId } 
  }),
  markReviewHelpful: (id) => api.post(`/reviews/${id}/helpful`),
  getUserProductReviews: (productIds) => api.get('/reviews/my-reviews', { params: { productIds: productIds.join(',') } }),
};

export const userAPI = {
  getAllUsers: (params) => api.get('/users', { params }),
  getUserById: (id) => api.get(`/users/${id}`),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  updateUserStatus: (id, data) => api.put(`/users/${id}/status`, data),
  updateUserRole: (id, data) => api.put(`/users/${id}/role`, data),
  deleteUser: (id) => api.delete(`/users/${id}`),
  getUserStats: () => api.get('/users/stats'),
  getUserAddress: () => api.get('/users/address'),
  updateUserAddress: (data) => api.put('/users/address', data),
};

export const dashboardAPI = {
  getSummary: () => api.get('/dashboard/summary'),
  getSalesData: (period) => api.get(`/dashboard/sales?period=${period}`)
};

export const regionAPI = {
  getProvinces: () => api.get('/provinsi'),
  getCitiesByProvince: (provinceId) => api.get(`/kota/${provinceId}`)
};

export const shippingAPI = {
  getRates: (data) => api.post('/shipping/rates', data)
};

export const superAdminAPI = {
    getDashboardSummary: () => api.get('/superadmin/dashboard/summary'),
    getSalesData: (period = 'weekly') => api.get(`/superadmin/dashboard/sales?period=${period}`),
    getAllAdmins: (params) => api.get('/superadmin/admins', { params }),
    getAdminById: (id) => api.get(`/superadmin/admins/${id}`),
    createAdmin: (data) => api.post('/superadmin/admins', data),
    updateAdmin: (id, data) => api.put(`/superadmin/admins/${id}`, data),
    updateAdminStatus: (id, data) => api.put(`/superadmin/admins/${id}/status`, data),
    deleteAdmin: (id) => api.delete(`/superadmin/admins/${id}`),
    getAdminActivities: (id) => api.get(`/superadmin/admins/${id}/activities`),
    getTopAdmins: () => api.get('/superadmin/dashboard/top-admins'),
    getSystemSettings: () => api.get('/superadmin/settings'),
    updateSystemSettings: (data) => api.put('/superadmin/settings', data),
    getSystemLogs: (params) => api.get('/superadmin/logs', { params }),
    clearSystemLogs: () => api.delete('/superadmin/logs'),
    createSystemBackup: () => api.post('/superadmin/backup'),
    restoreSystemBackup: (data) => api.post('/superadmin/restore', data),
    clearSystemCache: () => api.post('/superadmin/cache/clear')
};

export default api;