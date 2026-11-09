export const ROLES = Object.freeze({
  CLIENT: 'cliente',
  EMPLOYEE: 'empleado',
  ADMIN: 'admin',
});
export const STAFF_ROLES = [ROLES.EMPLOYEE, ROLES.ADMIN];

export const CATEGORIES = ['electronica', 'joyas', 'herramientas', 'vehiculos', 'otros'];
export const CONDITIONS = ['excelente', 'bueno', 'regular', 'malo'];

export const COLLATERAL_STATUS = Object.freeze({
  REGISTERED: 'registrada',
  IN_EVALUATION: 'en_evaluacion',
  IN_CUSTODY: 'en_custodia',
  RESCUED: 'rescatada',
  REJECTED: 'rechazada',
});

export const REQUEST_STATUS = Object.freeze({
  IN_EVALUATION: 'en_evaluacion',
  APPROVED: 'aprobada',
  REJECTED: 'rechazada',
});

export const LOAN_STATUS = Object.freeze({
  ACTIVE: 'activo',
  OVERDUE: 'vencido',
  RESCUED: 'rescatado',
});

export const PAYMENT_TYPES = ['abono_capital', 'pago_interes', 'renovacion', 'rescate'];

export const NOTIFICATION_TYPES = [
  'solicitud_aprobada',
  'solicitud_rechazada',
  'pago_registrado',
  'renovacion',
  'rescate',
  'vencimiento_proximo',
  'prestamo_vencido',
  'sistema',
];

/** Porcentaje del valor de mercado que se presta (loan-to-value) por categoría. */
export const LOAN_TO_VALUE = Object.freeze({
  electronica: 0.5,
  joyas: 0.7,
  herramientas: 0.5,
  vehiculos: 0.6,
  otros: 0.4,
});

/** Tasa de interés mensual (%) por categoría. */
export const MONTHLY_RATE = Object.freeze({
  electronica: 4,
  joyas: 3,
  herramientas: 3.5,
  vehiculos: 2.5,
  otros: 4.5,
});

/** Factor de depreciación por estado físico (pre-evaluación del cliente). */
export const CONDITION_FACTOR = Object.freeze({
  excelente: 0.8,
  bueno: 0.65,
  regular: 0.45,
  malo: 0.25,
});

export const DEFAULT_TERM_DAYS = 30;
export const MIN_TERM_DAYS = 7;
export const MAX_TERM_DAYS = 180;
export const DUE_SOON_DAYS = 7;
