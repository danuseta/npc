import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Swal from 'sweetalert2';
import Logo from '../../assets/logo.png';

const Register = () => {
  const navigate = useNavigate();
  const { user, register, loading: authLoading } = useAuth();
  
  useEffect(() => {
    window.Swal = Swal;
  }, []);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    termsAccepted: false
  });
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  useEffect(() => {
    if (user) {
      const isJustRegistered = localStorage.getItem('justRegistered');
      if (isJustRegistered) {
        return;
      }
      navigate('/');
    }
  }, [user, navigate]);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };
  
  const validateStep1 = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Name must be at least 3 characters';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
        } else if (!/^0[0-9]{9,12}$/.test(formData.phone)) {      newErrors.phone = 'Phone number is invalid (e.g., 08123456789)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const validateStep2 = () => {
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
    
    if (!formData.termsAccepted) {
      newErrors.termsAccepted = 'You must accept the terms and conditions';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleNextStep = () => {
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };
  
  const handlePrevStep = () => {
    setCurrentStep(1);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep2()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      localStorage.setItem('justRegistered', 'true');
      
      const response = await register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password
      });
      
      Swal.fire({
        title: 'Registration Successful!',
        text: 'Please check your email for a verification code.',
        icon: 'success',
        confirmButtonColor: '#F0A84E'
      }).then(() => {
        navigate('/verify-email', { state: { email: formData.email } });
      });
    } catch (error) {
      console.error("Registration error:", error);
      
      if (error.message && error.message.includes("verification")) {
        Swal.fire({
          title: 'Account Created',
          text: 'Please verify your email with the code sent to your inbox.',
          icon: 'info',
          confirmButtonColor: '#F0A84E'
        }).then(() => {
          navigate('/verify-email', { state: { email: formData.email } });
        });
        return;
      }
      
      localStorage.removeItem('justRegistered');
      
      setErrors({
        form: error.message || 'Registration failed. Please try again.'
      });
      
      Swal.fire({
        icon: 'error',
        title: 'Registration Failed',
        text: error.message || 'There was an error during registration. Please try again.',
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
  
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="loading loading-spinner loading-lg text-npc-gold"></div>
      </div>
    );
  }
  
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
          <h2 className="mt-4 text-2xl sm:text-3xl font-bold text-npc-navy">Create your account</h2>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            Or{' '}
            <Link to="/login" className="text-npc-gold hover:text-npc-darkGold">
              sign in to an existing account
            </Link>
          </p>
        </div>
        
        <form className="space-y-5 sm:space-y-6" onSubmit={handleSubmit}>
          {errors.form && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {errors.form}
            </div>
          )}
          
          <div className="w-full">
            <ul className="steps w-full">
              <li className={`step ${currentStep >= 1 ? 'step-primary' : ''}`}>
                <span className="text-gray-600">Personal Info</span>
              </li>
              <li className={`step ${currentStep >= 2 ? 'step-primary' : ''}`}>
                <span className="text-gray-600">Security</span>
              </li>
            </ul>
          </div>
          
          {currentStep === 1 && (
            <>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  className={`input input-bordered w-full bg-white text-gray-800 border-gray-300 focus:border-npc-gold focus:ring-npc-gold ${errors.name ? 'input-error' : ''}`}
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className={`input input-bordered w-full bg-white text-gray-800 border-gray-300 focus:border-npc-gold focus:ring-npc-gold ${errors.email ? 'input-error' : ''}`}
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={handleChange}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  className={`input input-bordered w-full bg-white text-gray-800 border-gray-300 focus:border-npc-gold focus:ring-npc-gold ${errors.phone ? 'input-error' : ''}`}
                  placeholder="08123456789"
                  value={formData.phone}
                  onChange={handleChange}
                />
                {errors.phone && (
                  <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                )}
              </div>
              
              <button
                type="button"
                className="btn bg-npc-gold hover:bg-npc-darkGold text-white border-none w-full"
                onClick={handleNextStep}
              >
                Next Step
              </button>
            </>
          )}
          
          {currentStep === 2 && (
            <>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
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
              
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="termsAccepted"
                    name="termsAccepted"
                    type="checkbox"
                    className={`checkbox checkbox-primary ${errors.termsAccepted ? 'checkbox-error' : ''}`}
                    checked={formData.termsAccepted}
                    onChange={handleChange}
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="termsAccepted" className="text-gray-700">
                    I agree to the{' '}
                    <a href="#" className="text-npc-gold hover:text-npc-darkGold">
                      Terms and Conditions
                    </a>{' '}
                    and{' '}
                    <a href="#" className="text-npc-gold hover:text-npc-darkGold">
                      Privacy Policy
                    </a>
                  </label>
                  {errors.termsAccepted && (
                    <p className="text-red-500 text-xs mt-1">{errors.termsAccepted}</p>
                  )}
                </div>
              </div>
              
              <div className="flex gap-4">
                <button
                  type="button"
                  className="btn btn-outline flex-1 border-npc-navy text-npc-navy hover:bg-npc-navy hover:text-white"
                  onClick={handlePrevStep}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className={`btn bg-npc-gold hover:bg-npc-darkGold text-white border-none flex-1 ${isLoading ? 'loading' : ''}`}
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </button>
              </div>
            </>
          )}
        </form>
        
        <div className="mt-6 sm:mt-8 text-center">
          <Link to="/" className="text-sm text-gray-600 hover:text-npc-gold">
            <i className="fas fa-arrow-left mr-2"></i>
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;