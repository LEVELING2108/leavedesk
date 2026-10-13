import { Router } from 'express';
import mongoose from 'mongoose';
import authRoutes from './auth.js';
import leaveRoutes from './leaves.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({
    success: true,
    status: 'ok',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

router.use('/auth', authRoutes);
// TODO: router.use('/users', userRoutes);
router.use('/leaves', leaveRoutes);

export default router;
