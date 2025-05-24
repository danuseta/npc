import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const handleResponse = (response, actionName) => {
  console.log(`${actionName} response:`, response);
  return response.data;
};

const authService = {
  register: async (userData) => {
    try {
      const response = await API.post('/auth/register', userData);
      return handleResponse(response, 'Register');
    } catch (error) {
      console.error('Registration API error:', error.response || error);
      if (error.response && error.response.status === 400 && 
          error.response.data && error.response.data.message) {
        throw { 
          message: error.response.data.message,
          response: error.response
        };
      }
      throw error.response?.data?.message || error.message || 'Registration failed';
    }
  },

  login: async (email, password) => {
    try {
      const response = await API.post('/auth/login', { email, password });
      return handleResponse(response, 'Login');
    } catch (error) {
      console.error('Login API error:', error.response || error);
      throw error.response?.data?.message || error.message || 'Login failed';
    }
  },

  getCurrentUser: async () => {
    try {
      const response = await API.get('/auth/me');
      const userData = handleResponse(response, 'GetCurrentUser');
      if (userData && userData.data) {
        return userData.data;
      }
      return userData;
    } catch (error) {
      console.error('GetCurrentUser API error:', error.response || error);
      throw error.response?.data?.message || error.message || 'Failed to get user data';
    }
  },

  updateProfile: async (formData) => {
    try {
      const response = await API.put('/auth/update-profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return handleResponse(response, 'UpdateProfile');
    } catch (error) {
      console.error('UpdateProfile API error:', error.response || error);
      throw error.response?.data?.message || error.message || 'Failed to update profile';
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    try {
      const response = await API.put('/auth/change-password', {
        currentPassword,
        newPassword
      });
      return handleResponse(response, 'ChangePassword');
    } catch (error) {
      console.error('ChangePassword API error:', error.response || error);
      throw error.response?.data?.message || error.message || 'Failed to change password';
    }
  },

  verifyEmail: async (email, code) => {
    try {
      const response = await API.post('/auth/verify-email', { email, code });
      return handleResponse(response, 'VerifyEmail');
    } catch (error) {
      console.error('VerifyEmail API error:', error.response || error);
      throw error.response?.data?.message || error.message || 'Failed to verify email';
    }
  },

  resendVerification: async (email) => {
    try {
      const response = await API.post('/auth/resend-verification', { email });
      return handleResponse(response, 'ResendVerification');
    } catch (error) {
      console.error('ResendVerification API error:', error.response || error);
      throw error.response?.data?.message || error.message || 'Failed to resend verification';
    }
  },

  forgotPassword: async (email) => {
    try {
      const response = await API.post('/auth/forgot-password', { email });
      return handleResponse(response, 'ForgotPassword');
    } catch (error) {
      console.error('ForgotPassword API error:', error.response || error);
      throw error.response?.data?.message || error.message || 'Failed to process forgot password';
    }
  },

  resetPassword: async (token, password) => {
    try {
      const response = await API.post('/auth/reset-password', { token, password });
      return handleResponse(response, 'ResetPassword');
    } catch (error) {
      console.error('ResetPassword API error:', error.response || error);
      throw error.response?.data?.message || error.message || 'Failed to reset password';
    }
  },
  
  deleteAccount: async () => {
    try {
      const response = await API.delete('/auth/delete-account');
      return handleResponse(response, 'DeleteAccount');
    } catch (error) {
      console.error('DeleteAccount API error:', error.response || error);
      throw error.response?.data?.message || error.message || 'Failed to delete account';
    }
  }
};

export default authService;