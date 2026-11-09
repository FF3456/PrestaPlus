import { useEffect, useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { collaterals, requests } from '../api/services.js';
import { CATEGORY_LABEL, CONDITION_LABEL } from '../utils/constants.js';
import { useDebounced } from '../utils/hooks.js';
import { money } from '../utils/format.js';
import { Alert, DL, ErrorBox, Field, PageHeader } from '../components/ui.jsx';
import PhotoUploader from '../components/PhotoUploader.jsx';

const STEPS = ['Garantía', 'Fotografías', 'Confirmar'];
const EMPTY = { category: 'electronica', brand: '', model: '', serialNumber: '', condition: 'bueno', declaredValue: '', description: '' };

/** CU-02 · Solicitar préstamo y registrar garantía (asistente de 3 pasos con pre-evaluación RF-005). */
export default function NewRequest() {
  const navigate = useNavigate();
  const { base } = useOutletContext();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(EMPTY);
  const [files, setFiles] = useState([]);
  const [fileError, setFileError] = useState('');
  const [estimate, setEstimate] = useState(null);
  const [amount, setAmount] = useState('');
  const [termDays, setTermDays] = useState(30);
  const [collateralId, setCollateralId] = useState(null); // si falla la solicitud, se reutiliza la garantía ya creada
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [stepError, setStepError] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const debounced = useDebounced({ c: form.category, s: form.condition, v: form.declaredValue }, 450);
  useEffect(() => {
    const value = Number(debounced.v);
    if (!value || value <= 0) return setEstimate(null);
    collaterals
      .preEvaluate({ category: debounced.c, condition: debounced.s, declaredValue: value })
      .then((r) => setEstimate(r.data))
      .catch(() => setEstimate(null));
  }, [debounced]);

  const next = () => {
    setStepError('');
    if (step === 0) {
      const missing = ['brand', 'model', 'serialNumber', 'declaredValue'].filter((k) => !String(form[k]).trim());
      if (missing.length) return setStepError('Completa marca, modelo, número de serie/IMEI y valor declarado.');
    }
    if (step === 1 && files.length === 0) return setStepError('Adjunta al menos una fotografía de la garantía.');
    if (step === 1 && !amount && estimate) setAmount(String(estimate.estimatedLoan));
    setStep(step + 1);
  };

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      let id = collateralId;
      if (!id) {
        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => v !== '' && fd.append(k, v));
        files.forEach((f) => fd.append('photos', f));
        id = (await collaterals.create(fd)).data.collateral.id;
        setCollateralId(id);
      }
      await requests.create({ collateralId: id, requestedAmount: Number(amount), termDays: Number(termDays) });
      navigate(`${base}/solicitudes`, { state: { sent: true } });
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="Solicitar préstamo" subtitle="Registra tu garantía y recibe una estimación inmediata. Un tasador confirmará el valor final." />
      <ol className="mb-6 flex gap-2" aria-label="Progreso">
        {STEPS.map((s, i) => (
          <li key={s} aria-current={i === step ? 'step' : undefined} className={`flex-1 rounded-lg px-3 py-2 text-center text-xs font-medium sm:text-sm ${i === step ? 'bg-brand-600 text-white' : i < step ? 'bg-brand-100 text-brand-700' : 'border border-brand-100 bg-white text-ink-600'}`}>
            {i + 1}. {s}
          </li>
        ))}
      </ol>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="card">
          {stepError && <Alert className="mb-4">{stepError}</Alert>}
          {step === 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Categoría">{(p) => <select {...p} className="input" value={form.category} onChange={set('category')}>{Object.entries(CATEGORY_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>}</Field>
              <Field label="Estado físico">{(p) => <select {...p} className="input" value={form.condition} onChange={set('condition')}>{Object.entries(CONDITION_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>}</Field>
              <Field label="Marca">{(p) => <input {...p} className="input" value={form.brand} onChange={set('brand')} />}</Field>
              <Field label="Modelo">{(p) => <input {...p} className="input" value={form.model} onChange={set('model')} />}</Field>
              <Field label="Número de serie o IMEI">{(p) => <input {...p} className="input" value={form.serialNumber} onChange={set('serialNumber')} />}</Field>
              <Field label="Valor aproximado de tu bien (Bs)" hint="Cuánto crees que vale hoy.">{(p) => <input {...p} className="input" type="number" min="1" step="0.01" inputMode="decimal" value={form.declaredValue} onChange={set('declaredValue')} />}</Field>
              <Field className="sm:col-span-2" label="Descripción (opcional)">{(p) => <textarea {...p} className="input py-2" rows={3} maxLength={500} value={form.description} onChange={set('description')} />}</Field>
            </div>
          )}
          {step === 1 && <PhotoUploader files={files} onChange={setFiles} onError={setFileError} />}
          {step === 1 && fileError && <Alert className="mt-3">{fileError}</Alert>}
          {step === 2 && (
            <div className="space-y-5">
              <DL items={[
                ['Bien', `${form.brand} ${form.model}`],
                ['Categoría', CATEGORY_LABEL[form.category]],
                ['Serie / IMEI', form.serialNumber],
                ['Estado', CONDITION_LABEL[form.condition]],
                ['Valor declarado', money(form.declaredValue)],
                ['Fotografías', `${files.length} adjunta(s)`],
              ]} />
              <div className="grid gap-4 border-t border-brand-100 pt-5 sm:grid-cols-2">
                <Field label="Monto que solicitas (Bs)" hint={estimate ? `Máximo estimado: ${money(estimate.estimatedLoan)}` : undefined}>
                  {(p) => <input {...p} className="input" type="number" min="1" step="0.01" max={estimate?.estimatedLoan} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />}
                </Field>
                <Field label="Plazo">{(p) => <select {...p} className="input" value={termDays} onChange={(e) => setTermDays(e.target.value)}>{[30, 60, 90].map((d) => <option key={d} value={d}>{d} días</option>)}</select>}</Field>
              </div>
              <ErrorBox error={error} />
              {collateralId && <Alert tone="info">Tu garantía ya quedó registrada. Corrige el dato indicado y vuelve a enviar la solicitud.</Alert>}
            </div>
          )}
          <div className="mt-6 flex justify-between gap-3">
            {step > 0 ? <button className="btn-secondary" onClick={() => setStep(step - 1)} disabled={busy}>Atrás</button> : <Link className="btn-secondary" to={base}>Cancelar</Link>}
            {step < 2 ? <button className="btn-primary" onClick={next}>Continuar</button> : <button className="btn-primary" onClick={submit} disabled={busy || !amount}>{busy ? 'Enviando…' : 'Enviar solicitud'}</button>}
          </div>
        </section>

        <aside className="card h-fit bg-brand-50" aria-live="polite">
          <h3>Estimación inicial</h3>
          {estimate ? (
            <dl className="mt-3 space-y-3">
              <div><dt className="text-xs text-ink-600">Valor estimado del bien</dt><dd className="text-lg font-semibold text-brand-600">{money(estimate.estimatedValue)}</dd></div>
              <div><dt className="text-xs text-ink-600">Préstamo disponible (hasta)</dt><dd className="text-2xl font-semibold text-brand-600">{money(estimate.estimatedLoan)}</dd></div>
              <div><dt className="text-xs text-ink-600">Tasa de interés referencial</dt><dd className="font-medium">{estimate.monthlyRate}% mensual</dd></div>
            </dl>
          ) : (
            <p className="mt-2 text-ink-600">Indica la categoría, el estado y el valor aproximado para ver cuánto podrías recibir.</p>
          )}
          <p className="mt-4 text-xs text-ink-600">Es un cálculo referencial. El monto final lo define el tasador al revisar tu garantía.</p>
        </aside>
      </div>
    </>
  );
}
