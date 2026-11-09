import { Router } from 'express';
import { validate, EMAIL_PATTERN, PASSWORD_PATTERN, PASSWORD_MESSAGE } from '../middlewares/validate.js';
import { authenticate } from '../middlewares/auth.js';
import { authLimiter } from '../middlewares/rateLimiters.js';
import * as c from '../controllers/authController.js';

const router = Router();
const email = { required: true, max: 120, pattern: EMAIL_PATTERN, patternMessage: 'Correo electrónico inválido', label: 'Correo' };
const password = { required: true, pattern: PASSWORD_PATTERN, patternMessage: PASSWORD_MESSAGE, label: 'Contraseña' };

router.post(
  '/register',
  authLimiter,
  validate({
    firstName: { required: true, min: 2, max: 60, label: 'Nombre' },
    lastName: { required: true, min: 2, max: 60, label: 'Apellido' },
    email,
    password,
    documentId: { required: true, min: 5, max: 20, label: 'Documento de identidad' },
    phone: { pattern: /^[0-9+\-\s]{7,15}$/, patternMessage: 'Teléfono inválido', label: 'Teléfono' },
    address: { max: 200, label: 'Dirección' },
  }),
  c.register,
);
router.post('/verify-otp', authLimiter, validate({ email, code: { required: true, pattern: /^\d{6}$/, patternMessage: 'El código tiene 6 dígitos', label: 'Código' } }), c.verifyOtp);
router.post('/resend-otp', authLimiter, validate({ email }), c.resendOtp);
router.post('/login', authLimiter, validate({ email, password: { required: true, max: 72, label: 'Contraseña' } }), c.login);
router.post('/forgot-password', authLimiter, validate({ email }), c.forgotPassword);
router.post('/reset-password', authLimiter, validate({ email, token: { required: true, pattern: /^[a-f\d]{64}$/i, label: 'Token' }, password }), c.resetPassword);
router.get('/me', authenticate, c.me);

export default router;
