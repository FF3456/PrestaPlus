import { useState } from 'react';
import { Link, useLocation, useOutletContext } from 'react-router-dom';
import { requests } from '../api/services.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useFetch } from '../utils/hooks.js';
import { date } from '../utils/format.js';
import { CATEGORY_LABEL } from '../utils/constants.js';
import { Alert, EmptyState, ErrorBox, Money, PageHeader, Pagination, Spinner, StatusBadge, Table, Tabs } from '../components/ui.jsx';

const TABS = [
  { value: '', label: 'Todas' },
  { value: 'en_evaluacion', label: 'En evaluación' },
  { value: 'aprobada', label: 'Aprobadas' },
  { value: 'rechazada', label: 'Rechazadas' },
];

/** RF-007 · Listado de solicitudes (cliente: propias; personal: todas con acceso al detalle). */
export default function RequestsList() {
  const { isStaff } = useAuth();
  const { base } = useOutletContext();
  const { state } = useLocation();
  const [status, setStatus] = useState(isStaff ? 'en_evaluacion' : '');
  const [page, setPage] = useState(1);
  const { data, loading, error } = useFetch(() => requests.list({ status, page, limit: 10 }), [status, page]);

  return (
    <>
      <PageHeader title={isStaff ? 'Solicitudes de préstamo' : 'Mis solicitudes'} subtitle={isStaff ? 'Evalúa, tasa y resuelve las solicitudes enviadas por los clientes.' : 'Sigue el estado de cada solicitud que enviaste.'} />
      {state?.sent && <Alert tone="success" className="mb-4">Solicitud enviada. Quedó en evaluación; te avisaremos cuando tenga respuesta.</Alert>}
      <Tabs tabs={TABS} value={status} onChange={(v) => { setStatus(v); setPage(1); }} />
      {loading && <Spinner />}
      <ErrorBox error={error} />
      {data && data.data.length === 0 && <EmptyState title="Sin solicitudes">No hay solicitudes con este filtro.</EmptyState>}
      {data && data.data.length > 0 && (
        <Table head={[...(isStaff ? ['Cliente'] : []), 'Garantía', 'Solicitado', 'Estimado', 'Fecha', 'Estado', '']}>
          {data.data.map((r) => (
            <tr key={r.id}>
              {isStaff && <td className="td">{r.client.firstName} {r.client.lastName}</td>}
              <td className="td"><p className="font-medium">{r.collateral.brand} {r.collateral.model}</p><p className="text-xs text-ink-600">{CATEGORY_LABEL[r.collateral.category]}</p></td>
              <td className="td"><Money value={r.requestedAmount} /></td>
              <td className="td"><Money value={r.preEvaluation?.estimatedLoan} /></td>
              <td className="td whitespace-nowrap">{date(r.createdAt)}</td>
              <td className="td">
                <StatusBadge status={r.status} />
                {r.status === 'rechazada' && r.rejectionReason && <p className="mt-1 max-w-[220px] text-xs text-danger-700">{r.rejectionReason}</p>}
              </td>
              <td className="td text-right">
                {isStaff && <Link className="btn-secondary !min-h-[36px]" to={`${base}/solicitudes/${r.id}`}>{r.status === 'en_evaluacion' ? 'Evaluar' : 'Ver'}</Link>}
                {!isStaff && r.loan && <Link className="btn-secondary !min-h-[36px]" to={`${base}/prestamos/${r.loan.id || r.loan._id || r.loan}`}>Ver préstamo</Link>}
              </td>
            </tr>
          ))}
        </Table>
      )}
      <Pagination meta={data?.meta} onPage={setPage} />
    </>
  );
}
