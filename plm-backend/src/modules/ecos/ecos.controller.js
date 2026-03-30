const ecosService = require('./ecos.service');
const { success, successPaginated } = require('../../utils/apiResponse');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');

async function create(req, res, next) {
  try {
    const eco = await ecosService.createEco(req.body, req.user.id);
    return success(res, eco, 201);
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { ecos, total } = await ecosService.listEcos({
      type: req.query.type,
      status: req.query.status,
      product_id: req.query.product_id ? parseInt(req.query.product_id, 10) : null,
      page,
      limit,
      offset,
      roleName: req.user.roleName,
    });
    return successPaginated(res, ecos, buildPaginationMeta(page, limit, total));
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const eco = await ecosService.getEcoById(parseInt(req.params.id, 10));
    return success(res, eco);
  } catch (err) {
    next(err);
  }
}

async function proposeChanges(req, res, next) {
  try {
    const result = await ecosService.proposeChanges(parseInt(req.params.id, 10), req.body, req.user.id);
    return success(res, result, 200);
  } catch (err) {
    next(err);
  }
}

async function getDiff(req, res, next) {
  try {
    const diff = await ecosService.getEcoDiff(parseInt(req.params.id, 10));
    return success(res, diff);
  } catch (err) {
    next(err);
  }
}

async function submit(req, res, next) {
  try {
    const eco = await ecosService.submitEco(parseInt(req.params.id, 10), req.user.id);
    return success(res, eco);
  } catch (err) {
    next(err);
  }
}

async function validate(req, res, next) {
  try {
    const eco = await ecosService.validateEco(parseInt(req.params.id, 10), req.user.id);
    return success(res, eco);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const result = await ecosService.deleteEco(parseInt(req.params.id, 10), req.user.id);
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

module.exports = { create, list, getById, proposeChanges, getDiff, submit, validate, remove };
