// middleware/auth.middleware.js
const jwt = require('jsonwebtoken');

/**
 * Authentication middleware to verify JWT tokens
 */
function isAuthenticated(req, res, next) {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authentication token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Set user info in request
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid authentication token' });
  }
}

/**
 * Permission check middleware
 */
function hasPermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    // Check if user has the required permission
    if (req.user.permissions && req.user.permissions.includes(permission)) {
      return next();
    }
    
    // Check if user has admin role which implicitly has all permissions
    if (req.user.role === 'admin') {
      return next();
    }
    
    return res.status(403).json({ 
      error: 'Access denied', 
      message: `Required permission: ${permission}` 
    });
  };
}

module.exports = {
  isAuthenticated,
  hasPermission
};