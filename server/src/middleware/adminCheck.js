const logger = require('../utils/logger');

const adminCheck = async (req, res, next) => {
  try {
    const user = req.user;
    
    // Check if user is admin (add isAdmin field to User model)
    if (!user.isAdmin && user.email !== process.env.ADMIN_EMAIL) {
      logger.warn('Admin access denied', {
        userId: user._id,
        email: user.email,
        ip: req.ip,
        endpoint: req.originalUrl
      });
      
      return res.status(403).json({
        success: false,
        error: 'Admin access required',
        message: 'You do not have permission to access this resource'
      });
    }
    
    // Log admin access
    logger.info('Admin access granted', {
      userId: user._id,
      email: user.email,
      endpoint: req.originalUrl,
      requestId: req.requestId
    });
    
    next();
  } catch (error) {
    logger.error('Admin check failed', {
      error: error.message,
      userId: req.user?._id
    });
    
    res.status(500).json({
      success: false,
      error: 'Authorization check failed'
    });
  }
};

module.exports = adminCheck;