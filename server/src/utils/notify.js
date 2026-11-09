import Notification from '../models/Notification.js';

/** RF-012 · Crea una notificación interna para un usuario. */
export const notify = (user, { type = 'sistema', title, message, loan, request }) =>
  Notification.create({ user, type, title, message, loan, request });
