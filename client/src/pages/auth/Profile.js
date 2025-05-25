import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { userAPI, regionAPI } from '../../services/api';
import authService from '../../services/authService';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

const Profile = () => {
  const { user, updateProfile, changePassword, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    profileImage: null
  });

  const [src, setSrc] = useState(null);
  const [crop, setCrop] = useState({ unit: '%', aspect: 1 });
  const [completedCrop, setCompletedCrop] = useState(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const imgRef = useRef(null);
  const previewCanvasRef = useRef(null);

  const refreshUserData = async () => {
    try {
      const freshUserData = await authService.getCurrentUser();
      
      if (freshUserData) {
        setProfileForm(prev => ({
          ...prev,
          name: freshUserData.name || prev.name,
          email: freshUserData.email || prev.email,
          phone: freshUserData.phone || prev.phone,
          dateOfBirth: freshUserData.dateOfBirth ? new Date(freshUserData.dateOfBirth).toISOString().split('T')[0] : prev.dateOfBirth,
          gender: freshUserData.gender || prev.gender
        }));
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  useEffect(() => {
    refreshUserData();
  }, []);
  
  useEffect(() => {
    window.Swal = Swal;
  }, []);
  
  const [addressForm, setAddressForm] = useState({
    address: '',
    city: '', 
    cityName: '', 
    province: '', 
    provinceName: '', 
    zipCode: '',
    country: 'Indonesia'
  });
  
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  
  const [hasProvince, setHasProvince] = useState(false);
  const [hasCity, setHasCity] = useState(false);
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  const fileInputRef = useRef(null);
  
  const [imagePreview, setImagePreview] = useState(null);
  const [imagePreviewCropped, setImagePreviewCropped] = useState(null);
  
  useEffect(() => {
    const fetchProvinces = async () => {
      setLoadingProvinces(true);
      try {
        const response = await regionAPI.getProvinces();
        setProvinces(response.data.data); 
      } catch (error) {
        console.error('Error fetching provinces:', error);
      } finally {
        setLoadingProvinces(false);
      }
    };
    
    fetchProvinces();
  }, []);
  
  useEffect(() => {
    if (!addressForm.province) {
      setCities([]);
      return;
    }
    
    const fetchCities = async () => {
      setLoadingCities(true);
      try {
        const response = await regionAPI.getCitiesByProvince(addressForm.province);
        setCities(response.data.data); 
      } catch (error) {
        console.error('Error fetching cities:', error);
      } finally {
        setLoadingCities(false);
      }
    };
    
    fetchCities();
  }, [addressForm.province]);
  
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
        gender: user.gender || '',
        profileImage: null
      });
      
      const hasExistingProvince = !!user.state && user.state.trim() !== '';
      const hasExistingCity = !!user.city && user.city.trim() !== '';
      
      setHasProvince(hasExistingProvince);
      setHasCity(hasExistingCity);
      
      setAddressForm({
        address: user.address || '',
        city: '', 
        cityName: user.city || '',
        province: '', 
        provinceName: user.state || '',
        zipCode: user.zipCode || '',
        country: user.country || 'Indonesia',
      });
      
      if (user.profileImage) {
        setImagePreview(user.profileImage);
      }
    }
  }, [user]);
  
  useEffect(() => {
    if (provinces.length > 0 && addressForm.provinceName) {
      const matchedProvince = provinces.find(
        p => p.name.toLowerCase() === addressForm.provinceName.toLowerCase()
      );
      
      if (matchedProvince) {
        setAddressForm(prev => ({
          ...prev,
          province: matchedProvince.id
        }));
      }
    }
  }, [provinces, addressForm.provinceName]);
  
  useEffect(() => {
    if (cities.length > 0 && addressForm.cityName) {
      const matchedCity = cities.find(
        c => c.name.toLowerCase() === addressForm.cityName.toLowerCase()
      );
      
      if (matchedCity) {
        setAddressForm(prev => ({
          ...prev,
          city: matchedCity.id
        }));
      }
    }
  }, [cities, addressForm.cityName]);
  
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'province') {
      const selectedProvince = provinces.find(p => p.id === value);
      setAddressForm(prev => ({
        ...prev,
        province: value,
        provinceName: selectedProvince ? selectedProvince.name : '',
        city: '', 
        cityName: ''
      }));
      
      setHasProvince(true);
      setHasCity(false);
    } else if (name === 'city') {
      const selectedCity = cities.find(c => c.id === value);
      setAddressForm(prev => ({
        ...prev,
        city: value,
        cityName: selectedCity ? selectedCity.name : ''
      }));
      
      setHasCity(true);
    } else {
      setAddressForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  const toggleProvinceEdit = () => {
    setHasProvince(prev => !prev);
  };
  
  const toggleCityEdit = () => {
    setHasCity(prev => !prev);
  };
  
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.match(/^image\/(jpeg|jpg|png)$/i)) {
        Swal.fire({
          icon: 'error',
          title: 'Invalid File Type',
          text: 'Please upload only JPG or PNG images',
        });
        return;
      }
      
      if (file.size > 2 * 1024 * 1024) {
        Swal.fire({
          icon: 'error',
          title: 'File Too Large',
          text: 'Image must be less than 2MB',
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onload = () => {
        setSrc(reader.result);
        setImagePreviewCropped(null);
        setCompletedCrop(null);
        setShowCropModal(true);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const updateCropPreview = (crop, imageRef) => {
    if (!crop || !imageRef) return;

    const canvas = document.createElement('canvas');
    const scaleX = imageRef.naturalWidth / imageRef.width;
    const scaleY = imageRef.naturalHeight / imageRef.height;
    
    const cropWidth = crop.width * scaleX;
    const cropHeight = crop.height * scaleY;
    
    if (cropWidth === 0 || cropHeight === 0) return;
    
    canvas.width = 100;
    canvas.height = 100;
    
    const ctx = canvas.getContext('2d');
    
    ctx.drawImage(
      imageRef,
      crop.x * scaleX,
      crop.y * scaleY,
      cropWidth,
      cropHeight,
      0,
      0,
      100,
      100
    );
    
    setImagePreviewCropped(canvas.toDataURL('image/jpeg'));
  };

  const handleCropComplete = (crop) => {
    setCompletedCrop(crop);
    if (crop.width && crop.height && imgRef.current) {
      updateCropPreview(crop, imgRef.current);
    }
  };
  
  const handleImageLoaded = (img) => {
    imgRef.current = img;
    
    const size = 80;
    
    const circularCrop = {
      unit: '%',
      width: size,
      height: size,
      x: (100 - size) / 2,
      y: (100 - size) / 2,
      aspect: 1
    };
    
    setCrop(circularCrop);
    updateCropPreview(circularCrop, img);
    setCompletedCrop(circularCrop);
    
    return false;
  };
  
  const getCroppedImg = (image, crop, fileName) => {
    if (!image || !crop) return null;
    
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    canvas.width = crop.width;
    canvas.height = crop.height;
    
    const ctx = canvas.getContext('2d');
    
    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    );
    
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) return;
        blob.name = fileName;
        resolve(blob);
      }, 'image/jpeg', 0.95);
    });
  };
  
  const handleCropSave = async () => {
    if (!imgRef.current || !completedCrop) return;
    
    try {
      const croppedImageBlob = await getCroppedImg(
        imgRef.current,
        completedCrop,
        'cropped-profile.jpg'
      );
      
      const croppedImageFile = new File([croppedImageBlob], 'profile.jpg', { type: 'image/jpeg' });
      
      setProfileForm(prev => ({
        ...prev,
        profileImage: croppedImageFile
      }));
      
      const imageUrl = URL.createObjectURL(croppedImageBlob);
      setImagePreview(imageUrl);
      
      setShowCropModal(false);
    } catch (error) {
      console.error('Crop error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to crop image. Please try again.',
      });
    }
  };
  
  const handleCropCancel = () => {
    setShowCropModal(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  const handleChooseFile = () => {
    fileInputRef.current.click();
  };
  
  const handleRemoveImage = () => {
    setProfileForm(prev => ({
      ...prev,
      profileImage: null
    }));
    setImagePreview(user?.profileImage || null);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  const validateProfileForm = () => {
    const newErrors = {};
    
    if (!profileForm.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (profileForm.phone && !/^0[0-9]{9,12}$/.test(profileForm.phone)) {
      newErrors.phone = 'Phone number is invalid (e.g., 08123456789)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const validateAddressForm = () => {
    const newErrors = {};
    
    if (addressForm.zipCode && !/^[0-9]{5}(?:-[0-9]{4})?$/.test(addressForm.zipCode)) {
      newErrors.zipCode = 'Zip code format is invalid';
    }
    
    if (!hasProvince && !addressForm.province) {
      newErrors.province = 'Please select a province';
    }
    
    if (!hasCity && !addressForm.city && addressForm.province) {
      newErrors.city = 'Please select a city';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const validatePasswordForm = () => {
    const newErrors = {};
    
    if (!passwordForm.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }
    
    if (!passwordForm.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (passwordForm.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/.test(passwordForm.newPassword)) {
      newErrors.newPassword = 'Password must contain lowercase, uppercase, and numbers';
    }
    
    if (!passwordForm.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (passwordForm.confirmPassword !== passwordForm.newPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    
    if (!validateProfileForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('name', profileForm.name);
      formData.append('phone', profileForm.phone || '');
      formData.append('dateOfBirth', profileForm.dateOfBirth || '');
      formData.append('gender', profileForm.gender || '');
      
      if (profileForm.profileImage && profileForm.profileImage instanceof File) {
        formData.append('profileImage', profileForm.profileImage);
      }
      
      await updateProfile(formData);
      
      Swal.fire({
        icon: 'success',
        title: 'Profile Updated',
        text: 'Your profile has been successfully updated.',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Profile update error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: error.message || 'Failed to update profile. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddressUpdate = async (e) => {
    e.preventDefault();
    
    if (!validateAddressForm()) {
      const firstError = document.querySelector('.text-error');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    setAddressLoading(true);
    
    try {
      const addressData = {
        address: addressForm.address,
        city: addressForm.cityName,
        state: addressForm.provinceName,
        zipCode: addressForm.zipCode,
        country: addressForm.country
      };
      
      await userAPI.updateUser(user.id, addressData);
      
      setHasProvince(true);
      setHasCity(true);
      
      Swal.fire({
        icon: 'success',
        title: 'Address Updated',
        text: 'Your address has been successfully updated.',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Address update error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: error.message || 'Failed to update address. Please try again.',
      });
    } finally {
      setAddressLoading(false);
    }
  };
  
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      await changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
      );
      
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      Swal.fire({
        icon: 'success',
        title: 'Password Updated',
        text: 'Your password has been successfully changed.',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Password change error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Password Change Failed',
        text: error.message || 'Failed to change password. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteAccount = () => {
    Swal.fire({
      title: 'Are you sure?',
      text: "This action cannot be undone. All your data will be permanently deleted.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete my account',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire(
          'Account Deleted',
          'Your account has been successfully deleted.',
          'success'
        ).then(() => {
          logout();
        });
      }
    });
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
  
  const passwordStrength = getPasswordStrength(passwordForm.newPassword);
  
  const handleCropReset = () => {
    const size = 80;
    const circularCrop = {
      unit: '%',
      width: size,
      height: size,
      x: (100 - size) / 2,
      y: (100 - size) / 2,
      aspect: 1
    };
    
    setCrop(circularCrop);
    
    if (imgRef.current) {
      updateCropPreview(circularCrop, imgRef.current);
      setCompletedCrop(circularCrop);
    } else {
      setCompletedCrop(null);
      setImagePreviewCropped(null);
    }
  };
  
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="loading loading-spinner loading-lg text-npc-gold"></div>
      </div>
    );
  }
  
  return (
    <>
      {showCropModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-base sm:text-lg font-medium text-gray-800 mb-3 sm:mb-4">Adjust Your Profile Picture</h3>
            <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
              Drag or resize the highlighted area to select the portion of your image to use as your profile picture.
            </p>
            
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2 max-h-[50vh] sm:max-h-[60vh] overflow-auto flex justify-center border rounded">
                <ReactCrop
                  src={src}
                  crop={crop}
                  onChange={(newCrop) => setCrop(newCrop)}
                  onComplete={handleCropComplete}
                  onImageLoaded={handleImageLoaded}
                  circularCrop
                  className="max-h-full"
                />
              </div>
              
              <div className="flex flex-col items-center justify-center">
                <div className="text-center mb-3 sm:mb-4">
                  <h4 className="text-sm sm:text-base font-medium text-gray-700 mb-1 sm:mb-2">Preview</h4>
                  <p className="text-xs text-gray-500">This is how your profile picture will appear</p>
                </div>
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-gray-300 flex items-center justify-center bg-gray-100">
                  {imagePreviewCropped ? (
                    <img 
                      src={imagePreviewCropped} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-gray-400 text-xs text-center p-2">
                      Adjust crop to see preview
                    </div>
                  )}
                </div>
                
                {completedCrop && completedCrop.width > 0 && (
                  <button
                    type="button"
                    onClick={handleCropReset}
                    className="mt-3 sm:mt-4 text-xs sm:text-sm text-blue-600 hover:text-blue-800"
                  >
                    Reset Selection
                  </button>
                )}
              </div>
            </div>
            
            <div className="mt-4 sm:mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
              <div className="text-xs text-gray-500 order-2 sm:order-1">
                <ul className="list-disc pl-5 space-y-1">
                  <li>For best results, use a square image</li>
                  <li>Image will be displayed as a circle in your profile</li>
                </ul>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:gap-3 order-1 sm:order-2">
                <button
                  onClick={handleCropCancel}
                  className="btn btn-sm sm:btn-md bg-transparent hover:bg-black text-black hover:text-white border border-black hover:border-black text-xs sm:text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCropSave}
                  className="btn btn-sm sm:btn-md bg-npc-gold hover:bg-npc-darkGold text-white border-none text-xs sm:text-sm"
                  disabled={!completedCrop?.width || !completedCrop?.height}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="min-h-screen bg-gray-100 pt-12 sm:pt-14 md:pt-16 py-4 sm:py-6 md:py-8">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="max-w-4xl mx-auto bg-white shadow-sm sm:shadow rounded-lg overflow-hidden">
            <div className="bg-gradient-to-r from-npc-navy to-npc-gold p-4 sm:p-6">
              <h1 className="text-xl sm:text-2xl font-bold text-white">My Account</h1>
              <p className="text-xs sm:text-sm opacity-80 text-white mt-1">Manage your personal information and account settings</p>
            </div>
            
            <div className="border-b">
              <div className="flex overflow-x-auto">
                <button
                  className={`px-4 sm:px-6 py-3 text-xs sm:text-sm font-medium whitespace-nowrap ${
                    activeTab === 'profile'
                      ? 'border-b-2 border-npc-gold text-npc-gold'
                      : 'text-gray-500 hover:text-npc-navy'
                  }`}
                  onClick={() => setActiveTab('profile')}
                >
                  <i className="fas fa-user mr-1 sm:mr-2"></i>
                  Profile
                </button>
                
                <button
                  className={`px-4 sm:px-6 py-3 text-xs sm:text-sm font-medium whitespace-nowrap ${
                    activeTab === 'address'
                      ? 'border-b-2 border-npc-gold text-npc-gold'
                      : 'text-gray-500 hover:text-npc-navy'
                  }`}
                  onClick={() => setActiveTab('address')}
                >
                  <i className="fas fa-map-marker-alt mr-1 sm:mr-2"></i>
                  Address
                </button>
                
                <button
                  className={`px-4 sm:px-6 py-3 text-xs sm:text-sm font-medium whitespace-nowrap ${
                    activeTab === 'security'
                      ? 'border-b-2 border-npc-gold text-npc-gold'
                      : 'text-gray-500 hover:text-npc-navy'
                  }`}
                  onClick={() => setActiveTab('security')}
                >
                  <i className="fas fa-lock mr-1 sm:mr-2"></i>
                  Security
                </button>
              </div>
            </div>
            
            <div className="p-4 sm:p-6">
              {activeTab === 'profile' && (
                <form onSubmit={handleProfileUpdate}>
                  <div className="space-y-4 sm:space-y-6">
                    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
                      <div className="relative">
                        <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-200 rounded-full overflow-hidden">
                          {imagePreview ? (
                            <img
                              src={imagePreview}
                              alt="Profile"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full bg-gray-100 text-gray-400">
                              <i className="fas fa-user text-2xl sm:text-4xl"></i>
                            </div>
                          )}
                        </div>
                        
                        <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          accept="image/*"
                          onChange={handleFileChange}
                        />
                      </div>
                      
                      <div className="flex flex-col gap-2 text-center sm:text-left">
                        <h3 className="text-sm sm:text-base font-medium text-gray-800">Profile Picture</h3>
                        <p className="text-xs sm:text-sm text-gray-500">
                          Upload a new profile picture. JPG, GIF or PNG. Max size 2MB.
                        </p>
                        <div className="flex flex-col gap-2 mt-2 sm:flex-row">
                          <button
                            type="button"
                            onClick={handleChooseFile}
                            className="btn btn-sm sm:btn-md bg-npc-gold hover:bg-npc-darkGold text-white border-none text-xs sm:text-sm"
                          >
                            <i className="fas fa-upload mr-1 sm:mr-2"></i>
                            Upload
                          </button>
                          
                          {imagePreview && imagePreview !== user?.profileImage && (
                            <button
                              type="button"
                              onClick={handleRemoveImage}
                              className="btn btn-sm btn-outline btn-error text-xs sm:text-sm"
                            >
                              <i className="fas fa-times mr-1 sm:mr-2"></i>
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="divider"></div>
                    
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text text-sm sm:text-base text-gray-700">Full Name</span>
                        </label>
                        <input
                          id="name"
                          name="name"
                          type="text"
                          value={profileForm.name}
                          onChange={handleProfileChange}
                          className={`input input-bordered w-full bg-white text-gray-800 border-gray-300 focus:border-npc-gold focus:ring-npc-gold text-sm sm:text-base ${errors.name ? 'input-error' : ''}`}
                          placeholder="Enter your full name"
                        />
                        {errors.name && (
                          <label className="label">
                            <span className="label-text-alt text-error text-xs">{errors.name}</span>
                          </label>
                        )}
                      </div>
                      
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text text-sm sm:text-base text-gray-700">Email Address</span>
                        </label>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          value={profileForm.email}
                          readOnly
                          className="input input-bordered w-full bg-gray-50 text-gray-500 border-gray-300 text-sm sm:text-base"
                        />
                        <label className="label">
                          <span className="label-text-alt text-gray-500 text-xs">Email cannot be changed. Contact support if needed.</span>
                        </label>
                      </div>
                      
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text text-sm sm:text-base text-gray-700">Phone Number</span>
                        </label>
                        <input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={profileForm.phone}
                          onChange={handleProfileChange}
                          className={`input input-bordered w-full bg-white text-gray-800 border-gray-300 focus:border-npc-gold focus:ring-npc-gold text-sm sm:text-base ${errors.phone ? 'input-error' : ''}`}
                          placeholder="08123456789"
                        />
                        {errors.phone && (
                          <label className="label">
                            <span className="label-text-alt text-error text-xs">{errors.phone}</span>
                          </label>
                        )}
                      </div>
                      
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text text-sm sm:text-base text-gray-700">Date of Birth</span>
                        </label>
                        <input
                          id="dateOfBirth"
                          name="dateOfBirth"
                          type="date"
                          value={profileForm.dateOfBirth}
                          onChange={handleProfileChange}
                          className="input input-bordered w-full bg-white text-gray-800 border-gray-300 focus:border-npc-gold focus:ring-npc-gold text-sm sm:text-base"
                        />
                      </div>
                      
                      <div className="form-control md:col-span-2">
                        <label className="label">
                          <span className="label-text text-sm sm:text-base text-gray-700">Gender</span>
                        </label>
                        <select
                          id="gender"
                          name="gender"
                          value={profileForm.gender}
                          onChange={handleProfileChange}
                          className="select select-bordered w-full bg-white text-gray-800 border-gray-300 focus:border-npc-gold focus:ring-npc-gold text-sm sm:text-base"
                        >
                          <option value="">Select gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                          <option value="prefer_not_to_say">Prefer not to say</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="flex justify-center sm:justify-end mt-4 sm:mt-6">
                      <button
                        type="submit"
                        className={`btn btn-sm sm:btn-md bg-npc-gold hover:bg-npc-darkGold text-white border-none w-full sm:w-auto text-sm sm:text-base${isLoading ? ' loading' : ''}`}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </form>
              )}
              
              {activeTab === 'address' && (
                <form onSubmit={handleAddressUpdate}>
                  <div className="space-y-4 sm:space-y-6">
                    <h3 className="text-base sm:text-lg font-medium text-gray-800">Shipping Address</h3>
                    <p className="text-xs sm:text-sm text-gray-500">
                      This address will be used as your default shipping address for orders.
                    </p>
                    
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="form-control md:col-span-2">
                        <label className="label">
                          <span className="label-text text-sm sm:text-base text-gray-700">Street Address</span>
                        </label>
                        <textarea
                          id="address"
                          name="address"
                          rows="3"
                          value={addressForm.address || ''}
                          onChange={handleAddressChange}
                          className="textarea textarea-bordered w-full bg-white text-gray-800 border-gray-300 focus:border-npc-gold focus:ring-npc-gold text-sm sm:text-base"
                          placeholder="Enter your street address"
                        ></textarea>
                      </div>
                      
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text text-sm sm:text-base text-gray-700">Province</span>
                          {hasProvince && (
                            <button
                              type="button"
                              onClick={toggleProvinceEdit}
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              Change
                            </button>
                          )}
                        </label>
                        
                        {hasProvince && !loadingProvinces ? (
                          <div className="relative">
                            <input
                              type="text"
                              readOnly
                              value={addressForm.provinceName}
                              className="input input-bordered w-full bg-gray-50 text-gray-700 text-sm sm:text-base"
                            />
                          </div>
                        ) : (
                          <select
                            id="province"
                            name="province"
                            value={addressForm.province}
                            onChange={handleAddressChange}
                            className={`select select-bordered w-full bg-white text-gray-800 border-gray-300 focus:border-npc-gold focus:ring-npc-gold text-sm sm:text-base ${errors.province ? 'select-error' : ''}`}
                            disabled={loadingProvinces}
                          >
                            <option value="">Select province</option>
                            {provinces.map(province => (
                              <option key={province.id} value={province.id}>
                                {province.name}
                              </option>
                            ))}
                          </select>
                        )}
                        
                        {errors.province && (
                          <label className="label">
                            <span className="label-text-alt text-error text-xs">{errors.province}</span>
                          </label>
                        )}
                        {loadingProvinces && (
                          <label className="label">
                            <span className="label-text-alt text-gray-500 text-xs">Loading provinces...</span>
                          </label>
                        )}
                      </div>
                      
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text text-sm sm:text-base text-gray-700">City</span>
                          {hasCity && (
                            <button
                              type="button"
                              onClick={toggleCityEdit}
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              Change
                            </button>
                          )}
                        </label>
                        
                        {hasCity && !loadingCities ? (
                          <input
                            type="text"
                            readOnly
                            value={addressForm.cityName}
                            className="input input-bordered w-full bg-gray-50 text-gray-700 text-sm sm:text-base"
                          />
                        ) : (
                          <select
                            id="city"
                            name="city"
                            value={addressForm.city}
                            onChange={handleAddressChange}
                            className={`select select-bordered w-full bg-white text-gray-800 border-gray-300 focus:border-npc-gold focus:ring-npc-gold text-sm sm:text-base ${errors.city ? 'select-error' : ''}`}
                            disabled={!addressForm.province || loadingCities}
                          >
                            <option value="">Select city</option>
                            {cities.map(city => (
                              <option key={city.id} value={city.id}>
                                {city.name}
                              </option>
                            ))}
                          </select>
                        )}
                        
                        {errors.city && (
                          <label className="label">
                            <span className="label-text-alt text-error text-xs">{errors.city}</span>
                          </label>
                        )}
                        {loadingCities && (
                          <label className="label">
                            <span className="label-text-alt text-gray-500 text-xs">Loading cities...</span>
                          </label>
                        )}
                        {!addressForm.province && !loadingCities && !hasCity && (
                          <label className="label">
                            <span className="label-text-alt text-gray-500 text-xs">Please select a province first</span>
                          </label>
                        )}
                      </div>
                      
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text text-sm sm:text-base text-gray-700">ZIP/Postal Code</span>
                        </label>
                        <input
                          id="zipCode"
                          name="zipCode"
                          type="text"
                          value={addressForm.zipCode || ''}
                          onChange={handleAddressChange}
                          className={`input input-bordered w-full bg-white text-gray-800 border-gray-300 focus:border-npc-gold focus:ring-npc-gold text-sm sm:text-base ${errors.zipCode ? 'input-error' : ''}`}
                          placeholder="Enter your ZIP code"
                        />
                        {errors.zipCode && (
                          <label className="label">
                            <span className="label-text-alt text-error text-xs">{errors.zipCode}</span>
                          </label>
                        )}
                      </div>
                      
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text text-sm sm:text-base text-gray-700">Country</span>
                        </label>
                        <select
                          id="country"
                          name="country"
                          value={addressForm.country || 'Indonesia'}
                          onChange={handleAddressChange}
                          className="select select-bordered w-full bg-white text-gray-800 border-gray-300 focus:border-npc-gold focus:ring-npc-gold text-sm sm:text-base"
                        >
                          <option value="Indonesia">Indonesia</option>
                          <option value="Malaysia">Malaysia</option>
                          <option value="Singapore">Singapore</option>
                          <option value="Thailand">Thailand</option>
                          <option value="Vietnam">Vietnam</option>
                          <option value="Philippines">Philippines</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="flex justify-center sm:justify-end mt-4 sm:mt-6">
                      <button
                        type="submit"
                        className={`btn btn-sm sm:btn-md bg-npc-gold hover:bg-npc-darkGold text-white border-none w-full sm:w-auto text-sm sm:text-base${addressLoading ? ' loading' : ''}`}
                        disabled={addressLoading}
                      >
                        {addressLoading ? 'Saving...' : 'Save Address'}
                      </button>
                    </div>
                  </div>
                </form>
              )}
              
              {activeTab === 'security' && (
                <div className="space-y-6 sm:space-y-8">
                  <form onSubmit={handlePasswordSubmit}>
                    <div className="space-y-4 sm:space-y-6">
                      <h3 className="text-base sm:text-lg font-medium text-gray-800">Change Password</h3>
                      <p className="text-xs sm:text-sm text-gray-500">
                        Update your password to keep your account secure. Make sure to use a strong password.
                      </p>
                      
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="form-control md:col-span-2">
                          <label className="label">
                            <span className="label-text text-sm sm:text-base text-gray-700">Current Password</span>
                          </label>
                          <input
                            id="currentPassword"
                            name="currentPassword"
                            type="password"
                            value={passwordForm.currentPassword}
                            onChange={handlePasswordChange}
                            className={`input input-bordered w-full bg-white text-gray-800 border-gray-300 focus:border-npc-gold focus:ring-npc-gold text-sm sm:text-base ${errors.currentPassword ? 'input-error' : ''}`}
                            placeholder="Enter your current password"
                          />
                          {errors.currentPassword && (
                            <label className="label">
                              <span className="label-text-alt text-error text-xs">{errors.currentPassword}</span>
                            </label>
                          )}
                        </div>
                        
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text text-sm sm:text-base text-gray-700">New Password</span>
                          </label>
                          <input
                            id="newPassword"
                            name="newPassword"
                            type="password"
                            value={passwordForm.newPassword}
                            onChange={handlePasswordChange}
                            className={`input input-bordered w-full bg-white text-gray-800 border-gray-300 focus:border-npc-gold focus:ring-npc-gold text-sm sm:text-base ${errors.newPassword ? 'input-error' : ''}`}
                            placeholder="Enter your new password"
                          />
                          
                          {passwordForm.newPassword && (
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
                          
                          {errors.newPassword && (
                            <label className="label">
                              <span className="label-text-alt text-error text-xs">{errors.newPassword}</span>
                            </label>
                          )}
                        </div>
                        
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text text-sm sm:text-base text-gray-700">Confirm New Password</span>
                          </label>
                          <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            value={passwordForm.confirmPassword}
                            onChange={handlePasswordChange}
                            className={`input input-bordered w-full bg-white text-gray-800 border-gray-300 focus:border-npc-gold focus:ring-npc-gold text-sm sm:text-base ${errors.confirmPassword ? 'input-error' : ''}`}
                            placeholder="Confirm your new password"
                          />
                          {errors.confirmPassword && (
                            <label className="label">
                              <span className="label-text-alt text-error text-xs">{errors.confirmPassword}</span>
                            </label>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex justify-center sm:justify-end mt-4 sm:mt-6">
                        <button
                          type="submit"
                          className={`btn btn-sm sm:btn-md bg-npc-gold hover:bg-npc-darkGold text-white border-none w-full sm:w-auto text-sm sm:text-base${isLoading ? ' loading' : ''}`}
                          disabled={isLoading}
                        >
                          {isLoading ? 'Updating...' : 'Update Password'}
                        </button>
                      </div>
                    </div>
                  </form>
                  
                  <div className="bg-red-50 p-4 sm:p-6 rounded-lg border border-red-200">
                    <h3 className="text-base sm:text-lg font-medium text-red-700">Delete Account</h3>
                    <p className="text-xs sm:text-sm text-red-600 mb-3 sm:mb-4">
                      Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      className="btn btn-sm sm:btn-md btn-error btn-outline w-full sm:w-auto text-sm sm:text-base"
                    >
                      Delete My Account
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;