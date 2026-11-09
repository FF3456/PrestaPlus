import {
  CONDITION_FACTOR,
  LOAN_TO_VALUE,
  MONTHLY_RATE,
  DUE_SOON_DAYS,
} from '../constants/index.js';
import { AppError } from './AppError.js';

export const DAY_MS = 24 * 60 * 60 * 1000;
export const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
export const addDays = (date, days) => new Date(new Date(date).getTime() + days * DAY_MS);
export const daysBetween = (from, to) =>
  Math.max(0, Math.floor((new Date(to).getTime() - new Date(from).getTime()) / DAY_MS));

/** RF-005 · Estimación inicial del valor del bien y del préstamo disponible (cliente). */
export function preEvaluate({ category, condition, declaredValue }) {
  const ltv = LOAN_TO_VALUE[category];
  const factor = CONDITION_FACTOR[condition];
  if (ltv === undefined || factor === undefined) {
    throw new AppError(400, 'Categoría o estado físico no válidos', 'VALIDATION_ERROR');
  }
  const estimatedValue = round2(declaredValue * factor);
  return {
    estimatedValue,
    loanToValue: ltv,
    estimatedLoan: round2(estimatedValue * ltv),
    monthlyRate: MONTHLY_RATE[category],
  };
}

/** RF-006 · Tasación del empleado: monto máximo y tasa de interés. */
export function appraise({ category, marketValue }) {
  const ltv = LOAN_TO_VALUE[category];
  if (ltv === undefined) throw new AppError(400, 'Categoría no válida', 'VALIDATION_ERROR');
  return {
    marketValue: round2(marketValue),
    maxLoan: round2(marketValue * ltv),
    monthlyRate: MONTHLY_RATE[category],
  };
}

/** Interés devengado = capital × tasa mensual × días/30 (interés simple, base 30 días). */
export function accruedInterest({ principal, monthlyRate, from, to }) {
  const days = daysBetween(from, to);
  return round2(principal * (monthlyRate / 100) * (days / 30));
}

/** Cotización vigente de un préstamo (saldo, interés y monto de rescate). */
export function quote(loan, now = new Date()) {
  const principal = loan.outstandingPrincipal;
  const interest =
    principal > 0
      ? accruedInterest({ principal, monthlyRate: loan.monthlyRate, from: loan.interestPaidUntil, to: now })
      : 0;
  const rescued = loan.status === 'rescatado';
  const overdue = !rescued && new Date(loan.dueDate) < now;
  return {
    outstandingPrincipal: round2(principal),
    accruedInterest: interest,
    payoffAmount: round2(principal + interest),
    interestDays: daysBetween(loan.interestPaidUntil, now),
    daysToDue: Math.ceil((new Date(loan.dueDate) - now) / DAY_MS),
    isOverdue: overdue,
    isDueSoon: !rescued && !overdue && new Date(loan.dueDate) - now <= DUE_SOON_DAYS * DAY_MS,
  };
}

/**
 * RF-010 · Reglas de negocio de pagos. Función pura: recibe el estado del préstamo y la
 * operación y devuelve el nuevo estado; lanza AppError 409/422 si la operación no es válida.
 */
export function applyPayment(loan, { type, amount }, now = new Date()) {
  if (loan.status === 'rescatado') {
    throw new AppError(409, 'El préstamo ya fue rescatado', 'LOAN_ALREADY_RESCUED');
  }
  const q = quote(loan, now);
  const paid = round2(amount);
  const mismatch = (expected, label) =>
    new AppError(422, `El monto debe ser exactamente ${expected.toFixed(2)} Bs (${label})`, 'PAYMENT_AMOUNT_MISMATCH', {
      expected,
    });

  switch (type) {
    case 'pago_interes':
    case 'renovacion': {
      if (q.accruedInterest <= 0) {
        throw new AppError(422, 'No existe interés pendiente de pago', 'NO_PENDING_INTEREST');
      }
      if (Math.abs(paid - q.accruedInterest) > 0.009) throw mismatch(q.accruedInterest, 'interés devengado');
      const base = new Date(loan.dueDate) > now ? loan.dueDate : now;
      return {
        interestPortion: q.accruedInterest,
        capitalPortion: 0,
        outstandingPrincipal: q.outstandingPrincipal,
        interestPaidUntil: now,
        dueDate: type === 'renovacion' ? addDays(base, loan.termDays) : loan.dueDate,
        status: type === 'renovacion' ? 'activo' : loan.status,
        rescued: false,
      };
    }
    case 'abono_capital': {
      if (paid <= q.accruedInterest) {
        throw new AppError(
          422,
          `El abono debe superar el interés devengado (${q.accruedInterest.toFixed(2)} Bs); se aplica primero al interés`,
          'PAYMENT_BELOW_INTEREST',
          { accruedInterest: q.accruedInterest },
        );
      }
      const capital = round2(paid - q.accruedInterest);
      if (capital >= q.outstandingPrincipal) {
        throw new AppError(422, 'El abono liquida el capital: utilice la operación de rescate', 'USE_RESCUE', {
          payoffAmount: q.payoffAmount,
        });
      }
      return {
        interestPortion: q.accruedInterest,
        capitalPortion: capital,
        outstandingPrincipal: round2(q.outstandingPrincipal - capital),
        interestPaidUntil: now,
        dueDate: loan.dueDate,
        status: loan.status,
        rescued: false,
      };
    }
    case 'rescate': {
      if (Math.abs(paid - q.payoffAmount) > 0.009) throw mismatch(q.payoffAmount, 'capital + interés devengado');
      return {
        interestPortion: q.accruedInterest,
        capitalPortion: q.outstandingPrincipal,
        outstandingPrincipal: 0,
        interestPaidUntil: now,
        dueDate: loan.dueDate,
        status: 'rescatado',
        rescued: true,
      };
    }
    default:
      throw new AppError(400, 'Tipo de operación no válido', 'VALIDATION_ERROR');
  }
}
