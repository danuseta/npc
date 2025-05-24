import React, { createContext, useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import authService from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkUserLoggedIn = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (token) {
          const response = await authService.getCurrentUser();
          const userData = response.data || response;
          setUser(userData);
        }
      } catch (err) {
        console.error('Authentication error:', err);
        localStorage.removeItem('token');
        setError('Session expired. Please login again.');
      } finally {
        setLoading(false);
      }
    };

    checkUserLoggedIn();
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await authService.login(email, password);
      
      console.log('Login response:', response);
      
      if (response.token) {
        localStorage.setItem('token', response.token);
      } else if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);
      } else {
        throw new Error('No authentication token received from server');
      }
      
      const currentUserResponse = await authService.getCurrentUser();
      const userData = currentUserResponse.data || currentUserResponse;
      
      console.log('Current user data after login:', userData);
      setUser(userData);
      
      Swal.fire({
        icon: 'success',
        title: 'Login Successful!',
        text: `Welcome back, ${userData.name || 'User'}!`,
        timer: 2000,
        showConfirmButton: false
      });
      
      return userData;
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please check your credentials.');
      Swal.fire({
        icon: 'error',
        title: 'Login Failed',
        text: err.message || 'Incorrect email or password. Please try again.',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await authService.register(userData);
      
      console.log('Register response:', response);
      
      let registeredUser;
      if (response.user) {
        registeredUser = response.user;
      } else if (response.data && response.data.user) {
        registeredUser = response.data.user;
      } else if (response.data) {
        registeredUser = response.data;
      } else {
        registeredUser = { 
          email: userData.email,
          phone: userData.phone,
          name: userData.name 
        };
      }
      
      if (!registeredUser.phone && userData.phone) {
        registeredUser.phone = userData.phone;
      }
      
      Swal.fire({
        icon: 'success',
        title: 'Registration Successful!',
        text: 'Your account has been successfully created.',
        timer: 2000,
        showConfirmButton: false
      });
      
      return registeredUser;
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please try again.');
      
      if (err.response && err.response.status === 400 && 
          err.response.data && err.response.data.message && 
          err.response.data.message.includes('verification')) {
        return { email: userData.email };
      }
      
      Swal.fire({
        icon: 'error',
        title: 'Registration Failed',
        text: err.message || 'An error occurred during registration. Please try again.',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    
    Swal.fire({
      icon: 'success',
      title: 'Logout Successful',
      text: 'You have successfully logged out of your account.',
      timer: 2000,
      showConfirmButton: false
    });
  };

  const updateProfile = async (formData) => {
    try {
      setLoading(true);
      const response = await authService.updateProfile(formData);
      const updatedUser = response.data || response;
      setUser(updatedUser);
      
      Swal.fire({
        icon: 'success',
        title: 'Profile Updated',
        text: 'Your profile information has been successfully updated.',
        timer: 2000,
        showConfirmButton: false
      });
      
      return updatedUser;
    } catch (err) {
      setError(err.message || 'Failed to update profile. Please try again.');
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: err.message || 'An error occurred while updating your profile. Please try again.',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      setLoading(true);
      await authService.changePassword(currentPassword, newPassword);
      
      Swal.fire({
        icon: 'success',
        title: 'Password Updated',
        text: 'Your password has been successfully changed.',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      setError(err.message || 'Failed to change password. Please try again.');
      Swal.fire({
        icon: 'error',
        title: 'Password Update Failed',
        text: err.message || 'An error occurred while changing your password. Please try again.',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  const deleteAccount = async () => {
    try {
      setLoading(true);
      await authService.deleteAccount();
      
      localStorage.removeItem('token');
      setUser(null);
      
      Swal.fire({
        icon: 'success',
        title: 'Account Deleted',
        text: 'Your account has been successfully deleted.',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      setError(err.message || 'Failed to delete account. Please try again.');
      Swal.fire({
        icon: 'error',
        title: 'Account Deletion Failed',
        text: err.message || 'An error occurred while deleting your account. Please try again.',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const contextValue = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    deleteAccount,
    clearError
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;