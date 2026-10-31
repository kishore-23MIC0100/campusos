import { Router, Request } from 'express';
import { getDb } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
function visible(notification: any, req: Request) {
  // A named recipient always wins over the broad role tag.
  if (notification.user_id && !['ALL', 'ALL_STUDENTS'].includes(notification.user_id)) return notification.user_id === req.user!.id;
  if (notification.user_id === 'ALL_STUDENTS') return req.user!.role === 'STUDENT';
  return notification.target_role === 'ALL' || notification.target_role === req.user!.role;
}
function isRead(notification: any, userId: string) { return notification.read_by?.includes(userId) || (notification.user_id === userId && Boolean(notification.is_read)); }
router.get('/', authMiddleware, (req, res) => {
  const notifications = getDb().prepare('SELECT * FROM notifications ORDER BY created_at DESC').all().filter(notification => visible(notification, req) && !notification.dismissed_by?.includes(req.user!.id)).slice(0, 50).map(notification => ({ ...notification, is_read: isRead(notification, req.user!.id) ? 1 : 0 }));
  res.json({ notifications, unreadCount: notifications.filter(notification => !notification.is_read).length });
});
router.put('/read-all', authMiddleware, (req, res) => {
  const db = getDb();
  for (const notification of db.prepare('SELECT * FROM notifications').all()) if (visible(notification, req)) notification.read_by = [...new Set([...(notification.read_by || []), req.user!.id])];
  db.scheduleSave(); res.json({ message: 'Your notifications are marked as read.' });
});
router.put('/:id/read', authMiddleware, (req, res) => {
  const db = getDb(); const notification = db.prepare('SELECT * FROM notifications WHERE id = ?').get(req.params.id);
  if (!notification || !visible(notification, req)) return res.status(404).json({ error: 'Notification not found.' });
  notification.read_by = [...new Set([...(notification.read_by || []), req.user!.id])];
  db.scheduleSave(); res.json({ message: 'Marked as read.' });
});
router.delete('/:id', authMiddleware, (req, res) => {
  const db = getDb(); const notification = db.prepare('SELECT * FROM notifications WHERE id = ?').get(req.params.id);
  if (!notification || !visible(notification, req)) return res.status(404).json({ error: 'Notification not found.' });
  notification.dismissed_by = [...new Set([...(notification.dismissed_by || []), req.user!.id])];
  db.scheduleSave(); res.json({ message: 'Notification dismissed.' });
});
router.delete('/', authMiddleware, (req, res) => {
  const db = getDb();
  for (const notification of db.prepare('SELECT * FROM notifications').all()) if (visible(notification, req)) notification.dismissed_by = [...new Set([...(notification.dismissed_by || []), req.user!.id])];
  db.scheduleSave(); res.json({ message: 'Your notifications are cleared.' });
});
export default router;
