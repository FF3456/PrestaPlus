/** Envuelve controladores async para delegar los errores al middleware global. */
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
