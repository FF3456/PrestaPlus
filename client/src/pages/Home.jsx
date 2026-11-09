import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { homeFor } from '../components/ProtectedRoute.jsx';

const STEPS = [
  ['Registra tu garantía', 'Describe el bien, súbele fotos y recibe al instante un estimado de cuánto puedes recibir.'],
  ['Un tasador la evalúa', 'Nuestro personal confirma el valor, fija la tasa y aprueba tu préstamo con contrato digital.'],
  ['Paga y rescata', 'Abona a capital, paga intereses o renueva. Al liquidar, recuperas tu garantía.'],
];

export default function Home() {
  const { user } = useAuth();
  if (user) return <Navigate to={homeFor(user)} replace />;
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
        <span className="text-xl font-semibold text-brand-600">PRESTA+</span>
        <nav aria-label="Acceso" className="flex gap-2">
          <Link to="/login" className="btn-secondary">Iniciar sesión</Link>
          <Link to="/registro" className="btn-primary">Crear cuenta</Link>
        </nav>
      </header>
      <main>
        <section className="mx-auto max-w-5xl px-5 pb-12 pt-10 sm:pt-16">
          <h1 className="max-w-2xl !text-4xl !leading-tight sm:!text-5xl">Préstamos prendarios con seguimiento claro, de principio a fin.</h1>
          <p className="mt-5 max-w-xl text-base text-ink-600">
            Deja tu garantía en custodia, recibe liquidez y controla montos, intereses y fechas de vencimiento desde tu teléfono o computadora.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/registro" className="btn-primary">Solicitar un préstamo</Link>
            <Link to="/login" className="btn-secondary">Ya tengo cuenta</Link>
          </div>
        </section>
        <section className="mx-auto max-w-5xl px-5 pb-16" aria-labelledby="como-funciona">
          <h2 id="como-funciona" className="mb-6">Cómo funciona</h2>
          <ol className="grid gap-4 md:grid-cols-3">
            {STEPS.map(([t, d], i) => (
              <li key={t} className="card">
                <span className="mb-3 grid h-8 w-8 place-items-center rounded-full bg-brand-600 text-sm font-semibold text-white" aria-hidden="true">{i + 1}</span>
                <h3>{t}</h3>
                <p className="mt-1 text-ink-600">{d}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </div>
  );
}
