import test from 'node:test';
import assert from 'node:assert/strict';
import { openapi } from '../src/docs/openapi.js';

const ops = Object.entries(openapi.paths).flatMap(([path, m]) => Object.entries(m).map(([method, op]) => ({ path, method, op })));

test('OpenAPI 3.0.x con seguridad Bearer JWT', () => {
  assert.match(openapi.openapi, /^3\.0\./);
  assert.equal(openapi.components.securitySchemes.bearerAuth.bearerFormat, 'JWT');
});
test('toda operación tiene resumen, tag, roles (x-roles) y respuestas', () => {
  for (const { path, method, op } of ops) {
    assert.ok(op.summary, `${method} ${path} sin summary`);
    assert.ok(op.tags?.length, `${method} ${path} sin tag`);
    assert.ok(op['x-roles']?.length, `${method} ${path} sin x-roles`);
    assert.ok(Object.keys(op.responses).length >= 1, `${method} ${path} sin respuestas`);
  }
});
test('las operaciones protegidas documentan 401', () => {
  for (const { path, method, op } of ops.filter((o) => o.op.security?.length)) {
    assert.ok(op.responses[401], `${method} ${path} sin 401`);
  }
});
test('todas las referencias $ref existen', () => {
  const text = JSON.stringify(openapi);
  for (const [, name] of text.matchAll(/#\/components\/schemas\/(\w+)/g)) {
    assert.ok(openapi.components.schemas[name], `schema ${name} no definido`);
  }
});
