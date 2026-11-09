import { useEffect, useMemo, useRef } from 'react';

const MAX_FILES = 5;
const MAX_MB = 5;
const TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** Carga de fotografías (1-5 imágenes JPG/PNG/WEBP, máx. 5 MB) con vista previa. */
export default function PhotoUploader({ files, onChange, onError }) {
  const input = useRef(null);
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach(URL.revokeObjectURL), [previews]);

  const add = (list) => {
    const next = [...files];
    for (const f of list) {
      if (!TYPES.includes(f.type)) return onError(`"${f.name}" no es una imagen JPG, PNG o WEBP`);
      if (f.size > MAX_MB * 1024 * 1024) return onError(`"${f.name}" supera ${MAX_MB} MB`);
      if (next.length >= MAX_FILES) return onError(`Máximo ${MAX_FILES} fotografías`);
      next.push(f);
    }
    onError('');
    onChange(next);
  };

  return (
    <div>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          add([...e.dataTransfer.files]);
        }}
        className="rounded-xl border-2 border-dashed border-brand-500/60 bg-white p-6 text-center"
      >
        <p className="font-medium">Arrastra las fotos aquí o selecciónalas</p>
        <p className="mb-3 text-xs text-ink-600">Entre 1 y {MAX_FILES} imágenes · JPG, PNG o WEBP · máx. {MAX_MB} MB c/u</p>
        <button type="button" className="btn-secondary" onClick={() => input.current?.click()}>
          Elegir fotografías
        </button>
        <input ref={input} type="file" accept={TYPES.join(',')} multiple className="sr-only" aria-label="Seleccionar fotografías" onChange={(e) => { add([...e.target.files]); e.target.value = ''; }} />
      </div>
      {files.length > 0 && (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="relative overflow-hidden rounded-lg border border-brand-100 bg-white">
              <img src={previews[i]} alt={`Fotografía ${i + 1}: ${f.name}`} className="aspect-square w-full object-cover" />
              <button type="button" className="absolute right-1 top-1 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-danger-700 shadow" aria-label={`Quitar fotografía ${i + 1}`} onClick={() => onChange(files.filter((_, j) => j !== i))}>
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
