import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import Swal from 'sweetalert2';
import Logo from '../../assets/logo.png';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  
  useEffect(() => {
    window.Swal = Swal;
  }, []);
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  useEffect(() => {
    if (!token) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Reset Link',
        text: 'The password reset link is invalid or has expired.',
        confirmButtonColor: '#F0A84E'
      }).then(() => {
        navigate('/forgot-password');
      });
    }
  }, [token, navigate]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/.test(formData.password)) {
      newErrors.password = 'Password must contain lowercase, uppercase and numbers';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      await authService.resetPassword(token, formData.password);
      
      Swal.fire({
        icon: 'success',
        title: 'Password Reset Successful',
        text: 'Your password has been reset. You can now log in with your new password.',
        confirmButtonColor: '#F0A84E'
      }).then(() => {
        navigate('/login');
      });
    } catch (err) {
      setErrors({
        form: err.message || 'Failed to reset password. The link may be invalid or expired.'
      });
      
      Swal.fire({
        icon: 'error',
        title: 'Reset Failed',
        text: err.message || 'Failed to reset password. The link may be invalid or expired.',
        confirmButtonColor: '#F0A84E'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };
  
  const getPasswordStrength = (password) => {
    if (!password) return { label: 'None', color: 'bg-gray-200', width: '0%' };
    
    let strength = 0;
    let label = '';
    
    if (password.length >= 8) strength += 1;
    
    if (/[a-z]/.test(password)) strength += 1;
    
    if (/[A-Z]/.test(password)) strength += 1;
    
    if (/[0-9]/.test(password)) strength += 1;
    
    if (/[^a-zA-Z0-9]/.test(password)) strength += 1;
    
    switch (strength) {
      case 0:
      case 1:
        label = 'Weak';
        return { label, color: 'bg-red-500', width: '20%' };
      case 2:
      case 3:
        label = 'Medium';
        return { label, color: 'bg-yellow-500', width: '60%' };
      case 4:
      case 5:
        label = 'Strong';
        return { label, color: 'bg-green-500', width: '100%' };
      default:
        return { label: 'None', color: 'bg-gray-200', width: '0%' };
    }
  };
  
  const passwordStrength = getPasswordStrength(formData.password);
  
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-6 px-4 sm:py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6 sm:p-8">
        <div className="text-center mb-6 sm:mb-8">
          <Link to="/" className="inline-block">
            <img 
              src={Logo}
              alt="NPC Nusantara" 
              className="h-10 sm:h-12 mx-auto"
            />
          </Link>
          <h2 className="mt-4 text-2xl sm:text-3xl font-bold text-npc-navy">Reset Password</h2>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            Enter your new password below
          </p>
        </div>
        
        <form className="space-y-5 sm:space-y-6" onSubmit={handleSubmit}>
          {errors.form && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {errors.form}
            </div>
          )}
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                className={`input input-bordered w-full bg-white text-gray-800 border-gray-300 focus:border-npc-gold focus:ring-npc-gold ${errors.password ? 'input-error' : ''}`}
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                onClick={togglePasswordVisibility}
              >
                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
            
            {formData.password && (
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`${passwordStrength.color} h-2 rounded-full`} 
                    style={{ width: passwordStrength.width }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-gray-500">Strength:</span>
                  <span className={`
                    ${passwordStrength.label === 'Weak' ? 'text-red-500' : ''}
                    ${passwordStrength.label === 'Medium' ? 'text-yellow-500' : ''}
                    ${passwordStrength.label === 'Strong' ? 'text-green-500' : ''}
                  `}>
                    {passwordStrength.label}
                  </span>
                </div>
              </div>
            )}
            
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password}</p>
            )}
            <div className="mt-1 text-xs text-gray-500">
              Password must be at least 8 characters with lowercase, uppercase and numbers.
            </div>
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                className={`input input-bordered w-full bg-white text-gray-800 border-gray-300 focus:border-npc-gold focus:ring-npc-gold ${errors.confirmPassword ? 'input-error' : ''}`}
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                onClick={toggleConfirmPasswordVisibility}
              >
                <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
            )}
          </div>
          
          <button
            type="submit"
            className={`btn bg-npc-gold hover:bg-npc-darkGold text-white border-none w-full ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? 'Resetting...' : 'Reset Password'}
          </button>
          
          <div className="text-center">
            <Link to="/login" className="text-sm text-gray-600 hover:text-npc-gold">
              <i className="fas fa-arrow-left mr-2"></i>
              Back to login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;