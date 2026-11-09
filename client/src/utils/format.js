export const money = (n) =>
  `Bs ${Number(n || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const date = (d) => (d ? new Date(d).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
export const dateTime = (d) =>
  d ? new Date(d).toLocaleString('es-BO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

/** Convierte una ruta relativa de la API (/uploads/x.jpg) en URL absoluta si VITE_API_URL es absoluta. */
export function assetUrl(path) {
  if (!path || /^https?:/.test(path)) return path;
  const api = import.meta.env.VITE_API_URL || '';
  if (/^https?:/.test(api)) return `${new URL(api).origin}${path}`;
  return path;
}

export const apiOrigin = () => {
  const api = import.meta.env.VITE_API_URL || '';
  return /^https?:/.test(api) ? new URL(api).origin : '';
};
