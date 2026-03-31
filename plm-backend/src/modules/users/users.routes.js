const { Router } = require('express');
const { z } = require('zod');
const usersController = require('./users.controller');
const auth = require('../../middleware/auth');
const authorize = require('../../middleware/authorize');
const validate = require('../../middleware/validate');

const router = Router();

router.use(auth);

router.get('/', authorize('admin'), usersController.getAll);
router.get('/:id', authorize('admin'), usersController.getById);
router.patch('/:id', authorize('admin'), usersController.update);
router.patch(
  '/:id/role',
  authorize('admin'),
  validate({ body: z.object({ role_id: z.number().int().min(1).max(4) }) }),
  usersController.updateRole
);
router.delete('/:id', authorize('admin'), usersController.remove);

module.exports = router;
