const reportsService = require('./reports.service');
const { success } = require('../../utils/apiResponse');

async function getEcosReport(req, res, next) {
  try {
    const data = await reportsService.getEcosReport(req.query);
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function getEcoChanges(req, res, next) {
  try {
    const data = await reportsService.getEcoChanges(parseInt(req.params.id, 10));
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function getProductVersionHistory(req, res, next) {
  try {
    const data = await reportsService.getProductVersionHistory();
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function getBomChangeHistory(req, res, next) {
  try {
    const data = await reportsService.getBomChangeHistory();
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function getArchivedProducts(req, res, next) {
  try {
    const data = await reportsService.getArchivedProducts();
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function getActiveMatrix(req, res, next) {
  try {
    const data = await reportsService.getActiveMatrix();
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getEcosReport,
  getEcoChanges,
  getProductVersionHistory,
  getBomChangeHistory,
  getArchivedProducts,
  getActiveMatrix,
};
