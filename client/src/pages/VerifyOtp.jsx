import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { auth } from '../api/services.js';
import { useAuth } from '../context/AuthContext.jsx';
import { homeFor } from '../components/ProtectedRoute.jsx';
import { Alert, ErrorBox, Field } from '../components/ui.jsx';
import AuthShell from './AuthShell.jsx';

export default function VerifyOtp() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { startSession } = useAuth();
  const [email] = useState(state?.email || '');
  const [code, setCode] = useState(state?.devOtp || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState('');
  const [devOtp, setDevOtp] = useState(state?.devOtp);
  if (!email) return <Navigate to="/registro" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const user = startSession(await auth.verifyOtp({ email, code }));
      navigate(homeFor(user), { replace: true });
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };
  const resend = async () => {
    setError(null);
    try {
      const r = await auth.resendOtp({ email });
      setInfo(r.message);
      if (r.data?.devOtp) setDevOtp(r.data.devOtp);
    } catch (err) {
      setError(err);
    }
  };

  return (
    <AuthShell title="Verifica tu correo" subtitle={`Ingresa el código de 6 dígitos enviado a ${email}.`}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <ErrorBox error={error} />
        <Alert tone="success">{info}</Alert>
        {devOtp && <Alert tone="info">Modo desarrollo (sin SMTP): tu código es <strong>{devOtp}</strong></Alert>}
        <Field label="Código OTP">
          {(p) => <input {...p} className="input text-center text-xl tracking-[0.4em]" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />}
        </Field>
        <button className="btn-primary w-full" disabled={busy || code.length !== 6}>{busy ? 'Verificando…' : 'Verificar cuenta'}</button>
        <button type="button" className="btn-secondary w-full" onClick={resend}>Reenviar código</button>
      </form>
    </AuthShell>
  );
}
