import test from 'node:test';
import assert from 'node:assert/strict';
import { accruedInterest, addDays, appraise, applyPayment, preEvaluate, quote, round2 } from '../src/utils/loanCalculator.js';

const T0 = new Date('2026-11-01T12:00:00Z');
const baseLoan = (over = {}) => ({
  outstandingPrincipal: 1000,
  monthlyRate: 4,
  termDays: 30,
  startDate: T0,
  interestPaidUntil: T0,
  dueDate: addDays(T0, 30),
  status: 'activo',
  ...over,
});

test('pre-evaluación aplica factor de estado y LTV por categoría (RF-005)', () => {
  const r = preEvaluate({ category: 'electronica', condition: 'bueno', declaredValue: 3500 });
  assert.equal(r.estimatedValue, 2275); // 3500 * 0.65
  assert.equal(r.estimatedLoan, 1137.5); // * 0.5
  assert.equal(r.monthlyRate, 4);
});

test('tasación calcula monto máximo y tasa (RF-006)', () => {
  const r = appraise({ category: 'joyas', marketValue: 2000 });
  assert.deepEqual(r, { marketValue: 2000, maxLoan: 1400, monthlyRate: 3 });
});

test('interés devengado: simple, base 30 días', () => {
  assert.equal(accruedInterest({ principal: 1000, monthlyRate: 4, from: T0, to: addDays(T0, 30) }), 40);
  assert.equal(accruedInterest({ principal: 1000, monthlyRate: 4, from: T0, to: addDays(T0, 15) }), 20);
  assert.equal(accruedInterest({ principal: 1000, monthlyRate: 4, from: T0, to: T0 }), 0);
});

test('cotización marca vencido y por vencer', () => {
  assert.equal(quote(baseLoan(), addDays(T0, 10)).isDueSoon, false);
  assert.equal(quote(baseLoan(), addDays(T0, 25)).isDueSoon, true);
  assert.equal(quote(baseLoan(), addDays(T0, 31)).isOverdue, true);
  assert.equal(quote(baseLoan({ status: 'rescatado', outstandingPrincipal: 0 }), addDays(T0, 60)).isOverdue, false);
});

test('pago de interés exige el monto exacto y no cambia el vencimiento', () => {
  const now = addDays(T0, 30);
  assert.throws(() => applyPayment(baseLoan(), { type: 'pago_interes', amount: 10 }, now), { code: 'PAYMENT_AMOUNT_MISMATCH' });
  const r = applyPayment(baseLoan(), { type: 'pago_interes', amount: 40 }, now);
  assert.equal(r.interestPortion, 40);
  assert.equal(r.outstandingPrincipal, 1000);
  assert.deepEqual(r.dueDate, baseLoan().dueDate);
});

test('renovación extiende el plazo desde el vencimiento vigente y reactiva el préstamo', () => {
  const now = addDays(T0, 30);
  const r = applyPayment(baseLoan(), { type: 'renovacion', amount: 40 }, now);
  assert.equal(r.status, 'activo');
  assert.deepEqual(r.dueDate, addDays(baseLoan().dueDate, 30));
  const late = applyPayment(baseLoan({ status: 'vencido' }), { type: 'renovacion', amount: 48 }, addDays(T0, 36));
  assert.deepEqual(late.dueDate, addDays(addDays(T0, 36), 30)); // desde hoy si ya venció
  assert.equal(late.status, 'activo');
});

test('abono a capital: primero interés, luego capital', () => {
  const r = applyPayment(baseLoan(), { type: 'abono_capital', amount: 340 }, addDays(T0, 30));
  assert.equal(r.interestPortion, 40);
  assert.equal(r.capitalPortion, 300);
  assert.equal(r.outstandingPrincipal, 700);
  assert.throws(() => applyPayment(baseLoan(), { type: 'abono_capital', amount: 30 }, addDays(T0, 30)), { code: 'PAYMENT_BELOW_INTEREST' });
  assert.throws(() => applyPayment(baseLoan(), { type: 'abono_capital', amount: 1040 }, addDays(T0, 30)), { code: 'USE_RESCUE' });
});

test('rescate liquida capital + interés y marca rescatado (CU-05)', () => {
  const now = addDays(T0, 30);
  assert.throws(() => applyPayment(baseLoan(), { type: 'rescate', amount: 1000 }, now), { code: 'PAYMENT_AMOUNT_MISMATCH' });
  const r = applyPayment(baseLoan(), { type: 'rescate', amount: 1040 }, now);
  assert.equal(r.status, 'rescatado');
  assert.equal(r.outstandingPrincipal, 0);
  assert.equal(r.rescued, true);
});

test('un préstamo rescatado no admite más operaciones', () => {
  assert.throws(() => applyPayment(baseLoan({ status: 'rescatado' }), { type: 'pago_interes', amount: 1 }), { code: 'LOAN_ALREADY_RESCUED' });
});

test('round2 evita errores de coma flotante', () => {
  assert.equal(round2(1.005), 1.01);
  assert.equal(round2(0.1 + 0.2), 0.3);
});
