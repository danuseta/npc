const restrictTo = (...roles) => {
    return (req, res, next) => {
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. This action requires ${roles.join(' or ')} privileges.`
        });
      }
      next();
    };
};

module.exports = { restrictTo };