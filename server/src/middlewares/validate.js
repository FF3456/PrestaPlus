import { AppError } from '../utils/AppError.js';

const OBJECT_ID = /^[a-f\d]{24}$/i;

/**
 * Validación y saneamiento de entrada por lista blanca (previene mass-assignment e inyección
 * de operadores NoSQL: solo se aceptan strings/números primitivos). El resultado queda en req.valid.
 * rules: { campo: { required, type: 'string'|'number'|'boolean'|'objectId', min, max, pattern, enum, label } }
 */
export const validate =
  (rules, source = 'body') =>
  (req, res, next) => {
    const input = req[source] || {};
    const errors = [];
    const clean = {};

    for (const [field, rule] of Object.entries(rules)) {
      let value = input[field];
      const label = rule.label || field;
      if (typeof value === 'string') value = value.trim();
      if (value === undefined || value === null || value === '') {
        if (rule.required) errors.push({ field, message: `${label} es obligatorio` });
        continue;
      }
      const type = rule.type || 'string';
      if (type === 'number') {
        const n = Number(value);
        if (typeof value === 'object' || !Number.isFinite(n)) {
          errors.push({ field, message: `${label} debe ser un número` });
          continue;
        }
        if (rule.min !== undefined && n < rule.min) errors.push({ field, message: `${label} debe ser ≥ ${rule.min}` });
        if (rule.max !== undefined && n > rule.max) errors.push({ field, message: `${label} debe ser ≤ ${rule.max}` });
        value = n;
      } else if (type === 'boolean') {
        if (value === 'true' || value === true) value = true;
        else if (value === 'false' || value === false) value = false;
        else {
          errors.push({ field, message: `${label} debe ser verdadero o falso` });
          continue;
        }
      } else {
        if (typeof value !== 'string') {
          errors.push({ field, message: `${label} debe ser texto` });
          continue;
        }
        if (type === 'objectId' && !OBJECT_ID.test(value)) {
          errors.push({ field, message: `${label} no es un identificador válido` });
          continue;
        }
        if (rule.min !== undefined && value.length < rule.min)
          errors.push({ field, message: `${label} debe tener al menos ${rule.min} caracteres` });
        if (rule.max !== undefined && value.length > rule.max)
          errors.push({ field, message: `${label} debe tener máximo ${rule.max} caracteres` });
        if (rule.pattern && !rule.pattern.test(value))
          errors.push({ field, message: rule.patternMessage || `${label} tiene un formato inválido` });
      }
      if (rule.enum && !rule.enum.includes(value)) {
        errors.push({ field, message: `${label} debe ser uno de: ${rule.enum.join(', ')}` });
      }
      clean[field] = value;
    }

    if (errors.length) return next(new AppError(400, 'Datos de entrada inválidos', 'VALIDATION_ERROR', errors));
    req.valid = clean;
    return next();
  };

/** Valida que los parámetros de ruta indicados sean ObjectId válidos. */
export const validateObjectIdParams =
  (...names) =>
  (req, res, next) => {
    for (const name of names) {
      if (!OBJECT_ID.test(String(req.params[name] || ''))) {
        return next(new AppError(400, `Parámetro ${name} inválido`, 'INVALID_ID'));
      }
    }
    return next();
  };

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,72}$/;
export const PASSWORD_MESSAGE = 'La contraseña debe tener 8-72 caracteres, con mayúscula, minúscula y número';
