import { Router, Request, Response } from 'express';
import { getDb } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Get notifications for current user / role
router.get('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const db = getDb();
    const userId = req.user!.id;
    const role = req.user!.role;

    const allNotifs = db.prepare('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50').all() as any[];

    // Filter relevant notifications
    const userNotifs = allNotifs.filter(n => {
      if (n.user_id === userId || n.user_id === 'ALL' || n.user_id === 'ALL_STUDENTS') return true;
      if (n.target_role === 'ALL' || n.target_role === role) return true;
      return false;
    });

    const unreadCount = userNotifs.filter(n => !n.is_read).length;

    return res.json({
      notifications: userNotifs,
      unreadCount,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
});

// Mark single notification as read
router.put('/:id/read', authMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = getDb();
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(id);
    return res.json({ message: 'Marked as read.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update notification.' });
  }
});

// Mark all as read
router.put('/read-all', authMiddleware, (req: Request, res: Response) => {
  try {
    const db = getDb();
    db.prepare('UPDATE notifications SET is_read = 1').run();
    return res.json({ message: 'All notifications marked as read.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to mark notifications.' });
  }
});

// Delete single notification
router.delete('/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = getDb();
    db.prepare('DELETE FROM notifications WHERE id = ?').run(id);
    return res.json({ message: 'Notification removed.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to delete notification.' });
  }
});

// Clear all notifications for user
router.delete('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const db = getDb();
    const userId = req.user!.id;
    db.prepare('DELETE FROM notifications WHERE user_id = ? OR target_role = ? OR target_role = "ALL"').run(userId, req.user!.role);
    return res.json({ message: 'Notifications cleared.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to clear notifications.' });
  }
});

export default router;
