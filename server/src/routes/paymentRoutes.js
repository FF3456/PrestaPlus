import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import { validateObjectIdParams } from '../middlewares/validate.js';
import * as c from '../controllers/paymentController.js';

const router = Router();
router.use(authenticate);
router.get('/', c.listPayments);
router.get('/:id', validateObjectIdParams('id'), c.getReceipt);

export default router;
