import { Link } from 'react-router-dom';

/** Contenedor común de pantallas de autenticación. */
export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-navy-900 p-10 text-white lg:flex">
        <Link to="/" className="inline-flex w-fit items-center justify-center">
          <img src="/presta-logo.png" alt="PRESTA+ — Préstamos con prenda" className="h-auto w-32 object-contain" />
        </Link>
        <div>
          <p className="max-w-md text-3xl font-semibold leading-snug">Tu garantía, tu préstamo y tu rescate, sin filas ni papeles.</p>
          <p className="mt-4 max-w-md text-white/85">Solicita, sigue y paga tu préstamo prendario desde cualquier dispositivo.</p>
        </div>
        <p className="text-xs text-white/70">Universidad Adventista de Bolivia · Tecnologías en Internet</p>
      </section>
      <main className="flex items-center justify-center bg-paper p-5 sm:p-10">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-6 inline-flex lg:hidden">
            <img src="/presta-logo.png" alt="PRESTA+ — Préstamos con prenda" className="h-auto w-20 object-contain" />
          </Link>
          <h1>{title}</h1>
          {subtitle && <p className="mb-6 mt-1 text-ink-600">{subtitle}</p>}
          {children}
          {footer && <p className="mt-6 text-center text-ink-600">{footer}</p>}
        </div>
      </main>
    </div>
  );
}
