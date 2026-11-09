import mongoose from 'mongoose';
import multer from 'multer';
import { AppError } from '../utils/AppError.js';
import { env } from '../config/env.js';

export const notFound = (req, res, next) =>
  next(new AppError(404, `Ruta no encontrada: ${req.method} ${req.originalUrl}`, 'NOT_FOUND'));

/** Formato uniforme de error: { success:false, message, code, details? } */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let e = err;

  if (e instanceof mongoose.Error.ValidationError) {
    e = new AppError(
      400,
      'Datos inválidos',
      'VALIDATION_ERROR',
      Object.values(e.errors).map((x) => ({ field: x.path, message: x.message })),
    );
  } else if (e instanceof mongoose.Error.CastError) {
    e = new AppError(400, `Valor inválido para ${e.path}`, 'INVALID_ID');
  } else if (e?.code === 11000) {
    const field = Object.keys(e.keyPattern || {})[0] || 'campo';
    e = new AppError(409, `Ya existe un registro con ese valor de ${field}`, 'DUPLICATE_KEY', { field });
  } else if (e instanceof multer.MulterError) {
    const msg = e.code === 'LIMIT_FILE_SIZE' ? `Cada imagen debe pesar máximo ${env.maxUploadMb} MB` : `Error al subir archivos (${e.code})`;
    e = new AppError(400, msg, 'UPLOAD_ERROR');
  } else if (e?.type === 'entity.parse.failed') {
    e = new AppError(400, 'JSON malformado', 'INVALID_JSON');
  } else if (e?.type === 'entity.too.large') {
    e = new AppError(413, 'Solicitud demasiado grande', 'PAYLOAD_TOO_LARGE');
  }

  const status = e.isOperational ? e.statusCode : 500;
  if (status >= 500) console.error('[error]', err);

  res.status(status).json({
    success: false,
    message: status >= 500 && env.isProd ? 'Error interno del servidor' : e.message,
    code: e.isOperational ? e.code : 'INTERNAL_ERROR',
    ...(e.details ? { details: e.details } : {}),
  });
}
