import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { loans } from '../api/services.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useFetch } from '../utils/hooks.js';
import { EmptyState, ErrorBox, PageHeader, Pagination, Spinner, Tabs } from '../components/ui.jsx';
import LoanCard from '../components/LoanCard.jsx';

const TABS = [
  { value: '', label: 'Todos' },
  { value: 'activo', label: 'Activos' },
  { value: 'dueSoon', label: 'Por vencer' },
  { value: 'vencido', label: 'Vencidos' },
  { value: 'rescatado', label: 'Rescatados' },
];

/** RF-009 / RF-011 · Préstamos (cliente: propios; personal: todos, con filtros de vencimiento). */
export default function LoansList({ initial = '' }) {
  const { isStaff } = useAuth();
  const { base } = useOutletContext();
  const [tab, setTab] = useState(initial);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const query = { page, limit: 12, q, ...(tab === 'dueSoon' ? { dueSoon: true } : { status: tab }) };
  const { data, loading, error } = useFetch(() => loans.list(query), [tab, q, page]);

  return (
    <>
      <PageHeader title={isStaff ? 'Préstamos' : 'Mis préstamos'} subtitle="Saldo, intereses y fechas de vencimiento al día." />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Tabs tabs={TABS} value={tab} onChange={(v) => { setTab(v); setPage(1); }} />
        <label className="sr-only" htmlFor="q">Buscar por número de contrato</label>
        <input id="q" className="input max-w-xs" placeholder="Buscar contrato (PRE-2026-…)" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
      </div>
      {loading && <Spinner />}
      <ErrorBox error={error} />
      {data?.data.length === 0 && <EmptyState title="Sin préstamos">No hay préstamos que coincidan con este filtro.</EmptyState>}
      <div className="grid gap-4 md:grid-cols-2">
        {data?.data.map((l) => <LoanCard key={l.id} loan={l} showClient={isStaff} to={`${base}/prestamos/${l.id}`} />)}
      </div>
      <Pagination meta={data?.meta} onPage={setPage} />
    </>
  );
}
