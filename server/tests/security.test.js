import test from 'node:test';
import assert from 'node:assert/strict';
import { authorize } from '../src/middlewares/rbac.js';
import { validate, PASSWORD_PATTERN } from '../src/middlewares/validate.js';
import { decryptField, encryptField, maskDocument, sha256 } from '../src/utils/crypto.js';

process.env.ENCRYPTION_KEY = 'a'.repeat(64);

const run = (mw, req) => new Promise((resolve) => mw(req, {}, (err) => resolve(err)));

test('RBAC: permite rol autorizado', async () => {
  assert.equal(await run(authorize('empleado', 'admin'), { user: { role: 'empleado' } }), undefined);
});
test('RBAC: rechaza rol no autorizado con 403', async () => {
  const err = await run(authorize('empleado', 'admin'), { user: { role: 'cliente' } });
  assert.equal(err.statusCode, 403);
  assert.equal(err.code, 'FORBIDDEN');
});
test('RBAC: sin usuario autenticado responde 401', async () => {
  const err = await run(authorize('admin'), {});
  assert.equal(err.statusCode, 401);
});

test('validate: aplica lista blanca y coerción numérica', async () => {
  const req = { body: { amount: '120.5', role: 'admin', type: 'rescate' } };
  const err = await run(validate({ amount: { type: 'number', required: true, min: 1 }, type: { enum: ['rescate', 'abono_capital'] } }), req);
  assert.equal(err, undefined);
  assert.deepEqual(req.valid, { amount: 120.5, type: 'rescate' }); // "role" descartado (mass-assignment)
});
test('validate: bloquea objetos (inyección de operadores NoSQL)', async () => {
  const req = { body: { email: { $gt: '' } } };
  const err = await run(validate({ email: { required: true } }), req);
  assert.equal(err.statusCode, 400);
  assert.equal(err.details[0].field, 'email');
});
test('validate: campos obligatorios y rangos', async () => {
  const err = await run(validate({ a: { required: true }, n: { type: 'number', max: 5 } }), { body: { n: 9 } });
  assert.equal(err.details.length, 2);
});

test('política de contraseñas', () => {
  assert.ok(PASSWORD_PATTERN.test('Cliente#2026'));
  assert.ok(!PASSWORD_PATTERN.test('corta1A'));
  assert.ok(!PASSWORD_PATTERN.test('sinmayuscula123'));
});

test('AES-256-GCM: cifra y descifra; texto cifrado distinto en cada operación', () => {
  const a = encryptField('7654321');
  const b = encryptField('7654321');
  assert.notEqual(a, b);
  assert.notEqual(a, '7654321');
  assert.equal(decryptField(a), '7654321');
  // un cifrado manipulado no se descifra (GCM autenticado)
  const parts = a.split(':');
  parts[2] = Buffer.from('manipulado').toString('base64');
  assert.equal(decryptField(parts.join(':')), null);
});
test('maskDocument y sha256', () => {
  assert.equal(maskDocument('7654321'), '****321');
  assert.equal(sha256('x').length, 64);
});
