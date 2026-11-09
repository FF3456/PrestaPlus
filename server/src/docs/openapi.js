import { CATEGORIES, CONDITIONS, PAYMENT_TYPES, ROLES, STAFF_ROLES } from '../constants/index.js';

/**
 * Especificación OpenAPI 3.0.3 de la API PRESTA+ (se sirve en /api-docs con Swagger UI).
 * Cada operación declara `x-roles` (RBAC) para trazar la matriz de permisos.
 */
const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const json = (schema, example) => ({ 'application/json': { schema, ...(example ? { example } : {}) } });
const idParam = (name = 'id', description = 'Identificador (ObjectId de MongoDB)') => ({
  name, in: 'path', required: true, description, schema: { type: 'string', pattern: '^[a-f\\d]{24}$', example: '665f1c2e8b3a4c0012a4b5c6' },
});
const queryParam = (name, description, schema = { type: 'string' }) => ({ name, in: 'query', required: false, description, schema });
const pagination = [
  queryParam('page', 'Número de página (por defecto 1)', { type: 'integer', minimum: 1, default: 1 }),
  queryParam('limit', 'Elementos por página (máx. 100)', { type: 'integer', minimum: 1, maximum: 100, default: 20 }),
];

const R = {
  400: { description: 'Datos de entrada inválidos', content: json(ref('Error'), { success: false, message: 'Datos de entrada inválidos', code: 'VALIDATION_ERROR', details: [{ field: 'email', message: 'Correo electrónico inválido' }] }) },
  401: { description: 'No autenticado o token inválido/expirado', content: json(ref('Error'), { success: false, message: 'Token inválido', code: 'AUTH_INVALID_TOKEN' }) },
  403: { description: 'Sin permisos (RBAC) o recurso ajeno', content: json(ref('Error'), { success: false, message: 'No tienes permisos para realizar esta acción', code: 'FORBIDDEN' }) },
  404: { description: 'Recurso no encontrado', content: json(ref('Error'), { success: false, message: 'Recurso no encontrado', code: 'NOT_FOUND' }) },
  409: { description: 'Conflicto de estado o duplicado', content: json(ref('Error'), { success: false, message: 'La solicitud ya fue resuelta', code: 'INVALID_STATE' }) },
  422: { description: 'Regla de negocio no satisfecha', content: json(ref('Error'), { success: false, message: 'El monto aprobado excede el máximo permitido', code: 'AMOUNT_EXCEEDS_MAX' }) },
  429: { description: 'Demasiadas solicitudes (rate limit)', content: json(ref('Error')) },
};

const ok = (description, schema) => ({ description, content: json(schema) });
const envelope = (dataSchema, extra = {}) => ({
  type: 'object',
  properties: { success: { type: 'boolean', example: true }, data: dataSchema, ...extra },
});
const listOf = (name) =>
  envelope({ type: 'array', items: ref(name) }, { meta: ref('PageMeta') });

function operation({ tag, summary, description, roles, params = [], body, bodyType = 'application/json', responses }) {
  const secured = roles !== 'public';
  const codes = {};
  for (const [code, value] of Object.entries(responses)) codes[code] = typeof value === 'object' && value.description ? value : R[code];
  if (secured) codes[401] = R[401];
  if (secured && roles.length < 3) codes[403] = R[403];
  return {
    tags: [tag],
    summary,
    ...(description ? { description } : {}),
    'x-roles': roles === 'public' ? ['público'] : roles,
    ...(secured ? { security: [{ bearerAuth: [] }] } : { security: [] }),
    ...(params.length ? { parameters: params } : {}),
    ...(body ? { requestBody: { required: true, content: { [bodyType]: { schema: body } } } } : {}),
    responses: codes,
  };
}

const ANY = Object.values(ROLES);
const STAFF = STAFF_ROLES;
const CLIENT = [ROLES.CLIENT];
const ADMIN = [ROLES.ADMIN];

const emailField = { type: 'string', format: 'email', example: 'cliente@ejemplo.com' };
const passwordField = { type: 'string', format: 'password', minLength: 8, maxLength: 72, description: '8-72 caracteres con mayúscula, minúscula y número', example: 'Cliente#2026' };

