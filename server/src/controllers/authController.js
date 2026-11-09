import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { env } from '../config/env.js';
import { signToken } from '../middlewares/auth.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { randomOtp, randomToken, sha256 } from '../utils/crypto.js';
import { sendMail } from '../utils/mailer.js';
import { ROLES } from '../constants/index.js';

const minutes = (n) => new Date(Date.now() + n * 60 * 1000);
// Hash ficticio para igualar tiempos de respuesta cuando el correo no existe (evita enumeración por timing)
const DUMMY_HASH = '$2a$10$CwTycUXWue0Thq9StjUM0uJ8.QY5nJm3xVjR0cUq1QY4oQ4h4w9yK';

const authPayload = (user) => ({
  token: signToken(user),
  tokenType: 'Bearer',
  expiresIn: env.jwtExpiresIn,
  user: user.toJSON(),
});

async function issueOtp(user) {
  const code = randomOtp();
  user.otpHash = sha256(`${user.email}:${code}`);
  user.otpExpiresAt = minutes(env.otpTtlMinutes);
  user.otpAttempts = 0;
  await user.save();
  try {
    await sendMail({
      to: user.email,
      subject: 'PRESTA+ · Código de verificación',
      text: `Hola ${user.firstName}, tu código de verificación es ${code}. Vence en ${env.otpTtlMinutes} minutos.`,
    });
  } catch (err) {
    console.error('[mail] no se pudo enviar el OTP:', err.message);
  }
  return code;
}

/** RF-001 · Registro de cliente + envío de OTP al correo. */
export const register = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, documentId, phone, address } = req.valid;
  const existing = await User.findOne({ email });
  if (existing?.isVerified) throw new AppError(409, 'Ya existe una cuenta con ese correo', 'EMAIL_TAKEN');

  let user = existing;
  if (user) {
    // Registro previo sin verificar: se actualiza y se reenvía el OTP
    Object.assign(user, { firstName, lastName, password, documentId, phone, address });
  } else {
    user = new User({ firstName, lastName, email, password, documentId, phone, address, role: ROLES.CLIENT });
  }
  const code = await issueOtp(user);

  res.status(201).json({
    success: true,
    message: 'Cuenta creada. Ingresa el código OTP enviado a tu correo para verificarla.',
    data: { email: user.email, ...(env.exposeDevCodes ? { devOtp: code } : {}) },
  });
});

/** RF-001 · Verificación del OTP; al validar, inicia sesión automáticamente. */
export const verifyOtp = asyncHandler(async (req, res) => {
  const { email, code } = req.valid;
  const user = await User.findOne({ email }).select('+otpHash +otpExpiresAt +otpAttempts');
  const invalid = new AppError(400, 'Código inválido o vencido', 'OTP_INVALID');
  if (!user || !user.otpHash) throw invalid;
  if (user.otpAttempts >= 5) throw new AppError(429, 'Demasiados intentos. Solicita un nuevo código', 'OTP_LOCKED');
  if (user.otpExpiresAt < new Date() || user.otpHash !== sha256(`${user.email}:${code}`)) {
    user.otpAttempts += 1;
    await user.save();
    throw invalid;
  }
  user.isVerified = true;
  user.otpHash = undefined;
  user.otpExpiresAt = undefined;
  user.otpAttempts = 0;
  user.lastLoginAt = new Date();
  await user.save();
  res.json({ success: true, message: 'Cuenta verificada', data: authPayload(user) });
});

export const resendOtp = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.valid.email });
  let code;
  if (user && !user.isVerified) code = await issueOtp(user);
  res.json({
    success: true,
    message: 'Si el correo está pendiente de verificación, enviamos un nuevo código.',
    ...(env.exposeDevCodes && code ? { data: { devOtp: code } } : {}),
  });
});

/** RF-002 · Inicio de sesión: devuelve JWT firmado (HS256) con expiración configurable. */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.valid;
  const user = await User.findOne({ email }).select('+password');
  const ok = user ? await user.comparePassword(password) : await bcrypt.compare(password, DUMMY_HASH);
  if (!user || !ok) throw new AppError(401, 'Correo o contraseña incorrectos', 'INVALID_CREDENTIALS');
  if (!user.isVerified) throw new AppError(403, 'Debes verificar tu correo con el código OTP', 'ACCOUNT_NOT_VERIFIED');
  if (!user.active) throw new AppError(403, 'Tu cuenta está desactivada', 'ACCOUNT_DISABLED');

  user.lastLoginAt = new Date();
  await user.save();
  res.json({ success: true, data: authPayload(user) });
});

/** RF-003 · Solicitud de restablecimiento (respuesta idéntica exista o no el correo). */
export const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.valid.email });
  let token;
  if (user && user.active) {
    token = randomToken(32);
    user.resetTokenHash = sha256(token);
    user.resetTokenExpiresAt = minutes(env.resetTtlMinutes);
    await user.save();
    const link = `${env.clientUrls[0]}/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;
    try {
      await sendMail({
        to: user.email,
        subject: 'PRESTA+ · Restablecer contraseña',
        text: `Para restablecer tu contraseña ingresa a: ${link}\nEl enlace vence en ${env.resetTtlMinutes} minutos.`,
      });
    } catch (err) {
      console.error('[mail] no se pudo enviar el enlace:', err.message);
    }
  }
  res.json({
    success: true,
    message: 'Si el correo existe, recibirás instrucciones para restablecer tu contraseña.',
    ...(env.exposeDevCodes && token ? { data: { devResetToken: token } } : {}),
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { email, token, password } = req.valid;
  const user = await User.findOne({ email, resetTokenHash: sha256(token), resetTokenExpiresAt: { $gt: new Date() } }).select(
    '+resetTokenHash +resetTokenExpiresAt',
  );
  if (!user) throw new AppError(400, 'El enlace es inválido o venció', 'RESET_TOKEN_INVALID');
  user.password = password;
  user.resetTokenHash = undefined;
  user.resetTokenExpiresAt = undefined;
  await user.save();
  res.json({ success: true, message: 'Contraseña actualizada. Ya puedes iniciar sesión.' });
});

/** RF-002/014 · Sesión activa: datos del usuario autenticado. */
export const me = (req, res) => res.json({ success: true, data: req.user.toJSON() });
