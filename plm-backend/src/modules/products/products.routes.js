const { Router } = require('express');
const { z } = require('zod');
const productsController = require('./products.controller');
const auth = require('../../middleware/auth');
const authorize = require('../../middleware/authorize');
const validate = require('../../middleware/validate');

const router = Router();

router.use(auth);

const createSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255),
  sale_price: z.number().positive().optional().nullable(),
  cost_price: z.number().positive().optional().nullable(),
  attachments: z.string().optional().nullable(),
});

router.post(
  '/',
  authorize('engineering', 'admin'),
  validate({ body: createSchema }),
  productsController.create
);

router.get(
  '/',
  authorize('engineering', 'admin', 'approver', 'operations'),
  productsController.list
);

router.get(
  '/:id',
  authorize('engineering', 'admin', 'approver', 'operations'),
  productsController.getById
);

router.get(
  '/:id/versions',
  authorize('engineering', 'admin', 'approver', 'operations'),
  productsController.getVersions
);

router.patch(
  '/:id',
  authorize('engineering', 'admin'),
  productsController.update
);

router.patch(
  '/:id/archive',
  authorize('admin'),
  productsController.archive
);

module.exports = router;
