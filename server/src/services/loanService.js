import Loan from '../models/Loan.js';
import Payment from '../models/Payment.js';
import Collateral from '../models/Collateral.js';
import LoanRequest from '../models/LoanRequest.js';
import { COLLATERAL_STATUS, LOAN_STATUS, REQUEST_STATUS, DUE_SOON_DAYS } from '../constants/index.js';
import { addDays, applyPayment, round2, DAY_MS } from '../utils/loanCalculator.js';
import { nextNumber } from '../utils/sequence.js';
import { notify } from '../utils/notify.js';
import { AppError } from '../utils/AppError.js';

const bs = (n) => `${Number(n).toFixed(2)} Bs`;
const fmtDate = (d) => new Date(d).toLocaleDateString('es-BO');

/** RF-008 · Cláusulas del contrato digital generadas al aprobar el préstamo. */
export function buildClauses({ client, collateral, principal, monthlyRate, termDays, startDate, dueDate }) {
  return [
    `PRIMERA (Objeto): PRESTA+ otorga a ${client.firstName} ${client.lastName} un préstamo prendario de ${bs(principal)}, garantizado con el bien ${collateral.brand} ${collateral.model} (serie/IMEI ${collateral.serialNumber}).`,
    `SEGUNDA (Plazo): El préstamo se desembolsa el ${fmtDate(startDate)} y vence el ${fmtDate(dueDate)} (${termDays} días), renovable mediante el pago de los intereses devengados.`,
    `TERCERA (Interés): Se pacta una tasa de interés simple del ${monthlyRate}% mensual sobre el saldo de capital, calculada por día (base 30 días).`,
    'CUARTA (Custodia): El bien queda en custodia de PRESTA+ hasta la cancelación total del préstamo, momento en el que será devuelto (rescate).',
    'QUINTA (Pagos): El cliente puede realizar abonos a capital, pagar intereses o renovar, y liquidar el préstamo para rescatar su garantía. Cada operación genera un comprobante digital.',
    'SEXTA (Incumplimiento): Vencido el plazo sin pago ni renovación, el préstamo se considera vencido y PRESTA+ podrá disponer del bien conforme a la normativa aplicable.',
  ];
}

/** RF-007/008 · Aprueba una solicitud: crea el préstamo y contrato, pone la garantía en custodia y notifica. */
export async function approveRequest({ request, collateral, client, employee, approvedAmount, termDays, custodyLocation }) {
  const { appraisal } = request;
  if (!appraisal || appraisal.maxLoan === undefined) {
    throw new AppError(409, 'Debe registrar la tasación antes de aprobar', 'APPRAISAL_REQUIRED');
  }
  if (approvedAmount > appraisal.maxLoan) {
    throw new AppError(422, `El monto aprobado excede el máximo permitido (${bs(appraisal.maxLoan)})`, 'AMOUNT_EXCEEDS_MAX', {
      maxLoan: appraisal.maxLoan,
    });
  }
  const days = termDays || request.termDays;
  const startDate = new Date();
  const dueDate = addDays(startDate, days);
  const contractNumber = await nextNumber('PRE', startDate);
  const principal = round2(approvedAmount);

  const loan = await Loan.create({
    contractNumber,
    client: client._id,
    collateral: collateral._id,
    request: request._id,
    principal,
    outstandingPrincipal: principal,
    monthlyRate: appraisal.monthlyRate,
    termDays: days,
    startDate,
    dueDate,
    interestPaidUntil: startDate,
    contract: {
      generatedAt: startDate,
      clauses: buildClauses({ client, collateral, principal, monthlyRate: appraisal.monthlyRate, termDays: days, startDate, dueDate }),
    },
  });

  request.status = REQUEST_STATUS.APPROVED;
  request.approvedAmount = principal;
  request.termDays = days;
  request.reviewedBy = employee._id;
  request.reviewedAt = startDate;
  request.loan = loan._id;
  await request.save();

  collateral.status = COLLATERAL_STATUS.IN_CUSTODY;
  if (custodyLocation) collateral.custodyLocation = custodyLocation;
  await collateral.save();

  await notify(client._id, {
    type: 'solicitud_aprobada',
    title: 'Solicitud aprobada',
    message: `Tu préstamo de ${bs(principal)} fue aprobado. Contrato ${contractNumber}, vence el ${fmtDate(dueDate)}.`,
    loan: loan._id,
    request: request._id,
  });
  return loan;
}

