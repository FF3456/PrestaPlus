import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import { authorize } from '../middlewares/rbac.js';
import { ROLES, STAFF_ROLES } from '../constants/index.js';
import * as c from '../controllers/dashboardController.js';

const router = Router();
router.use(authenticate);
router.get('/summary', authorize(...STAFF_ROLES), c.staffSummary);
router.get('/me', authorize(ROLES.CLIENT), c.clientSummary);

export default router;
