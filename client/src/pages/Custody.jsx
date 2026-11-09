import { useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { loans } from '../api/services.js';
import { useFetch } from '../utils/hooks.js';
import { date } from '../utils/format.js';
import { CATEGORY_LABEL } from '../utils/constants.js';
import { EmptyState, ErrorBox, Money, PageHeader, Pagination, Spinner, StatusBadge, Table } from '../components/ui.jsx';

/** RF-011 · Garantías en custodia, próximas a vencer y vencidas. */
export default function Custody() {
  const { base } = useOutletContext();
  const [page, setPage] = useState(1);
  const { data, loading, error } = useFetch(() => loans.custody({ page, limit: 15 }), [page]);
  return (
    <>
      <PageHeader title="Garantías en custodia" subtitle="Ordenadas por fecha de vencimiento: lo más urgente primero." />
      {loading && <Spinner />}
      <ErrorBox error={error} />
      {data?.data.length === 0 && <EmptyState title="Sin garantías en custodia">No hay préstamos activos ni vencidos.</EmptyState>}
      {data?.data.length > 0 && (
        <Table head={['Garantía', 'Ubicación', 'Cliente', 'Contrato', 'Saldo', 'Vence', 'Estado', '']}>
          {data.data.map((l) => (
            <tr key={l.id}>
              <td className="td"><p className="font-medium">{l.collateral.brand} {l.collateral.model}</p><p className="text-xs text-ink-600">{CATEGORY_LABEL[l.collateral.category]} · {l.collateral.serialNumber}</p></td>
              <td className="td">{l.collateral.custodyLocation || '—'}</td>
              <td className="td">{l.client.firstName} {l.client.lastName}</td>
              <td className="td">{l.contractNumber}</td>
              <td className="td"><Money value={l.outstandingPrincipal} /></td>
              <td className={`td whitespace-nowrap ${l.quote.isOverdue ? 'font-medium text-danger-700' : l.quote.isDueSoon ? 'font-medium text-warning-700' : ''}`}>{date(l.dueDate)}</td>
              <td className="td"><StatusBadge status={l.status} /></td>
              <td className="td text-right"><Link className="btn-secondary !min-h-[36px]" to={`${base}/prestamos/${l.id}`}>Abrir</Link></td>
            </tr>
          ))}
        </Table>
      )}
      <Pagination meta={data?.meta} onPage={setPage} />
    </>
  );
}
