import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import { validateObjectIdParams } from '../middlewares/validate.js';
import * as c from '../controllers/notificationController.js';

const router = Router();
router.use(authenticate);
router.get('/', c.listNotifications);
router.get('/unread-count', c.unreadCount);
router.patch('/read-all', c.markAllRead); // antes de /:id/read
router.patch('/:id/read', validateObjectIdParams('id'), c.markRead);

export default router;
