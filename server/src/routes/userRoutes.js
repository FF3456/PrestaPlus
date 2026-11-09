import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import { authorize } from '../middlewares/rbac.js';
import { validate, validateObjectIdParams, EMAIL_PATTERN, PASSWORD_PATTERN, PASSWORD_MESSAGE } from '../middlewares/validate.js';
import { ROLES } from '../constants/index.js';
import * as c from '../controllers/userController.js';

const router = Router();
router.use(authenticate);

router.put(
  '/me',
  validate({
    firstName: { min: 2, max: 60, label: 'Nombre' },
    lastName: { min: 2, max: 60, label: 'Apellido' },
    phone: { pattern: /^[0-9+\-\s]{7,15}$/, patternMessage: 'Teléfono inválido', label: 'Teléfono' },
    address: { max: 200, label: 'Dirección' },
    documentId: { min: 5, max: 20, label: 'Documento de identidad' },
  }),
  c.updateMe,
);
router.patch(
  '/me/password',
  validate({
    currentPassword: { required: true, max: 72, label: 'Contraseña actual' },
    newPassword: { required: true, pattern: PASSWORD_PATTERN, patternMessage: PASSWORD_MESSAGE, label: 'Nueva contraseña' },
  }),
  c.changePassword,
);

// Administración (solo rol admin)
router.get('/', authorize(ROLES.ADMIN), c.listUsers);
router.post(
  '/staff',
  authorize(ROLES.ADMIN),
  validate({
    firstName: { required: true, min: 2, max: 60, label: 'Nombre' },
    lastName: { required: true, min: 2, max: 60, label: 'Apellido' },
    email: { required: true, max: 120, pattern: EMAIL_PATTERN, label: 'Correo' },
    password: { required: true, pattern: PASSWORD_PATTERN, patternMessage: PASSWORD_MESSAGE, label: 'Contraseña' },
    role: { required: true, enum: [ROLES.EMPLOYEE, ROLES.ADMIN], label: 'Rol' },
    phone: { pattern: /^[0-9+\-\s]{7,15}$/, label: 'Teléfono' },
  }),
  c.createStaff,
);
router.patch('/:id/active', authorize(ROLES.ADMIN), validateObjectIdParams('id'), validate({ active: { required: true, type: 'boolean', label: 'Activo' } }), c.setUserActive);

export default router;
