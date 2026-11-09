import { Router } from 'express';
import mongoose from 'mongoose';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import collateralRoutes from './collateralRoutes.js';
import loanRequestRoutes from './loanRequestRoutes.js';
import loanRoutes from './loanRoutes.js';
import paymentRoutes from './paymentRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';

const router = Router();

router.get('/health', (req, res) =>
  res.json({
    success: true,
    data: { status: 'ok', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected', uptime: process.uptime() },
  }),
);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/collaterals', collateralRoutes);
router.use('/loan-requests', loanRequestRoutes);
router.use('/loans', loanRoutes);
router.use('/payments', paymentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
