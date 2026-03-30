const approvalsService = require('./approvals.service');
const { success } = require('../../utils/apiResponse');

async function getAll(req, res, next) {
  try {
    const approvals = await approvalsService.getPendingApprovals(req.user.id);
    return success(res, approvals);
  } catch (err) {
    next(err);
  }
}

async function approve(req, res, next) {
  try {
    const result = await approvalsService.approveEco(parseInt(req.params.eco_id, 10), req.user.id);
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

async function reject(req, res, next) {
  try {
    const result = await approvalsService.rejectEco(parseInt(req.params.eco_id, 10), req.user.id);
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, approve, reject };
