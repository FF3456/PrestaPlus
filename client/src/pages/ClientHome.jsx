import { Link, useOutletContext } from 'react-router-dom';
import { dashboard, loans } from '../api/services.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useFetch } from '../utils/hooks.js';
import { date } from '../utils/format.js';
import { EmptyState, ErrorBox, PageHeader, Spinner, Stat, Money } from '../components/ui.jsx';
import LoanCard from '../components/LoanCard.jsx';

export default function ClientHome() {
  const { user } = useAuth();
  const { base } = useOutletContext();
  const summary = useFetch(() => dashboard.me(), []);
  const active = useFetch(() => loans.list({ limit: 6 }), []);
  const s = summary.data?.data;

  return (
    <>
      <PageHeader
        title={`Hola, ${user.firstName}`}
        subtitle="Este es el resumen de tus préstamos prendarios."
        actions={<Link to={`${base}/solicitar`} className="btn-primary">Solicitar préstamo</Link>}
      />
      {summary.loading && <Spinner />}
      <ErrorBox error={summary.error} />
      {s && (
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label="Préstamos activos" value={s.activeLoans} />
          <Stat label="Capital pendiente" value={<Money value={s.totalOutstanding} />} />
          <Stat label="Monto para rescatar hoy" value={<Money value={s.totalPayoff} />} hint="Capital + interés devengado" />
          <Stat
            label="Próximo vencimiento"
            value={s.nextDue ? date(s.nextDue.dueDate) : '—'}
            tone={s.overdueLoans ? 'danger' : 'default'}
            hint={s.overdueLoans ? `${s.overdueLoans} préstamo(s) vencido(s)` : s.nextDue?.item}
          />
        </div>
      )}
      {s?.pendingRequests > 0 && (
        <p className="mb-6 rounded-lg bg-warning-50 px-4 py-3 text-warning-700">
          Tienes {s.pendingRequests} solicitud(es) en evaluación. <Link className="font-medium underline" to={`${base}/solicitudes`}>Ver estado</Link>
        </p>
      )}
      <h2 className="mb-3">Mis préstamos</h2>
      {active.loading && <Spinner />}
      {active.data?.data.length === 0 && (
        <EmptyState title="Aún no tienes préstamos" action={<Link to={`${base}/solicitar`} className="btn-primary mt-2">Registrar mi primera garantía</Link>}>
          Registra una garantía y envía tu solicitud para recibir una estimación y una respuesta del tasador.
        </EmptyState>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {active.data?.data.map((l) => <LoanCard key={l.id} loan={l} to={`${base}/prestamos/${l.id}`} />)}
      </div>
    </>
  );
}
