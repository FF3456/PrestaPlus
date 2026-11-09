import Collateral from '../models/Collateral.js';
import LoanRequest from '../models/LoanRequest.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { preEvaluate } from '../utils/loanCalculator.js';
import { escapeRegex, pageMeta, parsePagination } from '../utils/pagination.js';
import { removeFiles } from '../middlewares/upload.js';
import { COLLATERAL_STATUS, ROLES, STAFF_ROLES } from '../constants/index.js';

const isStaff = (user) => STAFF_ROLES.includes(user.role);

/** Carga una garantía y verifica que el usuario sea el dueño o personal autorizado. */
export async function loadCollateralFor(user, id) {
  const collateral = await Collateral.findById(id).populate('owner', 'firstName lastName email');
  if (!collateral) throw new AppError(404, 'Garantía no encontrada', 'NOT_FOUND');
  const ownerId = String(collateral.owner._id || collateral.owner);
  if (!isStaff(user) && ownerId !== String(user._id)) {
    throw new AppError(403, 'No tienes acceso a esta garantía', 'FORBIDDEN');
  }
  return collateral;
}

/** RF-005 · Pre-evaluación: estimación inicial del valor y del préstamo disponible. */
export const preEvaluation = asyncHandler(async (req, res) => {
  res.json({ success: true, data: preEvaluate(req.valid) });
});

/** RF-004 · Registro de garantía con fotografías (multipart/form-data). */
export const createCollateral = asyncHandler(async (req, res) => {
  const files = req.files || [];
  try {
    if (!files.length) throw new AppError(400, 'Adjunta al menos una fotografía de la garantía', 'PHOTOS_REQUIRED');

    const activeDup = await Collateral.exists({
      serialNumber: req.valid.serialNumber.toUpperCase(),
      status: { $in: [COLLATERAL_STATUS.REGISTERED, COLLATERAL_STATUS.IN_EVALUATION, COLLATERAL_STATUS.IN_CUSTODY] },
    });
    if (activeDup) throw new AppError(409, 'Ya existe una garantía activa con ese número de serie/IMEI', 'DUPLICATE_SERIAL');

    const estimate = preEvaluate(req.valid);
    const collateral = await Collateral.create({
      ...req.valid,
      owner: req.user._id,
      estimatedValue: estimate.estimatedValue,
      photos: files.map((f) => ({ url: `/uploads/${f.filename}`, filename: f.filename })),
    });
    res.status(201).json({ success: true, data: { collateral, preEvaluation: estimate } });
  } catch (err) {
    await removeFiles(files);
    throw err;
  }
});

export const listCollaterals = asyncHandler(async (req, res) => {
  const p = parsePagination(req.query);
  const filter = isStaff(req.user) ? {} : { owner: req.user._id };
  if (Object.values(COLLATERAL_STATUS).includes(req.query.status)) filter.status = req.query.status;
  if (req.query.category) filter.category = String(req.query.category);
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(String(req.query.q).slice(0, 60)), 'i');
    filter.$or = [{ brand: rx }, { model: rx }, { serialNumber: rx }];
  }
  const [items, total] = await Promise.all([
    Collateral.find(filter).populate('owner', 'firstName lastName email').sort({ createdAt: -1 }).skip(p.skip).limit(p.limit),
    Collateral.countDocuments(filter),
  ]);
  res.json({ success: true, data: items, meta: pageMeta(p, total) });
});

export const getCollateral = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await loadCollateralFor(req.user, req.params.id) });
});

/** Solo el dueño y mientras la garantía aún no fue enviada a evaluación. */
export const updateCollateral = asyncHandler(async (req, res) => {
  const collateral = await loadCollateralFor(req.user, req.params.id);
  if (req.user.role !== ROLES.CLIENT || collateral.status !== COLLATERAL_STATUS.REGISTERED) {
    throw new AppError(409, 'Solo puedes editar garantías registradas que no están en evaluación', 'INVALID_STATE');
  }
  Object.assign(collateral, req.valid);
  const estimate = preEvaluate({
    category: collateral.category,
    condition: collateral.condition,
    declaredValue: collateral.declaredValue,
  });
  collateral.estimatedValue = estimate.estimatedValue;
  await collateral.save();
  res.json({ success: true, data: collateral });
});

export const deleteCollateral = asyncHandler(async (req, res) => {
  const collateral = await loadCollateralFor(req.user, req.params.id);
  if (req.user.role !== ROLES.CLIENT || collateral.status !== COLLATERAL_STATUS.REGISTERED) {
    throw new AppError(409, 'Solo puedes eliminar garantías registradas que no están en evaluación', 'INVALID_STATE');
  }
  if (await LoanRequest.exists({ collateral: collateral._id })) {
    throw new AppError(409, 'La garantía está asociada a una solicitud', 'INVALID_STATE');
  }
  await removeFiles(collateral.photos);
  await collateral.deleteOne();
  res.status(204).send();
});
