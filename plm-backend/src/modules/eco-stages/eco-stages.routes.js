const { Router } = require('express');
const { z } = require('zod');
const stagesController = require('./eco-stages.controller');
const auth = require('../../middleware/auth');
const authorize = require('../../middleware/authorize');
const validate = require('../../middleware/validate');

const router = Router();

router.use(auth);

const createSchema = z.object({
  name: z.string().min(1).max(50),
  sequence: z.number().int().positive(),
  requires_approval: z.boolean().optional().default(false),
});

const updateSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  sequence: z.number().int().positive().optional(),
  requires_approval: z.boolean().optional(),
});

router.post('/', authorize('admin'), validate({ body: createSchema }), stagesController.create);
router.get('/', authorize('admin', 'engineering', 'approver', 'operations'), stagesController.getAll);
router.patch('/:id', authorize('admin'), validate({ body: updateSchema }), stagesController.update);
router.delete('/:id', authorize('admin'), stagesController.remove);

module.exports = router;
