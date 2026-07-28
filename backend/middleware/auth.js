const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Verify JWT from Authorization: Bearer <token>
 * Attaches req.user with id, email, role
 */
const protect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }
      return next();
    } catch (err) {
      return res.status(401).json({ message: 'Not authorized, invalid token' });
    }
  }
  return res.status(401).json({ message: 'Not authorized, no token' });
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied for this role' });
  }
  next();
};

module.exports = { protect, requireRole };
