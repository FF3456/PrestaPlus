import Notification from '../models/Notification.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { pageMeta, parsePagination } from '../utils/pagination.js';

/** RF-012 · Bandeja de notificaciones del usuario autenticado. */
export const listNotifications = asyncHandler(async (req, res) => {
  const p = parsePagination(req.query, { defaultLimit: 30 });
  const filter = { user: req.user._id };
  if (req.query.unread === 'true') filter.read = false;
  const [items, total, unread] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(p.skip).limit(p.limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: req.user._id, read: false }),
  ]);
  res.json({ success: true, data: items, meta: { ...pageMeta(p, total), unread } });
});

export const unreadCount = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { unread: await Notification.countDocuments({ user: req.user._id, read: false }) } });
});

export const markRead = asyncHandler(async (req, res) => {
  const n = await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { read: true }, { new: true });
  if (!n) throw new AppError(404, 'Notificación no encontrada', 'NOT_FOUND');
  res.json({ success: true, data: n });
});

export const markAllRead = asyncHandler(async (req, res) => {
  const r = await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
  res.json({ success: true, data: { updated: r.modifiedCount } });
});