const paths = {
  '/health': { get: operation({ tag: 'Sistema', summary: 'Estado del servicio y de la base de datos', roles: 'public', responses: { 200: ok('Servicio operativo', envelope({ type: 'object', properties: { status: { type: 'string', example: 'ok' }, db: { type: 'string', example: 'connected' }, uptime: { type: 'number' } } })) } }) },

  // ---------- Autenticación ----------
  '/auth/register': { post: operation({ tag: 'Autenticación', summary: 'Registrar cliente y enviar OTP por correo (RF-001)', roles: 'public',
    body: { type: 'object', required: ['firstName', 'lastName', 'email', 'password', 'documentId'], properties: { firstName: { type: 'string', example: 'Carlos' }, lastName: { type: 'string', example: 'Mendoza' }, email: emailField, password: passwordField, documentId: { type: 'string', description: 'CI; se almacena cifrado con AES-256-GCM', example: '7654321' }, phone: { type: 'string', example: '+591 70012345' }, address: { type: 'string' } } },
    responses: { 201: ok('Cuenta creada; se envió un código OTP al correo', envelope({ type: 'object', properties: { email: emailField, devOtp: { type: 'string', description: 'Solo si DEV_EXPOSE_CODES=true' } } })), 400: 1, 409: 1, 429: 1 } }) },
  '/auth/verify-otp': { post: operation({ tag: 'Autenticación', summary: 'Verificar OTP y abrir sesión (RF-001)', roles: 'public',
    body: { type: 'object', required: ['email', 'code'], properties: { email: emailField, code: { type: 'string', pattern: '^\\d{6}$', example: '482913' } } },
    responses: { 200: ok('Cuenta verificada; devuelve JWT', ref('AuthResponse')), 400: 1, 429: 1 } }) },
  '/auth/resend-otp': { post: operation({ tag: 'Autenticación', summary: 'Reenviar código OTP', roles: 'public', body: { type: 'object', required: ['email'], properties: { email: emailField } }, responses: { 200: ok('Respuesta genérica (no revela si el correo existe)', envelope({ type: 'object' })), 400: 1, 429: 1 } }) },
  '/auth/login': { post: operation({ tag: 'Autenticación', summary: 'Iniciar sesión y obtener JWT (RF-002)', description: 'Devuelve un JWT firmado (HS256) con expiración configurable (60 min por defecto). Enviarlo luego como `Authorization: Bearer <token>`.', roles: 'public',
    body: { type: 'object', required: ['email', 'password'], properties: { email: emailField, password: { type: 'string', format: 'password' } } },
    responses: { 200: ok('Autenticación exitosa', ref('AuthResponse')), 400: 1, 401: 1, 403: { description: 'Cuenta sin verificar o desactivada', content: json(ref('Error')) }, 429: 1 } }) },
  '/auth/forgot-password': { post: operation({ tag: 'Autenticación', summary: 'Solicitar restablecimiento de contraseña (RF-003)', roles: 'public', body: { type: 'object', required: ['email'], properties: { email: emailField } }, responses: { 200: ok('Respuesta genérica', envelope({ type: 'object' })), 400: 1, 429: 1 } }) },
  '/auth/reset-password': { post: operation({ tag: 'Autenticación', summary: 'Restablecer contraseña con token (RF-003)', roles: 'public',
    body: { type: 'object', required: ['email', 'token', 'password'], properties: { email: emailField, token: { type: 'string', description: 'Token de 64 caracteres hex recibido por correo' }, password: passwordField } },
    responses: { 200: ok('Contraseña actualizada', envelope({ type: 'object' })), 400: 1, 429: 1 } }) },
  '/auth/me': { get: operation({ tag: 'Autenticación', summary: 'Usuario de la sesión activa (RF-002)', roles: ANY, responses: { 200: ok('Usuario autenticado', envelope(ref('User'))) } }) },

  // ---------- Usuarios ----------
  '/users/me': { put: operation({ tag: 'Usuarios', summary: 'Actualizar perfil propio (RF-014)', roles: ANY,
    body: { type: 'object', properties: { firstName: { type: 'string' }, lastName: { type: 'string' }, phone: { type: 'string' }, address: { type: 'string' }, documentId: { type: 'string' } } },
    responses: { 200: ok('Perfil actualizado', envelope(ref('User'))), 400: 1 } }) },
  '/users/me/password': { patch: operation({ tag: 'Usuarios', summary: 'Cambiar contraseña (RF-014)', roles: ANY,
    body: { type: 'object', required: ['currentPassword', 'newPassword'], properties: { currentPassword: { type: 'string', format: 'password' }, newPassword: passwordField } },
    responses: { 200: ok('Contraseña actualizada', envelope({ type: 'object' })), 400: 1, 422: 1 } }) },
  '/users': {
    get: operation({ tag: 'Usuarios', summary: 'Listar usuarios (administración)', roles: ADMIN,
      params: [...pagination, queryParam('role', 'Filtrar por rol', { type: 'string', enum: ANY }), queryParam('active', 'Filtrar por estado', { type: 'boolean' }), queryParam('q', 'Buscar por nombre o correo')],
      responses: { 200: ok('Listado paginado', listOf('User')) } }),
  },
  '/users/staff': { post: operation({ tag: 'Usuarios', summary: 'Crear empleado o administrador', roles: ADMIN,
    body: { type: 'object', required: ['firstName', 'lastName', 'email', 'password', 'role'], properties: { firstName: { type: 'string' }, lastName: { type: 'string' }, email: emailField, password: passwordField, role: { type: 'string', enum: [ROLES.EMPLOYEE, ROLES.ADMIN] }, phone: { type: 'string' } } },
    responses: { 201: ok('Usuario creado', envelope(ref('User'))), 400: 1, 409: 1 } }) },
  '/users/{id}/active': { patch: operation({ tag: 'Usuarios', summary: 'Activar o desactivar una cuenta', roles: ADMIN, params: [idParam()],
    body: { type: 'object', required: ['active'], properties: { active: { type: 'boolean' } } },
    responses: { 200: ok('Cuenta actualizada', envelope(ref('User'))), 400: 1, 404: 1, 422: 1 } }) },

  // ---------- Garantías ----------
  '/collaterals/pre-evaluation': { post: operation({ tag: 'Garantías', summary: 'Pre-evaluar garantía: valor y préstamo estimado (RF-005)', roles: ANY,
    body: { type: 'object', required: ['category', 'condition', 'declaredValue'], properties: { category: { type: 'string', enum: CATEGORIES }, condition: { type: 'string', enum: CONDITIONS }, declaredValue: { type: 'number', example: 3500 } } },
    responses: { 200: ok('Estimación inicial', envelope(ref('PreEvaluation'))), 400: 1 } }) },
  '/collaterals': {
    post: operation({ tag: 'Garantías', summary: 'Registrar garantía con fotografías (RF-004)', description: 'multipart/form-data. Debe adjuntar entre 1 y 5 imágenes JPG/PNG/WEBP (máx. 5 MB c/u) en el campo `photos`.', roles: CLIENT, bodyType: 'multipart/form-data',
      body: { type: 'object', required: ['category', 'brand', 'model', 'serialNumber', 'condition', 'declaredValue', 'photos'], properties: { category: { type: 'string', enum: CATEGORIES }, brand: { type: 'string', example: 'Samsung' }, model: { type: 'string', example: 'Galaxy S23' }, serialNumber: { type: 'string', example: '356938035643809' }, condition: { type: 'string', enum: CONDITIONS }, description: { type: 'string' }, declaredValue: { type: 'number', example: 3500 }, photos: { type: 'array', items: { type: 'string', format: 'binary' }, minItems: 1, maxItems: 5 } } },
      responses: { 201: ok('Garantía registrada', envelope({ type: 'object', properties: { collateral: ref('Collateral'), preEvaluation: ref('PreEvaluation') } })), 400: 1, 409: 1 } }),
    get: operation({ tag: 'Garantías', summary: 'Listar garantías (propias para clientes; todas para personal)', roles: ANY,
      params: [...pagination, queryParam('status', 'Estado', { type: 'string', enum: ['registrada', 'en_evaluacion', 'en_custodia', 'rescatada', 'rechazada'] }), queryParam('category', 'Categoría', { type: 'string', enum: CATEGORIES }), queryParam('q', 'Buscar por marca, modelo o serie')],
      responses: { 200: ok('Listado paginado', listOf('Collateral')) } }),
  },
  '/collaterals/{id}': {
    get: operation({ tag: 'Garantías', summary: 'Detalle de una garantía', roles: ANY, params: [idParam()], responses: { 200: ok('Garantía', envelope(ref('Collateral'))), 400: 1, 403: 1, 404: 1 } }),
    put: operation({ tag: 'Garantías', summary: 'Editar garantía registrada (antes de solicitar)', roles: CLIENT, params: [idParam()],
      body: { type: 'object', properties: { category: { type: 'string', enum: CATEGORIES }, brand: { type: 'string' }, model: { type: 'string' }, serialNumber: { type: 'string' }, condition: { type: 'string', enum: CONDITIONS }, description: { type: 'string' }, declaredValue: { type: 'number' } } },
      responses: { 200: ok('Garantía actualizada', envelope(ref('Collateral'))), 400: 1, 403: 1, 404: 1, 409: 1 } }),
    delete: operation({ tag: 'Garantías', summary: 'Eliminar garantía registrada (antes de solicitar)', roles: CLIENT, params: [idParam()], responses: { 204: { description: 'Eliminada' }, 400: 1, 403: 1, 404: 1, 409: 1 } }),
  },

  // ---------- Solicitudes ----------
  '/loan-requests': {
    post: operation({ tag: 'Solicitudes', summary: 'Enviar solicitud de préstamo (CU-02)', roles: CLIENT,
      body: { type: 'object', required: ['collateralId', 'requestedAmount'], properties: { collateralId: { type: 'string', example: '665f1c2e8b3a4c0012a4b5c6' }, requestedAmount: { type: 'number', example: 1200 }, termDays: { type: 'integer', minimum: 7, maximum: 180, default: 30 } } },
      responses: { 201: ok('Solicitud en evaluación', envelope(ref('LoanRequest'))), 400: 1, 404: 1, 409: 1, 422: 1 } }),
    get: operation({ tag: 'Solicitudes', summary: 'Listar solicitudes (RF-007)', roles: ANY, params: [...pagination, queryParam('status', 'Estado', { type: 'string', enum: ['en_evaluacion', 'aprobada', 'rechazada'] })], responses: { 200: ok('Listado paginado', listOf('LoanRequest')) } }),
  },
  '/loan-requests/{id}': { get: operation({ tag: 'Solicitudes', summary: 'Detalle de solicitud', roles: ANY, params: [idParam()], responses: { 200: ok('Solicitud', envelope(ref('LoanRequest'))), 400: 1, 403: 1, 404: 1 } }) },
  '/loan-requests/{id}/appraisal': { patch: operation({ tag: 'Solicitudes', summary: 'Registrar tasación: monto máximo y tasa (RF-006)', roles: STAFF, params: [idParam()],
    body: { type: 'object', required: ['marketValue'], properties: { marketValue: { type: 'number', example: 3200 } } }, responses: { 200: ok('Solicitud tasada', envelope(ref('LoanRequest'))), 400: 1, 403: 1, 404: 1, 409: 1 } }) },
  '/loan-requests/{id}/approve': { patch: operation({ tag: 'Solicitudes', summary: 'Aprobar solicitud y generar contrato (CU-03, RF-007/008)', roles: STAFF, params: [idParam()],
    body: { type: 'object', required: ['approvedAmount'], properties: { approvedAmount: { type: 'number', example: 1500 }, termDays: { type: 'integer', example: 30 }, custodyLocation: { type: 'string', example: 'Bóveda A-12' } } },
    responses: { 200: ok('Solicitud aprobada con préstamo creado', envelope({ type: 'object', properties: { request: ref('LoanRequest'), loan: ref('Loan') } })), 400: 1, 403: 1, 404: 1, 409: 1, 422: 1 } }) },
  '/loan-requests/{id}/reject': { patch: operation({ tag: 'Solicitudes', summary: 'Rechazar solicitud con motivo (RF-007)', roles: STAFF, params: [idParam()],
    body: { type: 'object', required: ['reason'], properties: { reason: { type: 'string', example: 'El bien no cumple los criterios de aceptación' } } }, responses: { 200: ok('Solicitud rechazada', envelope(ref('LoanRequest'))), 400: 1, 403: 1, 404: 1, 409: 1 } }) },

  // ---------- Préstamos ----------
  '/loans': { get: operation({ tag: 'Préstamos', summary: 'Listar préstamos con saldo e interés vigentes (RF-009, RF-011)', roles: ANY,
    params: [...pagination, queryParam('status', 'Estado', { type: 'string', enum: ['activo', 'vencido', 'rescatado'] }), queryParam('dueSoon', 'Solo préstamos próximos a vencer (7 días)', { type: 'boolean' }), queryParam('q', 'Buscar por número de contrato')],
    responses: { 200: ok('Listado paginado', listOf('Loan')) } }) },
  '/loans/custody': { get: operation({ tag: 'Préstamos', summary: 'Garantías en custodia (RF-011)', roles: STAFF, params: pagination, responses: { 200: ok('Listado paginado', listOf('Loan')) } }) },
  '/loans/{id}': { get: operation({ tag: 'Préstamos', summary: 'Detalle del préstamo con cotización (RF-009)', roles: ANY, params: [idParam()], responses: { 200: ok('Préstamo', envelope(ref('Loan'))), 400: 1, 403: 1, 404: 1 } }) },
  '/loans/{id}/quote': { get: operation({ tag: 'Préstamos', summary: 'Cotización: interés devengado y monto de rescate', roles: ANY, params: [idParam()], responses: { 200: ok('Cotización', envelope(ref('Quote'))), 400: 1, 403: 1, 404: 1 } }) },
  '/loans/{id}/contract': { get: operation({ tag: 'Préstamos', summary: 'Contrato digital (RF-008)', roles: ANY, params: [idParam()], responses: { 200: ok('Contrato', envelope(ref('Contract'))), 400: 1, 403: 1, 404: 1 } }) },
  '/loans/{id}/payments': {
    get: operation({ tag: 'Pagos', summary: 'Historial de operaciones del préstamo (RF-009)', roles: ANY, params: [idParam()], responses: { 200: ok('Pagos', envelope({ type: 'array', items: ref('Payment') })), 400: 1, 403: 1, 404: 1 } }),
    post: operation({ tag: 'Pagos', summary: 'Registrar abono, pago de interés, renovación o rescate (CU-05, RF-010)', description: 'Reglas: `pago_interes` y `renovacion` deben igualar el interés devengado; `abono_capital` se aplica primero al interés; `rescate` debe igualar capital + interés (liquida el préstamo y libera la garantía).', roles: STAFF, params: [idParam()],
      body: { type: 'object', required: ['type', 'amount'], properties: { type: { type: 'string', enum: PAYMENT_TYPES }, amount: { type: 'number', example: 60 }, note: { type: 'string' } } },
      responses: { 201: ok('Pago registrado con comprobante', envelope({ type: 'object', properties: { payment: ref('Payment'), loan: ref('Loan') } })), 400: 1, 403: 1, 404: 1, 409: 1, 422: 1 } }),
  },

  // ---------- Pagos ----------
  '/payments': { get: operation({ tag: 'Pagos', summary: 'Registro de pagos (propios para clientes; todos para personal)', roles: ANY, params: [...pagination, queryParam('type', 'Tipo', { type: 'string', enum: PAYMENT_TYPES })], responses: { 200: ok('Listado paginado', listOf('Payment')) } }) },
  '/payments/{id}': { get: operation({ tag: 'Pagos', summary: 'Comprobante digital de un pago (RF-010)', roles: ANY, params: [idParam()], responses: { 200: ok('Comprobante', envelope(ref('Payment'))), 400: 1, 403: 1, 404: 1 } }) },

  // ---------- Notificaciones ----------
  '/notifications': { get: operation({ tag: 'Notificaciones', summary: 'Listar notificaciones propias (RF-012)', roles: ANY, params: [...pagination, queryParam('unread', 'Solo no leídas', { type: 'boolean' })], responses: { 200: ok('Listado paginado (meta.unread = no leídas)', listOf('Notification')) } }) },
  '/notifications/unread-count': { get: operation({ tag: 'Notificaciones', summary: 'Cantidad de notificaciones sin leer', roles: ANY, responses: { 200: ok('Contador', envelope({ type: 'object', properties: { unread: { type: 'integer' } } })) } }) },
  '/notifications/read-all': { patch: operation({ tag: 'Notificaciones', summary: 'Marcar todas como leídas', roles: ANY, responses: { 200: ok('Actualizadas', envelope({ type: 'object', properties: { updated: { type: 'integer' } } })) } }) },
  '/notifications/{id}/read': { patch: operation({ tag: 'Notificaciones', summary: 'Marcar una notificación como leída', roles: ANY, params: [idParam()], responses: { 200: ok('Notificación', envelope(ref('Notification'))), 400: 1, 404: 1 } }) },

  // ---------- Dashboard ----------
  '/dashboard/summary': { get: operation({ tag: 'Dashboard', summary: 'Resumen administrativo (RF-013)', roles: STAFF, responses: { 200: ok('Indicadores', envelope(ref('StaffSummary'))) } }) },
  '/dashboard/me': { get: operation({ tag: 'Dashboard', summary: 'Resumen del portal del cliente', roles: CLIENT, responses: { 200: ok('Indicadores', envelope({ type: 'object', properties: { activeLoans: { type: 'integer' }, totalOutstanding: { type: 'number' }, totalPayoff: { type: 'number' }, overdueLoans: { type: 'integer' }, pendingRequests: { type: 'integer' }, unreadNotifications: { type: 'integer' }, nextDue: { type: 'object', nullable: true } } })) } }) },
};

