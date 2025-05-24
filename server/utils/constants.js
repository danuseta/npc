exports.USER_ROLES = {
    BUYER: 'buyer',
    ADMIN: 'admin',
    SUPERADMIN: 'superadmin'
  };
  
  exports.ORDER_STATUS = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
    REFUNDED: 'refunded'
  };
  
  exports.PAYMENT_STATUS = {
    PENDING: 'pending',
    PAID: 'paid',
    FAILED: 'failed',
    REFUNDED: 'refunded'
  };
  
  exports.PAYMENT_METHODS = {
    CREDIT_CARD: 'credit_card',
    DEBIT_CARD: 'debit_card',
    BANK_TRANSFER: 'bank_transfer',
    E_WALLET: 'e_wallet',
    CASH_ON_DELIVERY: 'cash_on_delivery'
  };
  
  exports.PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100
  };
  
  exports.JWT = {
    SECRET: process.env.JWT_SECRET || 'your_jwt_secret_key_here',
    EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d'
  };
  
  exports.UPLOAD = {
    MAX_FILE_SIZE: 5 * 1024 * 1024,
    ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    MAX_PRODUCT_IMAGES: 5,
    MAX_REVIEW_IMAGES: 3
  };
  
  exports.EMAIL_VERIFICATION = {
    CODE_EXPIRY: 10 * 60 * 1000,
    MAX_ATTEMPTS: 3,
    CODE_LENGTH: 6
  };
  
  exports.PASSWORD_RESET = {
    TOKEN_EXPIRY: 10 * 60 * 1000,
    MAX_ATTEMPTS: 3
  };
  
  exports.RATE_LIMIT = {
    WINDOW_MS: 15 * 60 * 1000,
    MAX_REQUESTS: 100
  };
  
  exports.VALIDATION_MESSAGES = {
    REQUIRED_FIELD: 'This field is required',
    INVALID_EMAIL: 'Please enter a valid email address',
    PASSWORD_LENGTH: 'Password must be at least 8 characters long',
    PASSWORD_STRENGTH: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    PASSWORDS_NOT_MATCH: 'Passwords do not match',
    INVALID_PRICE: 'Price must be a positive number',
    INVALID_STOCK: 'Stock must be a non-negative number',
    INVALID_DISCOUNT: 'Discount percentage must be between 0 and 100'
  };
  
  exports.SUCCESS_MESSAGES = {
    CREATED: 'Resource created successfully',
    UPDATED: 'Resource updated successfully',
    DELETED: 'Resource deleted successfully',
    REGISTERED: 'Registration successful. Please check your email for verification code.',
    LOGGED_IN: 'Logged in successfully',
    EMAIL_VERIFIED: 'Email verified successfully',
    PASSWORD_RESET: 'Password reset successful'
  };
  
  exports.ERROR_MESSAGES = {
    SERVER_ERROR: 'Something went wrong. Please try again later.',
    NOT_FOUND: 'Resource not found',
    UNAUTHORIZED: 'Unauthorized access',
    INVALID_CREDENTIALS: 'Invalid email or password',
    EMAIL_EXISTS: 'Email already in use',
    INVALID_TOKEN: 'Invalid or expired token',
    FORBIDDEN: 'You do not have permission to perform this action'
  };