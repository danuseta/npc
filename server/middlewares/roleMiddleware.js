const restrictTo = (...roles) => {
    return (req, res, next) => {
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. This feature is only available for ${roles.join(' or ')} users. Your current role is '${req.user.role}'.`
        });
      }
      next();
    };
};

module.exports = { restrictTo };