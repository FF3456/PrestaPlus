import { Link, useOutletContext } from 'react-router-dom';
import { dashboard } from '../api/services.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useFetch } from '../utils/hooks.js';
import { date } from '../utils/format.js';
import { ErrorBox, Money, PageHeader, Spinner, Stat } from '../components/ui.jsx';

/** RF-013 · Dashboard administrativo. */
export default function StaffDashboard() {
  const { user } = useAuth();
  const { base } = useOutletContext();
  const { data, loading, error } = useFetch(() => dashboard.staff(), []);
  const s = data?.data;
  return (
    <>
      <PageHeader title={`Panel de operaciones`} subtitle={`Bienvenido, ${user.firstName}. Resumen del día.`} />
      {loading && <Spinner />}
      <ErrorBox error={error} />
      {s && (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label="Solicitudes pendientes" value={s.pendingRequests} tone={s.pendingRequests ? 'warning' : 'default'} />
            <Stat label="Préstamos activos" value={s.activeLoans} />
            <Stat label="Por vencer (7 días)" value={s.dueSoonLoans} tone={s.dueSoonLoans ? 'warning' : 'default'} />
            <Stat label="Vencidos" value={s.overdueLoans} tone={s.overdueLoans ? 'danger' : 'default'} />
            <Stat label="Garantías en custodia" value={s.custodyCount} />
            <Stat label="Cartera (capital)" value={<Money value={s.portfolioOutstanding} />} />
            <Stat label="Cobrado hoy" value={<Money value={s.paymentsToday.total} />} hint={`${s.paymentsToday.count} operación(es)`} tone="success" />
            <Stat label="Cobrado este mes" value={<Money value={s.paymentsMonth.total} />} hint={`${s.paymentsMonth.count} operación(es)`} tone="success" />
          </div>
          <section className="card">
            <div className="mb-3 flex items-center justify-between"><h2>Solicitudes más antiguas por evaluar</h2><Link className="btn-secondary !min-h-[36px]" to={`${base}/solicitudes`}>Ver todas</Link></div>
            {s.oldestPendingRequests.length === 0 ? <p className="text-ink-600">No hay solicitudes pendientes.</p> : (
              <ul className="divide-y divide-brand-100">
                {s.oldestPendingRequests.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                    <span><span className="font-medium">{r.collateral.brand} {r.collateral.model}</span> · {r.client.firstName} {r.client.lastName}<span className="block text-xs text-ink-600">Enviada el {date(r.createdAt)} · solicita <Money value={r.requestedAmount} /></span></span>
                    <Link className="btn-primary !min-h-[36px]" to={`${base}/solicitudes/${r.id}`}>Evaluar</Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </>
  );
}
