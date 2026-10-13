import { Router } from 'express';
import mongoose from 'mongoose';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({
    success: true,
    status: 'ok',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// TODO: router.use('/auth', authRoutes);
// TODO: router.use('/users', userRoutes);
// TODO: router.use('/leaves', leaveRoutes);

export default router;
