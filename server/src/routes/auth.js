import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { registerSchema, loginSchema } from '../validators/auth.js';
import * as auth from '../controllers/authController.js';

const router = Router();

// Brute-force protection on credential endpoints; disabled under tests so suites can log in freely
const credentialLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: () => env.nodeEnv === 'test',
  message: { success: false, message: 'Too many attempts, please try again in 15 minutes' },
});

router.post('/register', credentialLimiter, validate({ body: registerSchema }), auth.register);
router.post('/login', credentialLimiter, validate({ body: loginSchema }), auth.login);
router.post('/refresh', auth.refresh);
router.post('/logout', auth.logout);
router.get('/me', authenticate, auth.me);

export default router;
