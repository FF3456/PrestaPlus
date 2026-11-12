import { useEffect, useId, useRef } from 'react';
import { STATUS } from '../utils/constants.js';
import { money } from '../utils/format.js';

export function Spinner({ label = 'Cargando…' }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-10 text-ink-600">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

const ALERT = {
  error: 'border-danger-500 bg-danger-50 text-danger-700',
  success: 'border-success-500 bg-success-50 text-success-700',
  warning: 'border-warning-500 bg-warning-50 text-warning-700',
  info: 'border-brand-500 bg-brand-50 text-brand-700',
};
export function Alert({ tone = 'error', children, className = '' }) {
  if (!children) return null;
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`rounded-lg border-l-4 px-4 py-3 ${ALERT[tone]} ${className}`}>
      {children}
    </div>
  );
}

/** Muestra un ApiError con su detalle por campo. */
export function ErrorBox({ error, className }) {
  if (!error) return null;
  return (
    <Alert className={className}>
      <p className="font-medium">{error.message}</p>
      {Array.isArray(error.details) && (
        <ul className="mt-1 list-disc pl-5">
          {error.details.map((d, i) => (
            <li key={i}>{d.message}</li>
          ))}
        </ul>
      )}
    </Alert>
  );
}

const TONE = {
  success: 'bg-success-50 text-success-700 ring-success-500/40',
  warning: 'bg-warning-50 text-warning-700 ring-warning-500/40',
  danger: 'bg-danger-50 text-danger-700 ring-danger-500/40',
  info: 'bg-brand-50 text-brand-700 ring-brand-500/40',
  neutral: 'bg-white text-ink-600 ring-ink-600/30',
};
export function StatusBadge({ status }) {
  const s = STATUS[status] || { label: status, tone: 'neutral' };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${TONE[s.tone]}`}>{s.label}</span>;
}

/** Campo de formulario accesible: label asociado, ayuda y error anunciado. */
export function Field({ label, hint, error, children, className = '' }) {
  const id = useId();
  const child = children({ id, 'aria-invalid': error ? true : undefined, 'aria-describedby': error ? `${id}-err` : hint ? `${id}-hint` : undefined });
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block font-medium">
        {label}
      </label>
      {child}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1 text-xs text-ink-600">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-err`} className="mt-1 text-xs font-medium text-danger-700">
          {error}
        </p>
      )}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="mt-1 max-w-prose text-ink-600">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({ title, children, action }) {
  return (
    <div className="card flex flex-col items-center gap-2 py-10 text-center">
      <h3>{title}</h3>
      {children && <p className="max-w-md text-ink-600">{children}</p>}
      {action}
    </div>
  );
}

export function Stat({ label, value, tone = 'default', hint }) {
  const color = { default: 'text-brand-600', danger: 'text-danger-700', warning: 'text-warning-700', success: 'text-success-700' }[tone];
  return (
    <div className="card">
      <p className="text-xs font-medium text-ink-600">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${color}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-600">{hint}</p>}
    </div>
  );
}

export function Money({ value, className = '' }) {
  return <span className={`tabular-nums ${className}`}>{money(value)}</span>;
}

/** Diálogo modal accesible: foco inicial, cierre con Esc. */
export function Modal({ title, onClose, children, footer }) {
  const ref = useRef(null);
  useEffect(() => {
    const prev = document.activeElement;
    ref.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      prev?.focus?.();
    };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/50 p-0 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-6 sm:rounded-2xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2>{title}</h2>
          <button className="btn-secondary !min-h-[36px] !px-3" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>
        {children}
        {footer && <div className="mt-5 flex flex-wrap justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

export function Pagination({ meta, onPage }) {
  if (!meta || meta.pages <= 1) return null;
  return (
    <nav aria-label="Paginación" className="mt-4 flex items-center justify-between gap-3">
      <button className="btn-secondary" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}>
        Anterior
      </button>
      <span className="text-ink-600">
        Página {meta.page} de {meta.pages}
      </span>
      <button className="btn-secondary" disabled={meta.page >= meta.pages} onClick={() => onPage(meta.page + 1)}>
        Siguiente
      </button>
    </nav>
  );
}

/** Tabla con scroll horizontal en móviles. */
export function Table({ head, children }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-brand-100 bg-white">
      <table className="min-w-full divide-y divide-brand-100">
        <thead className="bg-brand-50">
          <tr>
            {head.map((h) => (
              <th key={h} scope="col" className="th">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-100">{children}</tbody>
      </table>
    </div>
  );
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div role="tablist" className="mb-4 flex flex-wrap gap-2">
      {tabs.map((t) => (
        <button
          key={t.value}
          role="tab"
          aria-selected={value === t.value}
          onClick={() => onChange(t.value)}
          className={`min-h-[40px] rounded-lg px-4 text-sm font-medium shadow-sm transition-all hover:shadow-md ${value === t.value ? 'bg-brand-600 text-white' : 'border border-brand-500/50 bg-white text-brand-600 hover:bg-brand-50'}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export const DL = ({ items }) => (
  <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
    {items.filter(Boolean).map(([k, v]) => (
      <div key={k}>
        <dt className="text-xs font-medium text-ink-600">{k}</dt>
        <dd className="mt-0.5">{v ?? '—'}</dd>
      </div>
    ))}
  </dl>
);
