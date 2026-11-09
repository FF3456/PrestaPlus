import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

const EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

fs.mkdirSync(env.uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, env.uploadDir),
  // Nombre aleatorio (no se usa el nombre original → evita path traversal y adivinación)
  filename: (req, file, cb) => cb(null, `${crypto.randomBytes(16).toString('hex')}${EXT[file.mimetype]}`),
});

const upload = multer({
  storage,
  limits: { fileSize: env.maxUploadMb * 1024 * 1024, files: 5 },
  fileFilter: (req, file, cb) =>
    EXT[file.mimetype] ? cb(null, true) : cb(new AppError(400, 'Solo se permiten imágenes JPG, PNG o WEBP', 'UPLOAD_ERROR')),
});

export const uploadPhotos = upload.array('photos', 5);

/** Elimina del disco archivos subidos (rollback si la operación falla). */
export async function removeFiles(files = []) {
  await Promise.all(
    files.map((f) => fs.promises.unlink(path.join(env.uploadDir, f.filename || f)).catch(() => undefined)),
  );
}
