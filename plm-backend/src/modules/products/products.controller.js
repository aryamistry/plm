const productsService = require('./products.service');
const { success, successPaginated } = require('../../utils/apiResponse');
const { parsePagination, buildPaginationMeta } = require('../../utils/pagination');

async function create(req, res, next) {
  try {
    const product = await productsService.createProduct(req.body, req.user.id);
    return success(res, product, 201);
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { products, total } = await productsService.listProducts({
      status: req.query.status,
      page,
      limit,
      offset,
      roleName: req.user.roleName,
    });
    return successPaginated(res, products, buildPaginationMeta(page, limit, total));
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const product = await productsService.getProductById(parseInt(req.params.id, 10));
    return success(res, product);
  } catch (err) {
    next(err);
  }
}

async function getVersions(req, res, next) {
  try {
    const versions = await productsService.getProductVersions(parseInt(req.params.id, 10));
    return success(res, versions);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    await productsService.directEdit(parseInt(req.params.id, 10));
  } catch (err) {
    next(err);
  }
}

async function archive(req, res, next) {
  try {
    const result = await productsService.archiveProduct(parseInt(req.params.id, 10), req.user.id);
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

module.exports = { create, list, getById, getVersions, update, archive };
