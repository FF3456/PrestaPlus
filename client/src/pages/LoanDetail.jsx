import { useState } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import { loans } from '../api/services.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useFetch } from '../utils/hooks.js';
import { assetUrl, date, dateTime, money } from '../utils/format.js';
import { CATEGORY_LABEL, CONDITION_LABEL, PAYMENT_LABEL } from '../utils/constants.js';
import { DL, ErrorBox, Money, PageHeader, Spinner, StatusBadge, Table, Tabs } from '../components/ui.jsx';
import PaymentForm from '../components/PaymentForm.jsx';

/** RF-008/009/010 · Detalle del préstamo: estado, contrato digital e historial de operaciones. */
export default function LoanDetail() {
  const { id } = useParams();
  const { isStaff } = useAuth();
  const { base } = useOutletContext();
  const [tab, setTab] = useState('resumen');
  const loan = useFetch(() => loans.get(id), [id]);
  const contract = useFetch(() => loans.contract(id), [id]);
  const pays = useFetch(() => loans.payments(id), [id]);
  const reload = () => { loan.reload(); pays.reload(); };

  if (loan.loading && !loan.data) return <Spinner />;
  if (loan.error) return <ErrorBox error={loan.error} />;
  const l = loan.data.data;
  const q = l.quote;
  const c = l.collateral;

  return (
    <>
      <PageHeader
        title={`${c.brand} ${c.model}`}
        subtitle={`Contrato ${l.contractNumber}${isStaff && l.client ? ` · ${l.client.firstName} ${l.client.lastName}` : ''}`}
        actions={<><StatusBadge status={l.status} /><Link to={`${base}/prestamos`} className="btn-secondary !min-h-[36px]">Volver</Link></>}
      />
      <Tabs tabs={[{ value: 'resumen', label: 'Resumen' }, { value: 'contrato', label: 'Contrato' }, { value: 'pagos', label: `Operaciones${pays.data ? ` (${pays.data.data.length})` : ''}` }]} value={tab} onChange={setTab} />

      <div className={`grid gap-6 ${isStaff && tab === 'resumen' ? 'lg:grid-cols-[1fr_340px]' : ''}`}>
        <div className="space-y-6">
          {tab === 'resumen' && (
            <>
              <section className="card">
                <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
                  <div><p className="text-xs text-ink-600">Capital pendiente</p><p className="text-xl font-semibold text-brand-600"><Money value={q.outstandingPrincipal} /></p></div>
                  <div><p className="text-xs text-ink-600">Interés devengado</p><p className="text-xl font-semibold"><Money value={q.accruedInterest} /></p></div>
                  <div><p className="text-xs text-ink-600">Monto de rescate</p><p className="text-xl font-semibold text-brand-600"><Money value={q.payoffAmount} /></p></div>
                  <div><p className="text-xs text-ink-600">Vencimiento</p><p className={`text-xl font-semibold ${q.isOverdue ? 'text-danger-700' : q.isDueSoon ? 'text-warning-700' : ''}`}>{date(l.dueDate)}</p>{l.status !== 'rescatado' && <p className="text-xs text-ink-600">{q.daysToDue >= 0 ? `Faltan ${q.daysToDue} días` : `${-q.daysToDue} días de mora`}</p>}</div>
                </div>
                <DL items={[['Monto aprobado', money(l.principal)], ['Tasa de interés', `${l.monthlyRate}% mensual`], ['Plazo', `${l.termDays} días`], ['Inicio', date(l.startDate)]]} />
              </section>
              <section className="card">
                <h3 className="mb-3">Garantía en custodia</h3>
                <div className="flex flex-col gap-4 sm:flex-row">
                  <div className="flex gap-2">{c.photos?.slice(0, 3).map((p) => <img key={p.url} src={assetUrl(p.url)} alt={`${c.brand} ${c.model}`} className="h-24 w-24 rounded-lg bg-brand-50 object-cover" />)}</div>
                  <DL items={[['Categoría', CATEGORY_LABEL[c.category]], ['Estado físico', CONDITION_LABEL[c.condition]], ['Serie / IMEI', c.serialNumber], ['Ubicación', c.custodyLocation], isStaff && ['Valor tasado', money(c.appraisedValue)]]} />
                </div>
              </section>
            </>
          )}

          {tab === 'contrato' && (
            <section className="card">
              {contract.loading && <Spinner />}
              <ErrorBox error={contract.error} />
              {contract.data && (() => {
                const k = contract.data.data;
                return (
                  <article aria-label="Contrato de préstamo prendario" className="space-y-4">
                    <header className="border-b border-brand-100 pb-3">
                      <h2>Contrato de préstamo prendario</h2>
                      <p className="text-ink-600">N.º {k.contractNumber} · Emitido el {dateTime(k.generatedAt)}</p>
                    </header>
                    <DL items={[['Cliente', k.client.name], ['Documento', k.client.documentId], ['Capital', money(k.terms.principal)], ['Interés', `${k.terms.monthlyRate}% mensual`], ['Plazo', `${k.terms.termDays} días`], ['Vencimiento', date(k.terms.dueDate)]]} />
                    <ol className="list-decimal space-y-2 pl-5">{k.clauses.map((cl) => <li key={cl}>{cl}</li>)}</ol>
                    <button className="btn-secondary print:hidden" onClick={() => window.print()}>Imprimir / guardar como PDF</button>
                  </article>
                );
              })()}
            </section>
          )}

          {tab === 'pagos' && (
            <>
              {pays.loading && <Spinner />}
              {pays.data?.data.length === 0 && <p className="card text-ink-600">Todavía no se registraron operaciones.</p>}
              {pays.data?.data.length > 0 && (
                <Table head={['Comprobante', 'Operación', 'Monto', 'Interés', 'Capital', 'Saldo', 'Fecha']}>
                  {pays.data.data.map((p) => (
                    <tr key={p.id}>
                      <td className="td font-medium">{p.receiptNumber}</td>
                      <td className="td">{PAYMENT_LABEL[p.type]}</td>
                      <td className="td"><Money value={p.amount} /></td>
                      <td className="td"><Money value={p.interestPortion} /></td>
                      <td className="td"><Money value={p.capitalPortion} /></td>
                      <td className="td"><Money value={p.balanceAfter} /></td>
                      <td className="td whitespace-nowrap">{dateTime(p.paidAt)}</td>
                    </tr>
                  ))}
                </Table>
              )}
            </>
          )}
        </div>
        {isStaff && tab === 'resumen' && <PaymentForm key={`${l.outstandingPrincipal}-${l.dueDate}`} loan={l} onDone={reload} />}
      </div>
    </>
  );
}
