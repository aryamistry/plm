const authService = require('./auth.service');
const { success, error } = require('../../utils/apiResponse');

async function signup(req, res, next) {
  try {
    const user = await authService.signup(req.body);
    return success(res, { user }, 201);
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const data = await authService.login(req.body);
    return success(res, data, 200);
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const data = await authService.refreshAccessToken(req.body.refreshToken);
    return success(res, data, 200);
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    authService.logout(req.body.refreshToken);
    return success(res, { message: 'Logged out successfully.' }, 200);
  } catch (err) {
    next(err);
  }
}

module.exports = { signup, login, refresh, logout };
