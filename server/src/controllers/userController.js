import User from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { escapeRegex, pageMeta, parsePagination } from '../utils/pagination.js';
import { ROLES } from '../constants/index.js';

/** RF-014 · Actualizar perfil (lista blanca: no permite cambiar correo ni rol). */
export const updateMe = asyncHandler(async (req, res) => {
  Object.assign(req.user, req.valid);
  await req.user.save();
  res.json({ success: true, data: req.user.toJSON() });
});

/** RF-014 · Cambio de contraseña (requiere la actual). */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.valid;
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword))) {
    throw new AppError(401, 'La contraseña actual es incorrecta', 'INVALID_CREDENTIALS');
  }
  if (currentPassword === newPassword) throw new AppError(422, 'La nueva contraseña debe ser distinta', 'PASSWORD_REUSED');
  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: 'Contraseña actualizada' });
});

/** Administración · Listado de usuarios con filtros. */
export const listUsers = asyncHandler(async (req, res) => {
  const p = parsePagination(req.query);
  const filter = {};
  if (Object.values(ROLES).includes(req.query.role)) filter.role = req.query.role;
  if (req.query.active === 'true' || req.query.active === 'false') filter.active = req.query.active === 'true';
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(String(req.query.q).slice(0, 60)), 'i');
    filter.$or = [{ firstName: rx }, { lastName: rx }, { email: rx }];
  }
  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(p.skip).limit(p.limit),
    User.countDocuments(filter),
  ]);
  res.json({ success: true, data: items.map((u) => u.toJSON()), meta: pageMeta(p, total) });
});

/** Administración · Alta de empleados/administradores (cuentas verificadas de origen). */
export const createStaff = asyncHandler(async (req, res) => {
  const exists = await User.exists({ email: req.valid.email });
  if (exists) throw new AppError(409, 'Ya existe una cuenta con ese correo', 'EMAIL_TAKEN');
  const user = await User.create({ ...req.valid, isVerified: true });
  res.status(201).json({ success: true, data: user.toJSON() });
});

export const setUserActive = asyncHandler(async (req, res) => {
  if (String(req.user._id) === req.params.id) {
    throw new AppError(422, 'No puedes desactivar tu propia cuenta', 'SELF_DEACTIVATION');
  }
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError(404, 'Usuario no encontrado', 'NOT_FOUND');
  user.active = req.valid.active;
  await user.save();
  res.json({ success: true, data: user.toJSON() });
});
