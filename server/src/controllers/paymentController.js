import Payment from '../models/Payment.js';
import Loan from '../models/Loan.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { pageMeta, parsePagination } from '../utils/pagination.js';
import { PAYMENT_TYPES, STAFF_ROLES } from '../constants/index.js';

const isStaff = (user) => STAFF_ROLES.includes(user.role);
const populatePayment = (q) =>
  q
    .populate({ path: 'loan', select: 'contractNumber client collateral', populate: { path: 'collateral', select: 'brand model' } })
    .populate('registeredBy', 'firstName lastName');

/** Registro de pagos: staff ve todos; el cliente solo los de sus préstamos. */
export const listPayments = asyncHandler(async (req, res) => {
  const p = parsePagination(req.query);
  const filter = {};
  if (PAYMENT_TYPES.includes(req.query.type)) filter.type = req.query.type;
  if (!isStaff(req.user)) {
    const ids = await Loan.find({ client: req.user._id }).distinct('_id');
    filter.loan = { $in: ids };
  }
  const [items, total] = await Promise.all([
    populatePayment(Payment.find(filter).sort({ paidAt: -1 }).skip(p.skip).limit(p.limit)),
    Payment.countDocuments(filter),
  ]);
  res.json({ success: true, data: items, meta: pageMeta(p, total) });
});

/** RF-010 · Comprobante digital de un pago. */
export const getReceipt = asyncHandler(async (req, res) => {
  const payment = await populatePayment(Payment.findById(req.params.id));
  if (!payment) throw new AppError(404, 'Comprobante no encontrado', 'NOT_FOUND');
  if (!isStaff(req.user) && String(payment.loan.client) !== String(req.user._id)) {
    throw new AppError(403, 'No tienes acceso a este comprobante', 'FORBIDDEN');
  }
  res.json({ success: true, data: payment });
});
