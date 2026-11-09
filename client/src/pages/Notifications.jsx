import { useState } from 'react';
import { notifications } from '../api/services.js';
import { useFetch } from '../utils/hooks.js';
import { dateTime } from '../utils/format.js';
import { EmptyState, ErrorBox, PageHeader, Pagination, Spinner } from '../components/ui.jsx';

/** RF-012 · Bandeja de notificaciones. */
export default function Notifications() {
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useFetch(() => notifications.list({ page, limit: 15 }), [page]);
  const markAll = () => notifications.readAll().then(reload);
  const markOne = (n) => !n.read && notifications.read(n.id).then(reload);

  return (
    <>
      <PageHeader
        title="Notificaciones"
        subtitle="Aprobaciones, pagos, renovaciones y vencimientos."
        actions={data?.meta?.unread > 0 && <button className="btn-secondary" onClick={markAll}>Marcar todas como leídas</button>}
      />
      {loading && <Spinner />}
      <ErrorBox error={error} />
      {data?.data.length === 0 && <EmptyState title="Sin notificaciones">Cuando haya novedades en tus préstamos las verás aquí.</EmptyState>}
      <ul className="space-y-3">
        {data?.data.map((n) => (
          <li key={n.id}>
            <button onClick={() => markOne(n)} className={`card w-full text-left ${n.read ? '' : 'border-l-4 border-l-brand-600 bg-brand-50'}`}>
              <div className="flex items-start justify-between gap-3">
                <h3>{n.title}{!n.read && <span className="sr-only"> (sin leer)</span>}</h3>
                <time className="shrink-0 text-xs text-ink-600" dateTime={n.createdAt}>{dateTime(n.createdAt)}</time>
              </div>
              <p className="mt-1 text-ink-600">{n.message}</p>
            </button>
          </li>
        ))}
      </ul>
      <Pagination meta={data?.meta} onPage={setPage} />
    </>
  );
}
