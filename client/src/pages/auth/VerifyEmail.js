import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import authService from '../../services/authService';
import Swal from 'sweetalert2';
import Logo from '../../assets/logo.png';

const VerifyEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  useEffect(() => { window.Swal = Swal; }, []);
  
  const email = location.state?.email || user?.email;
  
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpInputRefs = [
    React.useRef(null),
    React.useRef(null),
    React.useRef(null),
    React.useRef(null),
    React.useRef(null),
    React.useRef(null)
  ];
  
  useEffect(() => {
    if (!canResend && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCanResend(true);
    }
  }, [countdown, canResend]);
  
  useEffect(() => {
    if (!email) {
      Swal.fire({
        icon: 'error',
        title: 'Email Not Found',
        text: 'Unable to determine which email to verify. Please try registering again.',
      });
      navigate('/register');
    }
  }, [email, navigate]);
  
  const handleOtpChange = (index, value) => {
    if (value && !/^\d*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    setVerificationCode(newOtp.join(''));
    
    if (error) setError('');
    
    if (value !== '' && index < 5) {
      otpInputRefs[index + 1].current.focus();
    }
  };
  
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs[index - 1].current.focus();
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (verificationCode.length !== 6) {
      setError('Please enter the 6-digit verification code');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await authService.verifyEmail(email, verificationCode);
      
      localStorage.removeItem('token');
      localStorage.removeItem('justRegistered');
      
      Swal.fire({
        icon: 'success',
        title: 'Email Verified!',
        text: 'Your email has been successfully verified. You can now log in.',
        timer: 2000,
        showConfirmButton: false
      }).then(() => {
        navigate('/login');
      });
    } catch (err) {
      setError(err.message || 'Invalid or expired verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleResendCode = async () => {
    setIsLoading(true);
    
    try {
      await authService.resendVerification(email);
      
      Swal.fire({
        icon: 'success',
        title: 'Verification Code Sent',
        text: 'A new verification code has been sent to your email.',
        timer: 2000,
        showConfirmButton: false
      });
      
      setCountdown(60);
      setCanResend(false);
      
      setOtp(['', '', '', '', '', '']);
      setVerificationCode('');
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Failed to Resend',
        text: err.message || 'Failed to resend verification code. Please try again later.',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setOtp(digits);
      setVerificationCode(pastedData);
      
      otpInputRefs[5].current.focus();
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
          <h2 className="mt-4 text-2xl sm:text-3xl font-bold text-npc-navy">Verify Your Email</h2>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            Please enter the verification code sent to <span className="font-semibold">{email}</span>
          </p>
        </div>
        
        <form className="space-y-5 sm:space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Verification Code
            </label>
            <div className="flex gap-2 justify-between" onPaste={handlePaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={otpInputRefs[index]}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="input input-bordered w-10 sm:w-12 h-10 sm:h-12 text-center text-lg sm:text-xl font-bold bg-white text-gray-800 border-gray-300 focus:border-npc-gold focus:ring-npc-gold"
                  autoFocus={index === 0}
                />
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              The verification code was sent to your email. Please check your inbox and spam folder.
            </p>
          </div>
          
          <button
            type="submit"
            className={`btn bg-npc-gold hover:bg-npc-darkGold text-white border-none w-full ${isLoading ? 'loading' : ''}`}
            disabled={isLoading || verificationCode.length !== 6}
          >
            {isLoading ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>
        
        <div className="mt-5 sm:mt-6 text-center">
          <p className="text-sm text-gray-600">
            Didn't receive the code?
          </p>
          <button
            onClick={handleResendCode}
            disabled={!canResend || isLoading}
            className={`mt-2 text-sm ${canResend ? 'text-npc-gold hover:text-npc-darkGold font-medium' : 'text-gray-400'}`}
          >
            {canResend ? 'Resend Code' : `Resend code in ${countdown} seconds`}
          </button>
        </div>
        
        <div className="mt-6 sm:mt-8 text-center">
          <Link to="/login" className="text-sm text-gray-600 hover:text-npc-gold">
            <i className="fas fa-arrow-left mr-2"></i>
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;