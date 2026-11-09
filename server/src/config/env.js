import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const bool = (v, d = false) => (v === undefined ? d : String(v).toLowerCase() === 'true');
const int = (v, d) => (Number.isFinite(parseInt(v, 10)) ? parseInt(v, 10) : d);

const nodeEnv = process.env.NODE_ENV || 'development';

export const env = {
  nodeEnv,
  isProd: nodeEnv === 'production',
  isTest: nodeEnv === 'test',
  port: int(process.env.PORT, 4000),
  clientUrls: (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map((s) => s.trim()),
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '60m',
  bcryptRounds: Math.max(10, int(process.env.BCRYPT_SALT_ROUNDS, 10)),
  otpTtlMinutes: int(process.env.OTP_TTL_MINUTES, 10),
  resetTtlMinutes: int(process.env.RESET_TOKEN_TTL_MINUTES, 30),
  exposeDevCodes: bool(process.env.DEV_EXPOSE_CODES, false),
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: int(process.env.SMTP_PORT, 587),
    secure: bool(process.env.SMTP_SECURE, false),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'PRESTA+ <no-reply@prestamas.local>',
  },
  uploadDir: path.resolve(root, process.env.UPLOAD_DIR || 'uploads'),
  maxUploadMb: int(process.env.MAX_UPLOAD_MB, 5),
  rateLimitMax: int(process.env.RATE_LIMIT_MAX, 300),
  authRateLimitMax: int(process.env.AUTH_RATE_LIMIT_MAX, 20),
};

/** Falla rápido si falta configuración crítica (se llama al arrancar el servidor). */
export function assertEnv() {
  const missing = [];
  if (!env.mongoUri) missing.push('MONGODB_URI');
  if (!env.jwtSecret || env.jwtSecret.length < 32) missing.push('JWT_SECRET (mínimo 32 caracteres)');
  if (!/^[0-9a-fA-F]{64}$/.test(process.env.ENCRYPTION_KEY || '')) missing.push('ENCRYPTION_KEY (64 caracteres hex)');
  if (missing.length) {
    throw new Error(`Configuración incompleta. Revise su archivo .env: ${missing.join(', ')}`);
  }
  if (env.isProd && env.exposeDevCodes) {
    throw new Error('DEV_EXPOSE_CODES debe ser false en producción');
  }
}
