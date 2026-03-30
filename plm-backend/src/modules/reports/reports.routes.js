const { Router } = require('express');
const reportsController = require('./reports.controller');
const auth = require('../../middleware/auth');
const authorize = require('../../middleware/authorize');

const router = Router();

router.use(auth);

router.get('/ecos', authorize('engineering', 'admin', 'approver', 'operations'), reportsController.getEcosReport);
router.get('/ecos/:id/changes', authorize('engineering', 'admin', 'approver', 'operations'), reportsController.getEcoChanges);
router.get('/product-version-history', authorize('engineering', 'admin', 'approver', 'operations'), reportsController.getProductVersionHistory);
router.get('/bom-change-history', authorize('engineering', 'admin', 'approver', 'operations'), reportsController.getBomChangeHistory);
router.get('/archived-products', authorize('engineering', 'admin', 'approver', 'operations'), reportsController.getArchivedProducts);
router.get('/active-matrix', authorize('engineering', 'admin', 'approver', 'operations'), reportsController.getActiveMatrix);

module.exports = router;
