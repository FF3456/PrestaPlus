import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { auth } from '../api/services.js';
import { Alert, ErrorBox, Field } from '../components/ui.jsx';
import AuthShell from './AuthShell.jsx';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';
  const email = params.get('email') || '';
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [ok, setOk] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await auth.reset({ email, token, password });
      setOk(true);
      setTimeout(() => navigate('/login'), 1800);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  if (!token || !email) {
    return (
      <AuthShell title="Enlace inválido" footer={<Link to="/recuperar" className="font-medium text-brand-600 underline">Solicitar un nuevo enlace</Link>}>
        <Alert>El enlace de restablecimiento está incompleto o venció.</Alert>
      </AuthShell>
    );
  }
  return (
    <AuthShell title="Nueva contraseña" subtitle={`Cuenta: ${email}`}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <ErrorBox error={error} />
        {ok && <Alert tone="success">Contraseña actualizada. Redirigiendo al inicio de sesión…</Alert>}
        <Field label="Nueva contraseña" hint="8 o más caracteres, con mayúscula, minúscula y número.">
          {(p) => <input {...p} className="input" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} />}
        </Field>
        <button className="btn-primary w-full" disabled={busy || ok}>{busy ? 'Guardando…' : 'Guardar contraseña'}</button>
      </form>
    </AuthShell>
  );
}
