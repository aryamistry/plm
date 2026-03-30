const usersService = require('./users.service');
const { success, successPaginated, error } = require('../../utils/apiResponse');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');

async function getAll(req, res, next) {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { users, total } = await usersService.getAllUsers({ page, limit, offset });
    return successPaginated(res, users, buildPaginationMeta(page, limit, total));
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const user = await usersService.getUserById(parseInt(req.params.id, 10));
    return success(res, user);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const user = await usersService.updateUser(parseInt(req.params.id, 10), req.body);
    return success(res, user);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await usersService.deleteUser(parseInt(req.params.id, 10));
    return success(res, { message: 'User deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, getById, update, remove };
