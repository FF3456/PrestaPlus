import { useEffect, useState } from 'react';
import { loans } from '../api/services.js';
import { PAYMENT_LABEL } from '../utils/constants.js';
import { money } from '../utils/format.js';
import { Alert, ErrorBox, Field } from './ui.jsx';

/** CU-05 · Registro de abono, pago de interés, renovación o rescate (solo personal). */
export default function PaymentForm({ loan, onDone }) {
  const q = loan.quote;
  const [type, setType] = useState('pago_interes');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(null);

  // Autocompleta el monto exacto exigido por cada operación
  useEffect(() => {
    if (type === 'rescate') setAmount(q.payoffAmount.toFixed(2));
    else if (type === 'pago_interes' || type === 'renovacion') setAmount(q.accruedInterest.toFixed(2));
    else setAmount('');
  }, [type, q.payoffAmount, q.accruedInterest]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await loans.pay(loan.id, { type, amount: Number(amount), note: note || undefined });
      setDone(r.data.payment);
      onDone();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  if (loan.status === 'rescatado') return <Alert tone="success">Este préstamo fue rescatado. No admite más operaciones.</Alert>;

  return (
    <form onSubmit={submit} className="card space-y-4">
      <h3>Registrar operación</h3>
      <div className="rounded-lg bg-brand-50 p-3 text-xs">
        Interés devengado ({q.interestDays} d): <strong>{money(q.accruedInterest)}</strong> · Monto de rescate: <strong>{money(q.payoffAmount)}</strong>
      </div>
      <ErrorBox error={error} />
      {done && <Alert tone="success">Operación registrada. Comprobante <strong>{done.receiptNumber}</strong>.</Alert>}
      <Field label="Tipo de operación">
        {(p) => <select {...p} className="input" value={type} onChange={(e) => setType(e.target.value)}>{Object.entries(PAYMENT_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>}
      </Field>
      <Field label="Monto (Bs)" hint={type === 'abono_capital' ? 'Se aplica primero al interés devengado; el excedente reduce el capital.' : 'Debe coincidir con el monto calculado.'}>
        {(p) => <input {...p} className="input" type="number" step="0.01" min="0.01" inputMode="decimal" required value={amount} onChange={(e) => setAmount(e.target.value)} />}
      </Field>
      <Field label="Nota (opcional)">{(p) => <input {...p} className="input" maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} />}</Field>
      <button className="btn-primary w-full" disabled={busy || !amount}>{busy ? 'Registrando…' : `Registrar ${PAYMENT_LABEL[type].toLowerCase()}`}</button>
    </form>
  );
}