/** RF-010 · Registra un pago aplicando las reglas de negocio y actualiza préstamo y garantía. */
export async function registerPayment({ loan, type, amount, employee, note }) {
  const now = new Date();
  const result = applyPayment(loan, { type, amount }, now);

  const receiptNumber = await nextNumber('REC', now);
  const payment = await Payment.create({
    loan: loan._id,
    type,
    amount: round2(amount),
    interestPortion: result.interestPortion,
    capitalPortion: result.capitalPortion,
    balanceAfter: result.outstandingPrincipal,
    receiptNumber,
    registeredBy: employee._id,
    paidAt: now,
    note,
  });

  loan.outstandingPrincipal = result.outstandingPrincipal;
  loan.interestPaidUntil = result.interestPaidUntil;
  loan.dueDate = result.dueDate;
  loan.status = result.status;
  if (type === 'renovacion') loan.dueSoonNotifiedAt = undefined;
  if (result.rescued) loan.rescuedAt = now;
  await loan.save();

  if (result.rescued) {
    await Collateral.findByIdAndUpdate(loan.collateral, { status: COLLATERAL_STATUS.RESCUED });
  }

  const labels = {
    abono_capital: 'Abono a capital',
    pago_interes: 'Pago de intereses',
    renovacion: 'Renovación',
    rescate: 'Rescate de garantía',
  };
  await notify(loan.client, {
    type: type === 'rescate' ? 'rescate' : type === 'renovacion' ? 'renovacion' : 'pago_registrado',
    title: labels[type],
    message:
      type === 'rescate'
        ? `Liquidaste el contrato ${loan.contractNumber}. Tu garantía está lista para retirar. Comprobante ${receiptNumber}.`
        : `Se registró ${labels[type].toLowerCase()} de ${bs(amount)} en el contrato ${loan.contractNumber}. Comprobante ${receiptNumber}.`,
    loan: loan._id,
  });
  return payment;
}

/**
 * RF-011/012 · Mantenimiento de estados: marca préstamos vencidos y avisa vencimientos próximos.
 * Se ejecuta periódicamente desde server.js y antes de consultas de vencimientos.
 */
export async function syncLoanStatuses(now = new Date()) {
  const overdue = await Loan.find({ status: LOAN_STATUS.ACTIVE, dueDate: { $lt: now } });
  for (const loan of overdue) {
    loan.status = LOAN_STATUS.OVERDUE;
    await loan.save();
    await notify(loan.client, {
      type: 'prestamo_vencido',
      title: 'Préstamo vencido',
      message: `El contrato ${loan.contractNumber} venció el ${fmtDate(loan.dueDate)}. Regulariza tu situación pagando intereses o rescatando tu garantía.`,
      loan: loan._id,
    });
  }

  const limit = new Date(now.getTime() + DUE_SOON_DAYS * DAY_MS);
  const dueSoon = await Loan.find({
    status: LOAN_STATUS.ACTIVE,
    dueDate: { $gte: now, $lte: limit },
    dueSoonNotifiedAt: { $exists: false },
  });
  for (const loan of dueSoon) {
    loan.dueSoonNotifiedAt = now;
    await loan.save();
    await notify(loan.client, {
      type: 'vencimiento_proximo',
      title: 'Vencimiento próximo',
      message: `El contrato ${loan.contractNumber} vence el ${fmtDate(loan.dueDate)}. Renueva o rescata tu garantía a tiempo.`,
      loan: loan._id,
    });
  }
  return { overdue: overdue.length, dueSoon: dueSoon.length };
}
