const BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
const TOKEN_KEY = 'prestamas.token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  constructor(status, body) {
    super(body?.message || 'Error de red. Verifica tu conexión e inténtalo de nuevo.');
    this.status = status;
    this.code = body?.code;
    this.details = body?.details;
  }
}

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => (onUnauthorized = fn);

/** Cliente HTTP: adjunta `Authorization: Bearer <JWT>` y normaliza los errores de la API. */
export async function http(path, { method = 'GET', body, query, form } = {}) {
  const url = new URL(`${BASE}${path}`, window.location.origin);
  Object.entries(query || {}).forEach(([k, v]) => v !== undefined && v !== '' && url.searchParams.set(k, v));

  const headers = {};
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (form) payload = form; // FormData: el navegador define el Content-Type con el boundary
  else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(url, { method, headers, body: payload });
  } catch {
    throw new ApiError(0, { message: 'No se pudo conectar con el servidor. Verifica tu conexión.', code: 'NETWORK' });
  }
  if (res.status === 204) return null;
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new ApiError(res.status, json);
    if (res.status === 401 && token && !path.startsWith('/auth/login')) onUnauthorized(err);
    throw err;
  }
  return json;
}
