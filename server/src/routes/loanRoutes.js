import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import { authorize } from '../middlewares/rbac.js';
import { validate, validateObjectIdParams } from '../middlewares/validate.js';
import { PAYMENT_TYPES, STAFF_ROLES } from '../constants/index.js';
import * as c from '../controllers/loanController.js';

const router = Router();
router.use(authenticate);

router.get('/', c.listLoans);
router.get('/custody', authorize(...STAFF_ROLES), c.custody); // antes de /:id
router.get('/:id', validateObjectIdParams('id'), c.getLoan);
router.get('/:id/quote', validateObjectIdParams('id'), c.getQuote);
router.get('/:id/contract', validateObjectIdParams('id'), c.getContract);
router.get('/:id/payments', validateObjectIdParams('id'), c.listLoanPayments);
router.post(
  '/:id/payments',
  authorize(...STAFF_ROLES),
  validateObjectIdParams('id'),
  validate({
    type: { required: true, enum: PAYMENT_TYPES, label: 'Tipo de operación' },
    amount: { required: true, type: 'number', min: 0.01, max: 100_000_000, label: 'Monto' },
    note: { max: 200, label: 'Nota' },
  }),
  c.createPayment,
);

export default router;
