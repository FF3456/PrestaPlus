import { apiOrigin } from '../utils/format.js';
import { PageHeader } from '../components/ui.jsx';

/** RF-004 · Ruta de documentación interactiva (Swagger UI servido por el backend en /api-docs). */
export default function ApiDocs() {
  const url = `${apiOrigin()}/api-docs`;
  return (
    <>
      <PageHeader
        title="Documentación de la API"
        subtitle="Swagger UI (OpenAPI 3.0): prueba los endpoints con tu token JWT desde el botón Authorize."
        actions={<><a className="btn-primary" href={url} target="_blank" rel="noreferrer">Abrir en pestaña nueva</a><a className="btn-secondary" href={`${apiOrigin()}/api-docs.json`} target="_blank" rel="noreferrer">openapi.json</a></>}
      />
      <iframe title="Swagger UI de PRESTA+" src={url} className="h-[75vh] w-full rounded-xl border border-brand-100 bg-white" />
    </>
  );
}
