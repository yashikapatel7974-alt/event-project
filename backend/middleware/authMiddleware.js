const jwt = require('jsonwebtoken');
const { AppError } = require('./errorHandler');
const logger = require('../config/logger');

const protect = (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in. Please log in to get access.', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'default_access_secret');
    req.user = decoded;
    next();
  } catch (err) {
    logger.warn(`Failed token login attempt: ${err.message}`);
    return next(new AppError('Invalid or expired access token. Please log in again.', 401));
  }
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403));
    }
    next();
  };
};

module.exports = {
  protect,
  restrictTo,
};
