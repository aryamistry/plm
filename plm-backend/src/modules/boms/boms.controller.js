const bomsService = require('./boms.service');
const { success, successPaginated } = require('../../utils/apiResponse');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');

async function create(req, res, next) {
  try {
    const bom = await bomsService.createBom(req.body, req.user.id);
    return success(res, bom, 201);
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { boms, total } = await bomsService.listBoms({
      product_id: req.query.product_id ? parseInt(req.query.product_id, 10) : null,
      status: req.query.status,
      page,
      limit,
      offset,
      roleName: req.user.roleName,
    });
    return successPaginated(res, boms, buildPaginationMeta(page, limit, total));
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const bom = await bomsService.getBomById(parseInt(req.params.id, 10));
    return success(res, bom);
  } catch (err) {
    next(err);
  }
}

async function getVersions(req, res, next) {
  try {
    const versions = await bomsService.getBomVersions(parseInt(req.params.id, 10));
    return success(res, versions);
  } catch (err) {
    next(err);
  }
}

async function diff(req, res, next) {
  try {
    const bomId = parseInt(req.params.id, 10);
    const versionId1 = parseInt(req.params.versionId, 10);
    const versionId2 = parseInt(req.query.compareWith, 10);

    if (!versionId2) {
      return res.status(400).json({ success: false, message: 'compareWith query param is required.' });
    }

    const result = await bomsService.diffBomVersions(bomId, versionId1, versionId2);
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

module.exports = { create, list, getById, getVersions, diff };
