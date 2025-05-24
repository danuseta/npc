import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import authService from '../../services/authService';
import Swal from 'sweetalert2';
import Logo from '../../assets/logo.png';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  useEffect(() => {
    window.Swal = Swal;
  }, []);
  
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (error) setError('');
  };
  
  const validateEmail = () => {
    if (!email.trim()) {
      setError('Email is required');
      return false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Email is invalid');
      return false;
    }
    return true;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateEmail()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      await authService.forgotPassword(email);
      
      setIsSubmitted(true);
      
      Swal.fire({
        icon: 'success',
        title: 'Reset Link Sent',
        text: 'We have sent a password reset link to your email.',
        confirmButtonColor: '#F0A84E'
      });
    } catch (err) {
      setError(err.message || 'Failed to send reset link. Please try again.');
      
      Swal.fire({
        icon: 'error',
        title: 'Request Failed',
        text: err.message || 'Failed to send reset link. Please try again later.',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
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
          <h2 className="mt-4 text-2xl sm:text-3xl font-bold text-npc-navy">Forgot Password</h2>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            Enter your email and we'll send you a link to reset your password
          </p>
        </div>
        
        {isSubmitted ? (
          <div className="space-y-5 sm:space-y-6">
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded">
              <p>Please check your email for a link to reset your password.</p>
              <p className="mt-2">If you don't receive an email within a few minutes, check your spam folder or try again.</p>
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={() => setIsSubmitted(false)}
                className="btn btn-outline border-npc-navy text-npc-navy hover:bg-npc-navy hover:text-white flex-1"
              >
                Try Again
              </button>
              
              <Link to="/login" className="btn bg-npc-gold hover:bg-npc-darkGold text-white border-none flex-1">
                Return to Login
              </Link>
            </div>
          </div>
        ) : (
          <form className="space-y-5 sm:space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                {error}
              </div>
            )}
            
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
                className={`input input-bordered w-full bg-white text-gray-800 border-gray-300 focus:border-npc-gold focus:ring-npc-gold ${error ? 'input-error' : ''}`}
                placeholder="your@email.com"
                value={email}
                onChange={handleEmailChange}
              />
            </div>
            
            <button
              type="submit"
              className={`btn bg-npc-gold hover:bg-npc-darkGold text-white border-none w-full ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </button>
            
            <div className="text-center">
              <Link to="/login" className="text-sm text-gray-600 hover:text-npc-gold">
                <i className="fas fa-arrow-left mr-2"></i>
                Back to login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;