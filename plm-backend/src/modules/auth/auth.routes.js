const { Router } = require('express');
const { z } = require('zod');
const authController = require('./auth.controller');
const validate = require('../../middleware/validate');
const { authLimiter } = require('../../middleware/rateLimiter');

const router = Router();

const signupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email format').max(150),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role_id: z.number().int().min(1).max(4),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

router.post('/signup', authLimiter, validate({ body: signupSchema }), authController.signup);
router.post('/login', authLimiter, validate({ body: loginSchema }), authController.login);
router.post('/refresh', validate({ body: refreshSchema }), authController.refresh);
router.post('/logout', validate({ body: refreshSchema }), authController.logout);

module.exports = router;
