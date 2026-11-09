import { useState } from 'react';
import { Link } from 'react-router-dom';
import { auth } from '../api/services.js';
import { Alert, ErrorBox, Field } from '../components/ui.jsx';
import AuthShell from './AuthShell.jsx';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      setDone(await auth.forgot({ email }));
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };
  const devToken = done?.data?.devResetToken;

  return (
    <AuthShell title="Recuperar contraseña" subtitle="Te enviaremos un enlace para crear una nueva." footer={<Link to="/login" className="font-medium text-brand-600 underline">Volver a iniciar sesión</Link>}>
      {done ? (
        <div className="space-y-4">
          <Alert tone="success">{done.message}</Alert>
          {devToken && (
            <Alert tone="info">
              Modo desarrollo: <Link className="underline" to={`/reset-password?token=${devToken}&email=${encodeURIComponent(email)}`}>abrir enlace de restablecimiento</Link>
            </Alert>
          )}
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <ErrorBox error={error} />
          <Field label="Correo electrónico">{(p) => <input {...p} className="input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />}</Field>
          <button className="btn-primary w-full" disabled={busy}>{busy ? 'Enviando…' : 'Enviar enlace'}</button>
        </form>
      )}
    </AuthShell>
  );
}
