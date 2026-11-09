import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { notifications } from '../api/services.js';
import { ROLE_LABEL } from '../utils/constants.js';
import { Alert } from './ui.jsx';

const CLIENT_NAV = [
  ['/app', 'Inicio', true],
  ['/app/solicitar', 'Solicitar préstamo'],
  ['/app/solicitudes', 'Mis solicitudes'],
  ['/app/prestamos', 'Mis préstamos'],
  ['/app/pagos', 'Mis pagos'],
  ['/app/notificaciones', 'Notificaciones'],
  ['/app/perfil', 'Mi perfil'],
];
const STAFF_NAV = [
  ['/panel', 'Panel', true],
  ['/panel/solicitudes', 'Solicitudes'],
  ['/panel/prestamos', 'Préstamos'],
  ['/panel/custodia', 'Garantías en custodia'],
  ['/panel/pagos', 'Registro de pagos'],
  ['/panel/notificaciones', 'Notificaciones'],
  ['/panel/perfil', 'Mi perfil'],
  ['/panel/api-docs', 'Documentación API'],
];

function Logo() {
  return (
    <span className="flex items-center gap-2 text-lg font-semibold text-white">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-paper text-brand-600" aria-hidden="true">
        +
      </span>
      PRESTA+
    </span>
  );
}

export default function Layout() {
  const { user, logout, isStaff, sessionExpired } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  const nav = [...(isStaff ? STAFF_NAV : CLIENT_NAV)];
  if (user.role === 'admin') nav.splice(6, 0, ['/panel/usuarios', 'Usuarios']);
  const base = isStaff ? '/panel' : '/app';

  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    let stop = false;
    const load = () => notifications.unread().then((r) => !stop && setUnread(r.data.unread)).catch(() => undefined);
    load();
    const t = setInterval(load, 60000);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [location.pathname]);

  const links = (
    <nav aria-label="Principal" className="flex flex-col gap-1">
      {nav.map(([to, label, end]) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => `flex min-h-[44px] items-center justify-between rounded-lg px-3 font-medium ${isActive ? 'bg-white text-brand-600' : 'text-white hover:bg-brand-500'}`}
        >
          {label}
          {to.endsWith('notificaciones') && unread > 0 && (
            <span className="rounded-full bg-warning-700 px-2 text-xs text-white" aria-label={`${unread} sin leer`}>
              {unread}
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  );

  const account = (
    <div className="border-t border-white/20 pt-4 text-white">
      <p className="truncate font-medium">
        {user.firstName} {user.lastName}
      </p>
      <p className="mb-3 text-xs text-white/80">{ROLE_LABEL[user.role]}</p>
      <button
        className="btn w-full border border-white/60 text-white hover:bg-brand-500"
        onClick={() => {
          logout();
          navigate('/login');
        }}
      >
        Cerrar sesión
      </button>
    </div>
  );

  return (
    <div className="min-h-screen lg:flex">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2">
        Saltar al contenido
      </a>

      {/* Barra superior (móvil) */}
      <header className="sticky top-0 z-40 flex items-center justify-between bg-brand-600 px-4 py-3 lg:hidden">
        <Logo />
        <button className="btn border border-white/60 text-white" aria-expanded={open} aria-controls="menu-movil" onClick={() => setOpen((o) => !o)}>
          {open ? 'Cerrar' : 'Menú'}
        </button>
      </header>
      {open && (
        <div id="menu-movil" className="flex flex-col gap-4 bg-brand-600 px-4 pb-4 lg:hidden">
          {links}
          {account}
        </div>
      )}

      {/* Barra lateral (escritorio) */}
      <aside className="hidden w-64 shrink-0 flex-col justify-between gap-6 bg-brand-600 p-4 lg:sticky lg:top-0 lg:flex lg:h-screen">
        <div className="space-y-6">
          <Logo />
          {links}
        </div>
        {account}
      </aside>

      <main id="contenido" className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        {sessionExpired && <Alert tone="warning" className="mb-4">Tu sesión expiró. Inicia sesión nuevamente.</Alert>}
        <div className="mx-auto max-w-6xl">
          <Outlet context={{ base }} />
        </div>
      </main>
    </div>
  );
}
