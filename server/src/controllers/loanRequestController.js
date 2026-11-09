import LoanRequest from '../models/LoanRequest.js';
import Collateral from '../models/Collateral.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { appraise, preEvaluate } from '../utils/loanCalculator.js';
import { pageMeta, parsePagination } from '../utils/pagination.js';
import { notify } from '../utils/notify.js';
import { approveRequest } from '../services/loanService.js';
import { COLLATERAL_STATUS, REQUEST_STATUS, STAFF_ROLES } from '../constants/index.js';

const isStaff = (user) => STAFF_ROLES.includes(user.role);
const populateAll = (q) =>
  q
    .populate('client', 'firstName lastName email phone')
    .populate('collateral')
    .populate('loan', 'contractNumber status dueDate');

async function loadRequestFor(user, id) {
  const request = await populateAll(LoanRequest.findById(id));
  if (!request) throw new AppError(404, 'Solicitud no encontrada', 'NOT_FOUND');
  if (!isStaff(user) && String(request.client._id) !== String(user._id)) {
    throw new AppError(403, 'No tienes acceso a esta solicitud', 'FORBIDDEN');
  }
  return request;
}

/** CU-02 / RF-004-005 · El cliente envía la solicitud para una garantía ya registrada. */
export const createRequest = asyncHandler(async (req, res) => {
  const { collateralId, requestedAmount, termDays } = req.valid;
  const collateral = await Collateral.findById(collateralId);
  if (!collateral || String(collateral.owner) !== String(req.user._id)) {
    throw new AppError(404, 'Garantía no encontrada', 'NOT_FOUND');
  }
  if (collateral.status !== COLLATERAL_STATUS.REGISTERED) {
    throw new AppError(409, 'La garantía ya fue enviada a evaluación', 'INVALID_STATE');
  }
  const estimate = preEvaluate({
    category: collateral.category,
    condition: collateral.condition,
    declaredValue: collateral.declaredValue,
  });
  if (requestedAmount > estimate.estimatedLoan) {
    throw new AppError(422, `El monto solicitado excede el préstamo estimado (${estimate.estimatedLoan.toFixed(2)} Bs)`, 'AMOUNT_EXCEEDS_ESTIMATE', {
      estimatedLoan: estimate.estimatedLoan,
    });
  }
  const request = await LoanRequest.create({
    client: req.user._id,
    collateral: collateral._id,
    requestedAmount,
    ...(termDays ? { termDays } : {}),
    preEvaluation: {
      estimatedValue: estimate.estimatedValue,
      estimatedLoan: estimate.estimatedLoan,
      monthlyRate: estimate.monthlyRate,
    },
  });
  collateral.status = COLLATERAL_STATUS.IN_EVALUATION;
  await collateral.save();
  res.status(201).json({ success: true, data: await populateAll(LoanRequest.findById(request._id)) });
});

export const listRequests = asyncHandler(async (req, res) => {
  const p = parsePagination(req.query);
  const filter = isStaff(req.user) ? {} : { client: req.user._id };
  if (Object.values(REQUEST_STATUS).includes(req.query.status)) filter.status = req.query.status;
  const [items, total] = await Promise.all([
    populateAll(LoanRequest.find(filter).sort({ createdAt: -1 }).skip(p.skip).limit(p.limit)),
    LoanRequest.countDocuments(filter),
  ]);
  res.json({ success: true, data: items, meta: pageMeta(p, total) });
});

export const getRequest = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await loadRequestFor(req.user, req.params.id) });
});

/** RF-006 · Tasación: valor de mercado → monto máximo y tasa de interés. */
export const appraiseRequest = asyncHandler(async (req, res) => {
  const request = await loadRequestFor(req.user, req.params.id);
  if (request.status !== REQUEST_STATUS.IN_EVALUATION) {
    throw new AppError(409, 'Solo se pueden tasar solicitudes en evaluación', 'INVALID_STATE');
  }
  const result = appraise({ category: request.collateral.category, marketValue: req.valid.marketValue });
  request.appraisal = { ...result, appraisedBy: req.user._id, appraisedAt: new Date() };
  await request.save();
  await Collateral.findByIdAndUpdate(request.collateral._id, { appraisedValue: result.marketValue });
  res.json({ success: true, data: await loadRequestFor(req.user, req.params.id) });
});

/** RF-007/008 · Aprobación: crea préstamo + contrato, garantía en custodia y notifica al cliente. */
export const approve = asyncHandler(async (req, res) => {
  const request = await loadRequestFor(req.user, req.params.id);
  if (request.status !== REQUEST_STATUS.IN_EVALUATION) {
    throw new AppError(409, 'La solicitud ya fue resuelta', 'INVALID_STATE');
  }
  const collateral = await Collateral.findById(request.collateral._id);
  const loan = await approveRequest({
    request,
    collateral,
    client: request.client,
    employee: req.user,
    approvedAmount: req.valid.approvedAmount,
    termDays: req.valid.termDays,
    custodyLocation: req.valid.custodyLocation,
  });
  res.json({ success: true, data: { request: await loadRequestFor(req.user, req.params.id), loan } });
});

/** RF-007 · Rechazo con motivo obligatorio. */
export const reject = asyncHandler(async (req, res) => {
  const request = await loadRequestFor(req.user, req.params.id);
  if (request.status !== REQUEST_STATUS.IN_EVALUATION) {
    throw new AppError(409, 'La solicitud ya fue resuelta', 'INVALID_STATE');
  }
  request.status = REQUEST_STATUS.REJECTED;
  request.rejectionReason = req.valid.reason;
  request.reviewedBy = req.user._id;
  request.reviewedAt = new Date();
  await request.save();
  await Collateral.findByIdAndUpdate(request.collateral._id, { status: COLLATERAL_STATUS.REJECTED });
  await notify(request.client._id, {
    type: 'solicitud_rechazada',
    title: 'Solicitud rechazada',
    message: `Tu solicitud fue rechazada: ${req.valid.reason}`,
    request: request._id,
  });
  res.json({ success: true, data: await loadRequestFor(req.user, req.params.id) });
});
