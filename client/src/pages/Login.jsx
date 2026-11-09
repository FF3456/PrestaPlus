import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { homeFor } from '../components/ProtectedRoute.jsx';
import { ErrorBox, Field } from '../components/ui.jsx';
import AuthShell from './AuthShell.jsx';

export default function Login() {
  const { login, clearExpired } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const user = await login(form.email, form.password);
      clearExpired();
      navigate(location.state?.from || homeFor(user), { replace: true });
    } catch (err) {
      if (err.code === 'ACCOUNT_NOT_VERIFIED') return navigate('/verificar', { state: { email: form.email } });
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Iniciar sesión"
      subtitle="Accede como cliente o como personal de PRESTA+."
      footer={<>¿No tienes cuenta? <Link to="/registro" className="font-medium text-brand-600 underline">Regístrate</Link></>}
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <ErrorBox error={error} />
        <Field label="Correo electrónico">
          {(p) => <input {...p} className="input" type="email" autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />}
        </Field>
        <Field label="Contraseña">
          {(p) => <input {...p} className="input" type="password" autoComplete="current-password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />}
        </Field>
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Ingresando…' : 'Iniciar sesión'}</button>
        <p className="text-center"><Link to="/recuperar" className="text-brand-600 underline">¿Olvidaste tu contraseña?</Link></p>
      </form>
    </AuthShell>
  );
}
