/**
 * Exporta la especificación OpenAPI y una colección Postman a /docs.
 * Uso: npm run docs:export
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openapi } from '../src/docs/openapi.js';

const docsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'docs');
fs.mkdirSync(path.join(docsDir, 'postman'), { recursive: true });

const spec = { ...openapi, servers: [{ url: 'http://localhost:4000/api', description: 'Local' }] };
fs.writeFileSync(path.join(docsDir, 'openapi.json'), JSON.stringify(spec, null, 2));

// ---- Colección Postman v2.1 generada desde OpenAPI ----
const sampleFromSchema = (schema, depth = 0) => {
  if (!schema || depth > 3) return undefined;
  if (schema.example !== undefined) return schema.example;
  if (schema.enum) return schema.enum[0];
  if (schema.type === 'object') {
    const o = {};
    for (const [k, v] of Object.entries(schema.properties || {})) {
      const s = sampleFromSchema(v, depth + 1);
      if (s !== undefined) o[k] = s;
    }
    return o;
  }
  if (schema.type === 'array') return [];
  if (schema.type === 'number' || schema.type === 'integer') return 0;
  if (schema.type === 'boolean') return true;
  return 'string';
};

const folders = new Map();
for (const [route, methods] of Object.entries(spec.paths)) {
  for (const [method, op] of Object.entries(methods)) {
    const url = route.replace(/\{(\w+)\}/g, ':$1');
    const isForm = op.requestBody?.content?.['multipart/form-data'];
    const schema = op.requestBody?.content?.['application/json']?.schema;
    const item = {
      name: `${method.toUpperCase()} ${route} — ${op.summary}`,
      request: {
        method: method.toUpperCase(),
        header: [],
        url: {
          raw: `{{baseUrl}}${url}`,
          host: ['{{baseUrl}}'],
          path: url.split('/').filter(Boolean),
          variable: [...route.matchAll(/\{(\w+)\}/g)].map((m) => ({ key: m[1], value: `{{${m[1]}}}` })),
        },
        ...(op.security?.length ? { auth: { type: 'bearer', bearer: [{ key: 'token', value: '{{token}}', type: 'string' }] } } : { auth: { type: 'noauth' } }),
        ...(schema ? { body: { mode: 'raw', raw: JSON.stringify(sampleFromSchema(schema), null, 2), options: { raw: { language: 'json' } } } } : {}),
        ...(isForm
          ? {
              body: {
                mode: 'formdata',
                formdata: Object.entries(isForm.schema.properties).map(([k, v]) =>
                  v.type === 'array' ? { key: k, type: 'file', src: [] } : { key: k, value: String(sampleFromSchema(v)), type: 'text' },
                ),
              },
            }
          : {}),
      },
    };
    // Guarda el token automáticamente al iniciar sesión / verificar OTP
    if (route === '/auth/login' || route === '/auth/verify-otp') {
      item.event = [{ listen: 'test', script: { type: 'text/javascript', exec: ["const r = pm.response.json();", "if (r.data && r.data.token) pm.collectionVariables.set('token', r.data.token);"] } }];
    }
    const tag = op.tags[0];
    if (!folders.has(tag)) folders.set(tag, []);
    folders.get(tag).push(item);
  }
}

const collection = {
  info: {
    name: 'PRESTA+ API',
    description: 'Colección generada desde docs/openapi.json. Ejecute primero "POST /auth/login": el token se guarda en {{token}}.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  variable: [
    { key: 'baseUrl', value: 'http://localhost:4000/api' },
    { key: 'token', value: '' },
    { key: 'id', value: '' },
  ],
  item: [...folders.entries()].map(([name, item]) => ({ name, item })),
};
fs.writeFileSync(path.join(docsDir, 'postman', 'PRESTA+.postman_collection.json'), JSON.stringify(collection, null, 2));
console.log('Exportado: docs/openapi.json y docs/postman/PRESTA+.postman_collection.json');
