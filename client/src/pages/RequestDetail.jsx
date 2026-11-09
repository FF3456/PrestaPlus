import { useState } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import { requests } from '../api/services.js';
import { useFetch } from '../utils/hooks.js';
import { assetUrl, date, money } from '../utils/format.js';
import { CATEGORY_LABEL, CONDITION_LABEL } from '../utils/constants.js';
import { Alert, DL, ErrorBox, Field, Modal, PageHeader, Spinner, StatusBadge } from '../components/ui.jsx';

/** CU-03 · Evaluar y aprobar préstamo: tasación (RF-006), aprobación/rechazo (RF-007) y contrato (RF-008). */
export default function RequestDetail() {
  const { id } = useParams();
  const { base } = useOutletContext();
  const { data, loading, error, reload } = useFetch(() => requests.get(id), [id]);
  const [marketValue, setMarketValue] = useState('');
  const [approved, setApproved] = useState('');
  const [termDays, setTermDays] = useState('');
  const [location, setLocation] = useState('');
  const [reason, setReason] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [okLoan, setOkLoan] = useState(null);

  if (loading && !data) return <Spinner />;
  if (error) return <ErrorBox error={error} />;
  const r = data.data;
  const c = r.collateral;
  const open = r.status === 'en_evaluacion';

  const act = async (fn) => {
    setBusy(true);
    setErr(null);
    try { return await fn(); } catch (e) { setErr(e); return null; } finally { setBusy(false); }
  };
  const appraise = () => act(async () => { await requests.appraise(id, Number(marketValue)); setApproved(''); reload(); });
  const approve = () => act(async () => {
    const res = await requests.approve(id, { approvedAmount: Number(approved), ...(termDays ? { termDays: Number(termDays) } : {}), ...(location ? { custodyLocation: location } : {}) });
    setOkLoan(res.data.loan);
    reload();
  });
  const reject = () => act(async () => { await requests.reject(id, reason); setRejecting(false); reload(); });

  return (
    <>
      <PageHeader title={`${c.brand} ${c.model}`} subtitle={`Solicitud de ${r.client.firstName} ${r.client.lastName} · ${date(r.createdAt)}`} actions={<><StatusBadge status={r.status} /><Link to={`${base}/solicitudes`} className="btn-secondary !min-h-[36px]">Volver</Link></>} />
      {okLoan && <Alert tone="success" className="mb-4">Préstamo aprobado. Contrato <strong>{okLoan.contractNumber}</strong> generado. <Link className="underline" to={`${base}/prestamos/${okLoan.id}`}>Ver préstamo</Link></Alert>}
      <ErrorBox error={err} className="mb-4" />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="card">
            <h3 className="mb-3">Fotografías</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {c.photos.map((p, i) => <a key={p.url} href={assetUrl(p.url)} target="_blank" rel="noreferrer"><img src={assetUrl(p.url)} alt={`Fotografía ${i + 1} de ${c.brand} ${c.model}`} className="aspect-square w-full rounded-lg bg-brand-50 object-cover" /></a>)}
            </div>
          </section>
          <section className="card">
            <h3 className="mb-3">Datos de la garantía</h3>
            <DL items={[['Categoría', CATEGORY_LABEL[c.category]], ['Estado físico', CONDITION_LABEL[c.condition]], ['Serie / IMEI', c.serialNumber], ['Valor declarado', money(c.declaredValue)], ['Descripción', c.description || '—']]} />
          </section>
          <section className="card">
            <h3 className="mb-3">Cliente</h3>
            <DL items={[['Nombre', `${r.client.firstName} ${r.client.lastName}`], ['Correo', r.client.email], ['Teléfono', r.client.phone]]} />
          </section>
        </div>

        <div className="space-y-6">
          <section className="card">
            <h3 className="mb-3">Pre-evaluación del cliente</h3>
            <DL items={[['Solicita', money(r.requestedAmount)], ['Plazo', `${r.termDays} días`], ['Valor estimado', money(r.preEvaluation?.estimatedValue)], ['Préstamo estimado', money(r.preEvaluation?.estimatedLoan)]]} />
          </section>

          {open && (
            <section className="card space-y-4">
              <h3>1. Tasación</h3>
              <Field label="Valor estimado de mercado (Bs)">{(p) => <input {...p} className="input" type="number" min="1" step="0.01" inputMode="decimal" value={marketValue} onChange={(e) => setMarketValue(e.target.value)} />}</Field>
              <button className="btn-secondary w-full" disabled={busy || !marketValue} onClick={appraise}>Calcular monto máximo</button>
              {r.appraisal?.maxLoan !== undefined && (
                <div className="rounded-lg bg-success-50 p-3 text-success-700">
                  <p>Valor de mercado: <strong>{money(r.appraisal.marketValue)}</strong></p>
                  <p>Monto máximo: <strong>{money(r.appraisal.maxLoan)}</strong></p>
                  <p>Tasa de interés: <strong>{r.appraisal.monthlyRate}% mensual</strong></p>
                </div>
              )}
            </section>
          )}

          {open && r.appraisal?.maxLoan !== undefined && (
            <section className="card space-y-4">
              <h3>2. Resolución</h3>
              <Field label="Monto aprobado (Bs)" hint={`Máximo ${money(r.appraisal.maxLoan)}`}>{(p) => <input {...p} className="input" type="number" min="1" step="0.01" max={r.appraisal.maxLoan} inputMode="decimal" value={approved} onChange={(e) => setApproved(e.target.value)} />}</Field>
              <Field label="Plazo (días)" hint={`Por defecto ${r.termDays}`}>{(p) => <input {...p} className="input" type="number" min="7" max="180" value={termDays} onChange={(e) => setTermDays(e.target.value)} />}</Field>
              <Field label="Ubicación en custodia" hint="Ej.: Bóveda A-12">{(p) => <input {...p} className="input" maxLength={60} value={location} onChange={(e) => setLocation(e.target.value)} />}</Field>
              <button className="btn-primary w-full" disabled={busy || !approved} onClick={approve}>Aprobar y generar contrato</button>
              <button className="btn-danger w-full" disabled={busy} onClick={() => setRejecting(true)}>Rechazar solicitud</button>
            </section>
          )}
          {open && r.appraisal?.maxLoan === undefined && <button className="btn-danger w-full" onClick={() => setRejecting(true)}>Rechazar solicitud</button>}

          {!open && (
            <section className="card">
              <h3 className="mb-2">Resolución</h3>
              {r.status === 'aprobada' ? <p>Aprobada por {money(r.approvedAmount)}. {r.loan && <Link className="text-brand-600 underline" to={`${base}/prestamos/${(r.loan.id || r.loan._id)}`}>Ver contrato {r.loan.contractNumber}</Link>}</p> : <p className="text-danger-700">Rechazada: {r.rejectionReason}</p>}
            </section>
          )}
        </div>
      </div>

      {rejecting && (
        <Modal title="Rechazar solicitud" onClose={() => setRejecting(false)} footer={<><button className="btn-secondary" onClick={() => setRejecting(false)}>Cancelar</button><button className="btn-danger" disabled={busy || reason.trim().length < 5} onClick={reject}>Confirmar rechazo</button></>}>
          <Field label="Motivo (se enviará al cliente)">{(p) => <textarea {...p} className="input py-2" rows={4} maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} />}</Field>
        </Modal>
      )}
    </>
  );
}
