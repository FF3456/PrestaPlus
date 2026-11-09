import { Link } from 'react-router-dom';
import { assetUrl, date } from '../utils/format.js';
import { CATEGORY_LABEL } from '../utils/constants.js';
import { Money, StatusBadge } from './ui.jsx';

/** Tarjeta de préstamo (portal del cliente y vistas del personal). */
export default function LoanCard({ loan, to, showClient = false }) {
  const c = loan.collateral;
  const q = loan.quote;
  return (
    <Link to={to} className="card flex gap-4 transition-colors hover:border-brand-500">
      <img src={assetUrl(c.photos?.[0]?.url)} alt="" className="h-20 w-20 shrink-0 rounded-lg bg-brand-50 object-cover" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="truncate">{c.brand} {c.model}</h3>
          <StatusBadge status={loan.status} />
        </div>
        <p className="text-xs text-ink-600">
          {loan.contractNumber} · {CATEGORY_LABEL[c.category]}
          {showClient && loan.client && ` · ${loan.client.firstName} ${loan.client.lastName}`}
        </p>
        <dl className="mt-2 grid grid-cols-2 gap-2 text-xs">
          <div><dt className="text-ink-600">Saldo de capital</dt><dd className="text-sm font-medium"><Money value={loan.outstandingPrincipal} /></dd></div>
          <div>
            <dt className="text-ink-600">Vence</dt>
            <dd className={`text-sm font-medium ${q?.isOverdue ? 'text-danger-700' : q?.isDueSoon ? 'text-warning-700' : ''}`}>
              {date(loan.dueDate)}{loan.status !== 'rescatado' && q ? ` (${q.daysToDue >= 0 ? `${q.daysToDue} d` : `${-q.daysToDue} d de mora`})` : ''}
            </dd>
          </div>
        </dl>
      </div>
    </Link>
  );
}
