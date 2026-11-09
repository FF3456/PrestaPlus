import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

const handler = (req, res) =>
  res.status(429).json({ success: false, message: 'Demasiadas solicitudes, intenta más tarde', code: 'RATE_LIMITED' });

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

/** Límite estricto para login, OTP y recuperación (mitiga fuerza bruta). */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.authRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});
