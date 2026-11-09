import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center p-6 text-center">
      <div>
        <h1>Página no encontrada</h1>
        <p className="my-3 text-ink-600">La dirección que buscas no existe o fue movida.</p>
        <Link to="/" className="btn-primary">Ir al inicio</Link>
      </div>
    </main>
  );
}
