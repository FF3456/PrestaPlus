import crypto from 'node:crypto';

/** AES-256-GCM para datos sensibles en reposo (RNF-002). Formato: iv:tag:cifrado (base64). */
const ALGO = 'aes-256-gcm';

function getKey() {
  const hex = process.env.ENCRYPTION_KEY || '';
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error('ENCRYPTION_KEY debe ser una cadena hexadecimal de 64 caracteres (32 bytes)');
  }
  return Buffer.from(hex, 'hex');
}

export function encryptField(plain) {
  if (plain === undefined || plain === null || plain === '') return plain;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const enc = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  return [iv.toString('base64'), cipher.getAuthTag().toString('base64'), enc.toString('base64')].join(':');
}

export function decryptField(stored) {
  if (typeof stored !== 'string') return stored;
  const parts = stored.split(':');
  if (parts.length !== 3) return stored; // valor legado o no cifrado
  try {
    const [iv, tag, data] = parts.map((p) => Buffer.from(p, 'base64'));
    const decipher = crypto.createDecipheriv(ALGO, getKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
}

export const sha256 = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');
export const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');
export const randomOtp = () => String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');

/** Enmascara un documento: ****123 */
export const maskDocument = (doc) =>
  doc ? `${'*'.repeat(Math.max(0, String(doc).length - 3))}${String(doc).slice(-3)}` : null;
