const { Router } = require('express');
const usersController = require('./users.controller');
const auth = require('../../middleware/auth');
const authorize = require('../../middleware/authorize');

const router = Router();

router.use(auth);

router.get('/', authorize('admin'), usersController.getAll);
router.get('/:id', authorize('admin'), usersController.getById);
router.patch('/:id', authorize('admin'), usersController.update);
router.delete('/:id', authorize('admin'), usersController.remove);

module.exports = router;