const objectId = { type: 'string', example: '665f1c2e8b3a4c0012a4b5c6' };
const date = { type: 'string', format: 'date-time' };

const schemas = {
  Error: { type: 'object', properties: { success: { type: 'boolean', example: false }, message: { type: 'string' }, code: { type: 'string', example: 'VALIDATION_ERROR' }, details: { description: 'Detalle opcional (lista de campos inválidos u otros datos)' } } },
  PageMeta: { type: 'object', properties: { page: { type: 'integer' }, limit: { type: 'integer' }, total: { type: 'integer' }, pages: { type: 'integer' } } },
  User: { type: 'object', properties: { id: objectId, firstName: { type: 'string' }, lastName: { type: 'string' }, email: emailField, role: { type: 'string', enum: ANY }, documentId: { type: 'string' }, phone: { type: 'string' }, address: { type: 'string' }, isVerified: { type: 'boolean' }, active: { type: 'boolean' }, createdAt: date } },
  AuthResponse: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'object', properties: { token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIs...' }, tokenType: { type: 'string', example: 'Bearer' }, expiresIn: { type: 'string', example: '60m' }, user: ref('User') } } } },
  PreEvaluation: { type: 'object', properties: { estimatedValue: { type: 'number', example: 2275 }, loanToValue: { type: 'number', example: 0.5 }, estimatedLoan: { type: 'number', example: 1137.5 }, monthlyRate: { type: 'number', example: 4 } } },
  Collateral: { type: 'object', properties: { id: objectId, owner: { oneOf: [objectId, ref('User')] }, category: { type: 'string', enum: CATEGORIES }, brand: { type: 'string' }, model: { type: 'string' }, serialNumber: { type: 'string' }, condition: { type: 'string', enum: CONDITIONS }, description: { type: 'string' }, photos: { type: 'array', items: { type: 'object', properties: { url: { type: 'string', example: '/uploads/9f2c...e1.jpg' }, filename: { type: 'string' } } } }, declaredValue: { type: 'number' }, estimatedValue: { type: 'number' }, appraisedValue: { type: 'number' }, status: { type: 'string', enum: ['registrada', 'en_evaluacion', 'en_custodia', 'rescatada', 'rechazada'] }, custodyLocation: { type: 'string' }, createdAt: date } },
  LoanRequest: { type: 'object', properties: { id: objectId, client: ref('User'), collateral: ref('Collateral'), requestedAmount: { type: 'number' }, termDays: { type: 'integer' }, status: { type: 'string', enum: ['en_evaluacion', 'aprobada', 'rechazada'] }, preEvaluation: ref('PreEvaluation'), appraisal: { type: 'object', properties: { marketValue: { type: 'number' }, maxLoan: { type: 'number' }, monthlyRate: { type: 'number' }, appraisedAt: date } }, approvedAmount: { type: 'number' }, rejectionReason: { type: 'string' }, loan: objectId, createdAt: date } },
  Quote: { type: 'object', properties: { outstandingPrincipal: { type: 'number' }, accruedInterest: { type: 'number' }, payoffAmount: { type: 'number' }, interestDays: { type: 'integer' }, daysToDue: { type: 'integer' }, isOverdue: { type: 'boolean' }, isDueSoon: { type: 'boolean' } } },
  Loan: { type: 'object', properties: { id: objectId, contractNumber: { type: 'string', example: 'PRE-2026-000001' }, client: ref('User'), collateral: ref('Collateral'), principal: { type: 'number' }, outstandingPrincipal: { type: 'number' }, monthlyRate: { type: 'number' }, termDays: { type: 'integer' }, startDate: date, dueDate: date, status: { type: 'string', enum: ['activo', 'vencido', 'rescatado'] }, quote: ref('Quote') } },
  Contract: { type: 'object', properties: { contractNumber: { type: 'string' }, generatedAt: date, client: { type: 'object', properties: { name: { type: 'string' }, email: emailField, documentId: { type: 'string', example: '****321' } } }, collateral: { type: 'object' }, terms: { type: 'object', properties: { principal: { type: 'number' }, monthlyRate: { type: 'number' }, termDays: { type: 'integer' }, startDate: date, dueDate: date } }, clauses: { type: 'array', items: { type: 'string' } } } },
  Payment: { type: 'object', properties: { id: objectId, loan: { oneOf: [objectId, { type: 'object' }] }, type: { type: 'string', enum: PAYMENT_TYPES }, amount: { type: 'number' }, interestPortion: { type: 'number' }, capitalPortion: { type: 'number' }, balanceAfter: { type: 'number' }, receiptNumber: { type: 'string', example: 'REC-2026-000001' }, paidAt: date, note: { type: 'string' } } },
  Notification: { type: 'object', properties: { id: objectId, type: { type: 'string' }, title: { type: 'string' }, message: { type: 'string' }, read: { type: 'boolean' }, loan: objectId, createdAt: date } },
  StaffSummary: { type: 'object', properties: { pendingRequests: { type: 'integer' }, activeLoans: { type: 'integer' }, overdueLoans: { type: 'integer' }, dueSoonLoans: { type: 'integer' }, custodyCount: { type: 'integer' }, portfolioOutstanding: { type: 'number' }, paymentsToday: { type: 'object', properties: { total: { type: 'number' }, count: { type: 'integer' } } }, paymentsMonth: { type: 'object', properties: { total: { type: 'number' }, count: { type: 'integer' } } }, oldestPendingRequests: { type: 'array', items: ref('LoanRequest') } } },
};

export const openapi = {
  openapi: '3.0.3',
  info: {
    title: 'PRESTA+ API',
    version: '1.0.0',
    description:
      'API REST de la plataforma inteligente de préstamos prendarios PRESTA+ (Tecnologías en Internet · Universidad Adventista de Bolivia).\n\n' +
      '**Autenticación:** inicie sesión en `POST /auth/login`, copie el `token` y pulse **Authorize** (esquema Bearer) para probar los endpoints protegidos.\n\n' +
      '**Roles (RBAC):** `cliente`, `empleado`, `admin`. Cada operación indica en `x-roles` quién puede invocarla.\n\n' +
      '**Formato de respuesta:** éxito `{ success: true, data, meta? }`; error `{ success: false, message, code, details? }`.',
    contact: { name: 'Equipo PRESTA+' },
  },
  servers: [{ url: '/api', description: 'Servidor actual' }],
  tags: ['Sistema', 'Autenticación', 'Usuarios', 'Garantías', 'Solicitudes', 'Préstamos', 'Pagos', 'Notificaciones', 'Dashboard'].map((name) => ({ name })),
  paths,
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'JWT obtenido en /auth/login' } },
    schemas,
  },
};

export default openapi;
