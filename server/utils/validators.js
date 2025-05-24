const validator = require('validator');

exports.validateRegistration = (data) => {
  const errors = {};
  
  if (!data.name || validator.isEmpty(data.name.trim())) {
    errors.name = 'Name is required';
  }
  
  if (!data.email || !validator.isEmail(data.email)) {
    errors.email = 'Valid email is required';
  }
  
  if (!data.password || data.password.length < 8) {
    errors.password = 'Password must be at least 8 characters long';
  } else {
    const hasUppercase = /[A-Z]/.test(data.password);
    const hasLowercase = /[a-z]/.test(data.password);
    const hasNumber = /\d/.test(data.password);
    
    if (!hasUppercase || !hasLowercase || !hasNumber) {
      errors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }
  }
  
  if (data.confirmPassword !== undefined && data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

exports.validateLogin = (data) => {
  const errors = {};
  
  if (!data.email || !validator.isEmail(data.email)) {
    errors.email = 'Valid email is required';
  }
  
  if (!data.password) {
    errors.password = 'Password is required';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

exports.validateProduct = (data) => {
  const errors = {};
  
  if (!data.name || validator.isEmpty(data.name.trim())) {
    errors.name = 'Product name is required';
  }
  
  if (!data.price) {
    errors.price = 'Price is required';
  } else if (isNaN(data.price) || data.price <= 0) {
    errors.price = 'Price must be a positive number';
  }
  
  if (data.stock !== undefined) {
    if (isNaN(data.stock) || parseInt(data.stock) < 0) {
      errors.stock = 'Stock must be a non-negative number';
    }
  }
  
  if (data.categoryId && isNaN(data.categoryId)) {
    errors.categoryId = 'Invalid category ID';
  }
  
  if (data.discountPercentage) {
    if (isNaN(data.discountPercentage) || data.discountPercentage < 0 || data.discountPercentage > 100) {
      errors.discountPercentage = 'Discount percentage must be between 0 and 100';
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

exports.validateCategory = (data) => {
  const errors = {};
  
  if (!data.name || validator.isEmpty(data.name.trim())) {
    errors.name = 'Category name is required';
  }
  
  if (data.parentId && isNaN(data.parentId)) {
    errors.parentId = 'Invalid parent category ID';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

exports.validateOrder = (data) => {
  const errors = {};
  
  if (!data.shippingAddress || validator.isEmpty(data.shippingAddress.trim())) {
    errors.shippingAddress = 'Shipping address is required';
  }
  
  if (data.paymentMethod) {
    const validMethods = ['credit_card', 'debit_card', 'bank_transfer', 'e_wallet', 'cash_on_delivery'];
    if (!validMethods.includes(data.paymentMethod)) {
      errors.paymentMethod = 'Invalid payment method';
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

exports.validateReview = (data) => {
  const errors = {};
  
  if (!data.productId) {
    errors.productId = 'Product ID is required';
  }
  
  if (!data.rating) {
    errors.rating = 'Rating is required';
  } else if (isNaN(data.rating) || data.rating < 1 || data.rating > 5) {
    errors.rating = 'Rating must be between 1 and 5';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

exports.validatePayment = (data) => {
  const errors = {};
  
  if (!data.orderId) {
    errors.orderId = 'Order ID is required';
  }
  
  if (!data.method) {
    errors.method = 'Payment method is required';
  } else {
    const validMethods = ['credit_card', 'debit_card', 'bank_transfer', 'e_wallet', 'cash_on_delivery'];
    if (!validMethods.includes(data.method)) {
      errors.method = 'Invalid payment method';
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};