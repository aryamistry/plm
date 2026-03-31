const { Router } = require('express');
const { z } = require('zod');
const ecosController = require('./ecos.controller');
const auth = require('../../middleware/auth');
const authorize = require('../../middleware/authorize');
const validate = require('../../middleware/validate');

const router = Router();

router.use(auth);

const createSchema = z.object({
  title: z.string().min(1).max(255),
  type: z.enum(['PRODUCT', 'BOM']),
  product_id: z.number().int().positive(),
  bom_id: z.number().int().positive().optional().nullable(),
  effective_date: z.string().optional().nullable().refine(
    (val) => !val || new Date(val) >= new Date(new Date().toDateString()),
    { message: 'Effective date cannot be in the past' }
  ),
  version_update: z.boolean().optional().default(true),
});

router.post(
  '/',
  authorize('engineering', 'admin'),
  validate({ body: createSchema }),
  ecosController.create
);

router.get(
  '/',
  authorize('engineering', 'admin', 'approver', 'operations'),
  ecosController.list
);

router.get(
  '/:id',
  authorize('engineering', 'admin', 'approver', 'operations'),
  ecosController.getById
);

router.post(
  '/:id/changes',
  authorize('engineering', 'admin'),
  ecosController.proposeChanges
);

router.get(
  '/:id/diff',
  authorize('engineering', 'admin', 'approver', 'operations'),
  ecosController.getDiff
);

router.post(
  '/:id/submit',
  authorize('engineering', 'admin'),
  ecosController.submit
);

router.post(
  '/:id/validate',
  authorize('approver', 'admin'),
  ecosController.validate
);

router.delete(
  '/:id',
  authorize('engineering', 'admin'),
  ecosController.remove
);

module.exports = router;
