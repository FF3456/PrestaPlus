import { AppError } from '../utils/AppError.js';

/** RBAC (RF-002): permite el acceso solo a los roles indicados. Debe ir después de `authenticate`. */
export const authorize =
  (...allowedRoles) =>
  (req, res, next) => {
    if (!req.user) return next(new AppError(401, 'Autenticación requerida', 'AUTH_REQUIRED'));
    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError(403, 'No tienes permisos para realizar esta acción', 'FORBIDDEN'));
    }
    return next();
  };
