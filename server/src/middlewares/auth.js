import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import User from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const JWT_ISSUER = 'presta-plus';

export function signToken(user) {
  return jwt.sign({ sub: String(user._id), role: user.role }, env.jwtSecret, {
    algorithm: 'HS256',
    expiresIn: env.jwtExpiresIn,
    issuer: JWT_ISSUER,
  });
}

/** Autenticación: valida el encabezado `Authorization: Bearer <JWT>` y carga el usuario en req.user. */
export const authenticate = asyncHandler(async (req, res, next) => {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    throw new AppError(401, 'Token de acceso no proporcionado', 'AUTH_MISSING_TOKEN');
  }
  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'], issuer: JWT_ISSUER });
  } catch (err) {
    const expired = err.name === 'TokenExpiredError';
    throw new AppError(
      401,
      expired ? 'La sesión expiró, inicia sesión nuevamente' : 'Token inválido',
      expired ? 'AUTH_TOKEN_EXPIRED' : 'AUTH_INVALID_TOKEN',
    );
  }
  const user = await User.findById(payload.sub);
  if (!user || !user.active) throw new AppError(401, 'La cuenta no existe o fue desactivada', 'AUTH_USER_INVALID');
  req.user = user;
  next();
});
