import { useState } from 'react';
import { users } from '../api/services.js';
import { useAuth } from '../context/AuthContext.jsx';
import { ROLE_LABEL } from '../utils/constants.js';
import { Alert, ErrorBox, Field, PageHeader } from '../components/ui.jsx';

/** RF-014 · Perfil: datos básicos y cambio de contraseña. */
export default function Profile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ firstName: user.firstName, lastName: user.lastName, phone: user.phone || '', address: user.address || '' });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [msg, setMsg] = useState({});
  const [err, setErr] = useState({});

  const saveProfile = async (e) => {
    e.preventDefault();
    setErr({ ...err, profile: null });
    try {
      const body = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== ''));
      setUser((await users.updateMe(body)).data);
      setMsg({ ...msg, profile: 'Perfil actualizado' });
    } catch (e2) {
      setErr({ ...err, profile: e2 });
      setMsg({ ...msg, profile: '' });
    }
  };
  const savePassword = async (e) => {
    e.preventDefault();
    setErr({ ...err, pw: null });
    try {
      await users.changePassword(pw);
      setPw({ currentPassword: '', newPassword: '' });
      setMsg({ ...msg, pw: 'Contraseña actualizada' });
    } catch (e2) {
      setErr({ ...err, pw: e2 });
      setMsg({ ...msg, pw: '' });
    }
  };

  return (
    <>
      <PageHeader title="Mi perfil" subtitle={`${user.email} · ${ROLE_LABEL[user.role]}`} />
      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={saveProfile} className="card space-y-4">
          <h2>Datos básicos</h2>
          <ErrorBox error={err.profile} />
          <Alert tone="success">{msg.profile}</Alert>
          <Field label="Nombre">{(p) => <input {...p} className="input" required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />}</Field>
          <Field label="Apellido">{(p) => <input {...p} className="input" required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />}</Field>
          <Field label="Teléfono">{(p) => <input {...p} className="input" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />}</Field>
          <Field label="Dirección">{(p) => <input {...p} className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />}</Field>
          <button className="btn-primary">Guardar cambios</button>
        </form>
        <form onSubmit={savePassword} className="card h-fit space-y-4">
          <h2>Cambiar contraseña</h2>
          <ErrorBox error={err.pw} />
          <Alert tone="success">{msg.pw}</Alert>
          <Field label="Contraseña actual">{(p) => <input {...p} className="input" type="password" autoComplete="current-password" required value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} />}</Field>
          <Field label="Nueva contraseña" hint="8 o más caracteres, con mayúscula, minúscula y número.">{(p) => <input {...p} className="input" type="password" autoComplete="new-password" required value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} />}</Field>
          <button className="btn-primary">Actualizar contraseña</button>
        </form>
      </div>
    </>
  );
}
