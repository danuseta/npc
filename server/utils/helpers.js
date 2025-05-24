exports.slugify = (text) => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/&/g, '-and-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-');
  };
  
  exports.generateRandomString = (length = 10) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    return result;
  };
  
  exports.formatDate = (date, format = 'YYYY-MM-DD') => {
    if (!date) return '';
    
    const d = new Date(date);
    
    if (isNaN(d.getTime())) return '';
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    
    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  };
  
  exports.formatCurrency = (amount, currency = 'IDR') => {
    if (amount === null || amount === undefined) return '';
    
    switch (currency) {
      case 'IDR':
        return `Rp ${parseFloat(amount).toLocaleString('id-ID')}`;
      case 'USD':
        return `$${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      default:
        return `${parseFloat(amount).toLocaleString()}`;
    }
  };
  
  exports.truncateText = (text, length = 100) => {
    if (!text) return '';
    
    if (text.length <= length) return text;
    
    return text.substring(0, length) + '...';
  };
  
  exports.formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  exports.calculateDiscountPrice = (price, discountPercentage) => {
    if (!price || !discountPercentage) return price;
    
    const discount = (price * discountPercentage) / 100;
    return parseFloat((price - discount).toFixed(2));
  };
  
  exports.isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  exports.validatePassword = (password) => {
    if (password.length < 8) {
      return { 
        isValid: false, 
        message: 'Password must be at least 8 characters long'
      };
    }
    
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    
    if (!hasUppercase || !hasLowercase || !hasNumber) {
      return {
        isValid: false,
        message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      };
    }
    
    return { isValid: true, message: 'Password is valid' };
  };