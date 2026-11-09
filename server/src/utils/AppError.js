/** Error operacional controlado: se serializa con el formato estándar de la API. */
export class AppError extends Error {
  constructor(statusCode, message, code = 'ERROR', details = undefined) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
  }
}
