import Loan from '../models/Loan.js';
import LoanRequest from '../models/LoanRequest.js';
import Payment from '../models/Payment.js';
import Notification from '../models/Notification.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { quote, DAY_MS } from '../utils/loanCalculator.js';
import { syncLoanStatuses } from '../services/loanService.js';
import { DUE_SOON_DAYS, LOAN_STATUS, REQUEST_STATUS } from '../constants/index.js';

/** RF-013 · Resumen del panel administrativo. */
export const staffSummary = asyncHandler(async (req, res) => {
  await syncLoanStatuses();
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const open = [LOAN_STATUS.ACTIVE, LOAN_STATUS.OVERDUE];

  const [pending, active, overdue, dueSoon, portfolio, today, month, recentRequests] = await Promise.all([
    LoanRequest.countDocuments({ status: REQUEST_STATUS.IN_EVALUATION }),
    Loan.countDocuments({ status: LOAN_STATUS.ACTIVE }),
    Loan.countDocuments({ status: LOAN_STATUS.OVERDUE }),
    Loan.countDocuments({ status: LOAN_STATUS.ACTIVE, dueDate: { $gte: now, $lte: new Date(now.getTime() + DUE_SOON_DAYS * DAY_MS) } }),
    Loan.aggregate([{ $match: { status: { $in: open } } }, { $group: { _id: null, total: { $sum: '$outstandingPrincipal' } } }]),
    Payment.aggregate([{ $match: { paidAt: { $gte: startOfDay } } }, { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }]),
    Payment.aggregate([{ $match: { paidAt: { $gte: startOfMonth } } }, { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }]),
    LoanRequest.find({ status: REQUEST_STATUS.IN_EVALUATION })
      .sort({ createdAt: 1 })
      .limit(5)
      .populate('client', 'firstName lastName')
      .populate('collateral', 'brand model category'),
  ]);

  res.json({
    success: true,
    data: {
      pendingRequests: pending,
      activeLoans: active,
      overdueLoans: overdue,
      dueSoonLoans: dueSoon,
      custodyCount: active + overdue,
      portfolioOutstanding: portfolio[0]?.total || 0,
      paymentsToday: { total: today[0]?.total || 0, count: today[0]?.count || 0 },
      paymentsMonth: { total: month[0]?.total || 0, count: month[0]?.count || 0 },
      oldestPendingRequests: recentRequests,
    },
  });
});

/** Resumen del portal del cliente. */
export const clientSummary = asyncHandler(async (req, res) => {
  await syncLoanStatuses();
  const loans = await Loan.find({ client: req.user._id, status: { $in: [LOAN_STATUS.ACTIVE, LOAN_STATUS.OVERDUE] } })
    .sort({ dueDate: 1 })
    .populate('collateral', 'brand model');
  const [pending, unread] = await Promise.all([
    LoanRequest.countDocuments({ client: req.user._id, status: REQUEST_STATUS.IN_EVALUATION }),
    Notification.countDocuments({ user: req.user._id, read: false }),
  ]);
  const quotes = loans.map((l) => quote(l));
  res.json({
    success: true,
    data: {
      activeLoans: loans.length,
      totalOutstanding: loans.reduce((s, l) => s + l.outstandingPrincipal, 0),
      totalPayoff: quotes.reduce((s, q) => s + q.payoffAmount, 0),
      overdueLoans: loans.filter((l) => l.status === LOAN_STATUS.OVERDUE).length,
      pendingRequests: pending,
      unreadNotifications: unread,
      nextDue: loans[0] ? { id: String(loans[0]._id), contractNumber: loans[0].contractNumber, dueDate: loans[0].dueDate, item: `${loans[0].collateral.brand} ${loans[0].collateral.model}` } : null,
    },
  });
});
