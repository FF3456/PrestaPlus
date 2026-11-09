import { useState } from 'react';
import { users } from '../api/services.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useFetch } from '../utils/hooks.js';
import { ROLE_LABEL } from '../utils/constants.js';
import { Alert, ErrorBox, Field, Modal, PageHeader, Pagination, Spinner, Table } from '../components/ui.jsx';

const EMPTY = { firstName: '', lastName: '', email: '', password: '', role: 'empleado' };

/** Administración de usuarios (solo rol admin): alta de personal y activación/desactivación. */
export default function Users() {
  const { user: me } = useAuth();
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const { data, loading, error, reload } = useFetch(() => users.list({ page, limit: 15 }), [page]);

  const create = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await users.createStaff(form);
      setCreating(false);
      setForm(EMPTY);
      reload();
    } catch (e2) {
      setErr(e2);
    } finally {
      setBusy(false);
    }
  };
  const toggle = (u) => users.setActive(u.id, !u.active).then(reload).catch(setErr);

  return (
    <>
      <PageHeader title="Usuarios" subtitle="Cuentas de clientes y personal." actions={<button className="btn-primary" onClick={() => setCreating(true)}>Nuevo empleado</button>} />
      {loading && <Spinner />}
      <ErrorBox error={error || (!creating && err)} className="mb-4" />
      {data && (
        <Table head={['Nombre', 'Correo', 'Rol', 'Estado', '']}>
          {data.data.map((u) => (
            <tr key={u.id}>
              <td className="td font-medium">{u.firstName} {u.lastName}</td>
              <td className="td">{u.email}</td>
              <td className="td">{ROLE_LABEL[u.role]}</td>
              <td className="td">{u.active ? 'Activo' : 'Desactivado'}{!u.isVerified && ' · sin verificar'}</td>
              <td className="td text-right">{u.id !== me.id && <button className="btn-secondary !min-h-[36px]" onClick={() => toggle(u)}>{u.active ? 'Desactivar' : 'Activar'}</button>}</td>
            </tr>
          ))}
        </Table>
      )}
      <Pagination meta={data?.meta} onPage={setPage} />
      {creating && (
        <Modal title="Nuevo empleado" onClose={() => setCreating(false)}>
          <form onSubmit={create} className="space-y-4">
            <ErrorBox error={err} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nombre">{(p) => <input {...p} className="input" required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />}</Field>
              <Field label="Apellido">{(p) => <input {...p} className="input" required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />}</Field>
            </div>
            <Field label="Correo">{(p) => <input {...p} className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />}</Field>
            <Field label="Rol">{(p) => <select {...p} className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option value="empleado">Empleado</option><option value="admin">Administrador</option></select>}</Field>
            <Field label="Contraseña inicial" hint="8 o más caracteres, con mayúscula, minúscula y número.">{(p) => <input {...p} className="input" type="password" autoComplete="new-password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />}</Field>
            <Alert tone="info">La cuenta se crea ya verificada.</Alert>
            <button className="btn-primary w-full" disabled={busy}>{busy ? 'Creando…' : 'Crear cuenta'}</button>
          </form>
        </Modal>
      )}
    </>
  );
}
