import Loan from '../models/Loan.js';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { quote } from '../utils/loanCalculator.js';
import { maskDocument } from '../utils/crypto.js';
import { escapeRegex, pageMeta, parsePagination } from '../utils/pagination.js';
import { registerPayment, syncLoanStatuses } from '../services/loanService.js';
import { DUE_SOON_DAYS, LOAN_STATUS, STAFF_ROLES } from '../constants/index.js';
import { DAY_MS } from '../utils/loanCalculator.js';

const isStaff = (user) => STAFF_ROLES.includes(user.role);
const populateLoan = (q) =>
  q
    .populate('client', 'firstName lastName email phone')
    .populate('collateral', 'category brand model serialNumber condition photos status custodyLocation appraisedValue');

async function loadLoanFor(user, id) {
  const loan = await populateLoan(Loan.findById(id));
  if (!loan) throw new AppError(404, 'Préstamo no encontrado', 'NOT_FOUND');
  if (!isStaff(user) && String(loan.client._id) !== String(user._id)) {
    throw new AppError(403, 'No tienes acceso a este préstamo', 'FORBIDDEN');
  }
  return loan;
}

const withQuote = (loan) => ({ ...loan.toJSON(), quote: quote(loan) });

/** RF-009/011 · Listado con filtros: estado, por vencer, vencidos, búsqueda por contrato. */
export const listLoans = asyncHandler(async (req, res) => {
  await syncLoanStatuses();
  const p = parsePagination(req.query);
  const filter = isStaff(req.user) ? {} : { client: req.user._id };
  if (Object.values(LOAN_STATUS).includes(req.query.status)) filter.status = req.query.status;
  if (req.query.dueSoon === 'true') {
    filter.status = LOAN_STATUS.ACTIVE;
    filter.dueDate = { $gte: new Date(), $lte: new Date(Date.now() + DUE_SOON_DAYS * DAY_MS) };
  }
  if (req.query.q) filter.contractNumber = new RegExp(escapeRegex(String(req.query.q).slice(0, 30)), 'i');
  const sort = req.query.dueSoon === 'true' || req.query.status === LOAN_STATUS.OVERDUE ? { dueDate: 1 } : { createdAt: -1 };
  const [items, total] = await Promise.all([
    populateLoan(Loan.find(filter).sort(sort).skip(p.skip).limit(p.limit)),
    Loan.countDocuments(filter),
  ]);
  res.json({ success: true, data: items.map(withQuote), meta: pageMeta(p, total) });
});

/** RF-011 · Garantías en custodia (préstamos activos o vencidos). */
export const custody = asyncHandler(async (req, res) => {
  await syncLoanStatuses();
  const p = parsePagination(req.query);
  const filter = { status: { $in: [LOAN_STATUS.ACTIVE, LOAN_STATUS.OVERDUE] } };
  const [items, total] = await Promise.all([
    populateLoan(Loan.find(filter).sort({ dueDate: 1 }).skip(p.skip).limit(p.limit)),
    Loan.countDocuments(filter),
  ]);
  res.json({ success: true, data: items.map(withQuote), meta: pageMeta(p, total) });
});

export const getLoan = asyncHandler(async (req, res) => {
  res.json({ success: true, data: withQuote(await loadLoanFor(req.user, req.params.id)) });
});

export const getQuote = asyncHandler(async (req, res) => {
  res.json({ success: true, data: quote(await loadLoanFor(req.user, req.params.id)) });
});

/** RF-008 · Contrato digital (documento de identidad enmascarado). */
export const getContract = asyncHandler(async (req, res) => {
  const loan = await loadLoanFor(req.user, req.params.id);
  const clientDoc = await User.findById(loan.client._id); // documentId se descifra (AES-256-GCM) solo aquí
  res.json({
    success: true,
    data: {
      contractNumber: loan.contractNumber,
      generatedAt: loan.contract.generatedAt,
      client: {
        name: `${loan.client.firstName} ${loan.client.lastName}`,
        email: loan.client.email,
        documentId: maskDocument(clientDoc?.documentId),
      },
      collateral: {
        category: loan.collateral.category,
        brand: loan.collateral.brand,
        model: loan.collateral.model,
        serialNumber: loan.collateral.serialNumber,
        condition: loan.collateral.condition,
      },
      terms: {
        principal: loan.principal,
        monthlyRate: loan.monthlyRate,
        termDays: loan.termDays,
        startDate: loan.startDate,
        dueDate: loan.dueDate,
      },
      clauses: loan.contract.clauses,
    },
  });
});

/** RF-010 · Registro de pago / renovación / rescate (solo personal). */
export const createPayment = asyncHandler(async (req, res) => {
  const loan = await Loan.findById(req.params.id);
  if (!loan) throw new AppError(404, 'Préstamo no encontrado', 'NOT_FOUND');
  const payment = await registerPayment({
    loan,
    type: req.valid.type,
    amount: req.valid.amount,
    note: req.valid.note,
    employee: req.user,
  });
  res.status(201).json({ success: true, data: { payment, loan: withQuote(await populateLoan(Loan.findById(loan._id))) } });
});

export const listLoanPayments = asyncHandler(async (req, res) => {
  const loan = await loadLoanFor(req.user, req.params.id);
  const payments = await Payment.find({ loan: loan._id }).sort({ paidAt: -1 }).populate('registeredBy', 'firstName lastName');
  res.json({ success: true, data: payments });
});
