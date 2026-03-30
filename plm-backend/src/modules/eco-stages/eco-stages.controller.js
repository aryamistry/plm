const stagesService = require('./eco-stages.service');
const { success } = require('../../utils/apiResponse');

async function create(req, res, next) {
  try {
    const stage = await stagesService.createStage(req.body, req.user.id);
    return success(res, stage, 201);
  } catch (err) {
    next(err);
  }
}

async function getAll(req, res, next) {
  try {
    const stages = await stagesService.getAllStages();
    return success(res, stages);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const stage = await stagesService.updateStage(parseInt(req.params.id, 10), req.body, req.user.id);
    return success(res, stage);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const result = await stagesService.deleteStage(parseInt(req.params.id, 10), req.user.id);
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

module.exports = { create, getAll, update, remove };
