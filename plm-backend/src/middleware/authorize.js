const { error } = require('../utils/apiResponse');

/**
 * Role-based access guard (factory function).
 * Usage: router.get('/...', authorize('admin', 'engineering'), controller)
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return error(res, 'Authentication required.', 401);
    }
    if (!roles.includes(req.user.roleName)) {
      return error(res, 'Forbidden. You do not have the required role.', 403);
    }
    next();
  };
};

module.exports = authorize;
