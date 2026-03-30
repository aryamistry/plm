const { Router } = require('express');
const approvalsController = require('./approvals.controller');
const auth = require('../../middleware/auth');
const authorize = require('../../middleware/authorize');

const router = Router();

router.use(auth);

router.get('/', authorize('approver', 'admin'), approvalsController.getAll);
router.post('/:eco_id/approve', authorize('approver', 'admin'), approvalsController.approve);
router.post('/:eco_id/reject', authorize('approver', 'admin'), approvalsController.reject);

module.exports = router;
