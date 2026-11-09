import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../api/services.js';
import { ErrorBox, Field } from '../components/ui.jsx';
import AuthShell from './AuthShell.jsx';

const EMPTY = { firstName: '', lastName: '', email: '', documentId: '', phone: '', address: '', password: '', confirm: '' };

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [mismatch, setMismatch] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return setMismatch('Las contraseñas no coinciden');
    setMismatch('');
    setBusy(true);
    setError(null);
    try {
      const { confirm, ...body } = form;
      const res = await auth.register(body);
      navigate('/verificar', { state: { email: res.data.email, devOtp: res.data.devOtp } });
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Crear cuenta" subtitle="Te enviaremos un código de verificación a tu correo." footer={<>¿Ya tienes cuenta? <Link to="/login" className="font-medium text-brand-600 underline">Inicia sesión</Link></>}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <ErrorBox error={error} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre">{(p) => <input {...p} className="input" autoComplete="given-name" required value={form.firstName} onChange={set('firstName')} />}</Field>
          <Field label="Apellido">{(p) => <input {...p} className="input" autoComplete="family-name" required value={form.lastName} onChange={set('lastName')} />}</Field>
        </div>
        <Field label="Correo electrónico">{(p) => <input {...p} className="input" type="email" autoComplete="email" required value={form.email} onChange={set('email')} />}</Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Documento de identidad (CI)">{(p) => <input {...p} className="input" inputMode="numeric" required value={form.documentId} onChange={set('documentId')} />}</Field>
          <Field label="Teléfono (opcional)">{(p) => <input {...p} className="input" type="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} />}</Field>
        </div>
        <Field label="Dirección (opcional)">{(p) => <input {...p} className="input" autoComplete="street-address" value={form.address} onChange={set('address')} />}</Field>
        <Field label="Contraseña" hint="8 o más caracteres, con mayúscula, minúscula y número.">
          {(p) => <input {...p} className="input" type="password" autoComplete="new-password" required value={form.password} onChange={set('password')} />}
        </Field>
        <Field label="Confirmar contraseña" error={mismatch}>
          {(p) => <input {...p} className="input" type="password" autoComplete="new-password" required value={form.confirm} onChange={set('confirm')} />}
        </Field>
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Creando cuenta…' : 'Crear cuenta'}</button>
      </form>
    </AuthShell>
  );
}
