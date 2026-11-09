import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import { authorize } from '../middlewares/rbac.js';
import { validate, validateObjectIdParams } from '../middlewares/validate.js';
import { MAX_TERM_DAYS, MIN_TERM_DAYS, ROLES, STAFF_ROLES } from '../constants/index.js';
import * as c from '../controllers/loanRequestController.js';

const router = Router();
router.use(authenticate);

router.post(
  '/',
  authorize(ROLES.CLIENT),
  validate({
    collateralId: { required: true, type: 'objectId', label: 'Garantía' },
    requestedAmount: { required: true, type: 'number', min: 1, max: 10_000_000, label: 'Monto solicitado' },
    termDays: { type: 'number', min: MIN_TERM_DAYS, max: MAX_TERM_DAYS, label: 'Plazo (días)' },
  }),
  c.createRequest,
);
router.get('/', c.listRequests);
router.get('/:id', validateObjectIdParams('id'), c.getRequest);
router.patch(
  '/:id/appraisal',
  authorize(...STAFF_ROLES),
  validateObjectIdParams('id'),
  validate({ marketValue: { required: true, type: 'number', min: 1, max: 10_000_000, label: 'Valor de mercado' } }),
  c.appraiseRequest,
);
router.patch(
  '/:id/approve',
  authorize(...STAFF_ROLES),
  validateObjectIdParams('id'),
  validate({
    approvedAmount: { required: true, type: 'number', min: 1, max: 10_000_000, label: 'Monto aprobado' },
    termDays: { type: 'number', min: MIN_TERM_DAYS, max: MAX_TERM_DAYS, label: 'Plazo (días)' },
    custodyLocation: { max: 60, label: 'Ubicación en custodia' },
  }),
  c.approve,
);
router.patch(
  '/:id/reject',
  authorize(...STAFF_ROLES),
  validateObjectIdParams('id'),
  validate({ reason: { required: true, min: 5, max: 300, label: 'Motivo' } }),
  c.reject,
);

export default router;
