const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { error } = require('../utils/apiResponse');

/**
 * JWT verification middleware.
 * Extracts Bearer token, verifies it, and attaches req.user.
 */
function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, 'Authentication required. No token provided.', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    req.user = {
      id: decoded.userId,
      roleId: decoded.roleId,
      roleName: decoded.roleName,
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return error(res, 'Token expired. Please refresh your token.', 401);
    }
    return error(res, 'Invalid token.', 401);
  }
}

module.exports = auth;
