const { Router } = require('express');
const { z } = require('zod');
const bomsController = require('./boms.controller');
const auth = require('../../middleware/auth');
const authorize = require('../../middleware/authorize');
const validate = require('../../middleware/validate');

const router = Router();

router.use(auth);

const createSchema = z.object({
  product_id: z.number().int().positive('product_id is required'),
  components: z.array(z.object({
    component_product_id: z.number().int().positive(),
    quantity: z.number().positive('Quantity must be positive'),
  })).optional().default([]),
  operations: z.array(z.object({
    operation_name: z.string().min(1).max(100),
    time_minutes: z.number().int().positive(),
    work_center: z.string().max(100).optional(),
  })).optional().default([]),
});

router.post(
  '/',
  authorize('engineering', 'admin'),
  validate({ body: createSchema }),
  bomsController.create
);

router.get(
  '/',
  authorize('engineering', 'admin', 'approver', 'operations'),
  bomsController.list
);

router.get(
  '/:id',
  authorize('engineering', 'admin', 'approver', 'operations'),
  bomsController.getById
);

router.get(
  '/:id/versions',
  authorize('engineering', 'admin', 'approver', 'operations'),
  bomsController.getVersions
);

router.get(
  '/:id/versions/:versionId/diff',
  authorize('engineering', 'admin', 'approver', 'operations'),
  bomsController.diff
);

module.exports = router;
