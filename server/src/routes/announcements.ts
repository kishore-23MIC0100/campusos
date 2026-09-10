import { Router, Request, Response } from 'express';
import { getDb } from '../db.js';
import { authMiddleware, logAudit } from '../middleware/auth.js';

const router = Router();

// Get announcements with audience filtering
router.get('/', (req: Request, res: Response) => {
  try {
    const { category, priority, audience, search } = req.query;
    const db = getDb();

    let query = 'SELECT * FROM announcements WHERE 1=1';
    const params: any[] = [];

    if (category && category !== 'ALL') {
      query += ' AND category = ?';
      params.push(category);
    }
    if (priority && priority !== 'ALL') {
      query += ' AND priority = ?';
      params.push(priority);
    }
    if (audience && audience !== 'ALL') {
      query += ' AND (target_audience = "ALL" OR target_audience = ?)';
      params.push(audience);
    }
    if (search) {
      query += ' AND (LOWER(title) LIKE ? OR LOWER(content) LIKE ? OR LOWER(author_name) LIKE ?)';
      const term = `%${String(search).toLowerCase()}%`;
      params.push(term, term, term);
    }

    query += ' ORDER BY is_pinned DESC, publish_date DESC';

    const announcements = db.prepare(query).all(...params);
    return res.json({ announcements });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch announcements.' });
  }
});

// Single announcement
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = getDb();
    const announcement = db.prepare('SELECT * FROM announcements WHERE id = ?').get(id);
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found.' });
    }
    return res.json({ announcement });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch announcement.' });
  }
});

// Create announcement
router.post('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const { title, content, category, priority, targetAudience, expiresAt, isPinned } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required.' });
    }

    const db = getDb();
    const id = `anc_${Date.now()}`;

    db.prepare(`
      INSERT INTO announcements (
        id, title, content, category, priority, target_audience, author_name, author_role, expires_at, is_pinned
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      title.trim(),
      content.trim(),
      category || 'GENERAL',
      priority || 'NORMAL',
      targetAudience || 'ALL',
      req.user!.fullName,
      req.user!.role,
      expiresAt || null,
      isPinned ? 1 : 0
    );

    logAudit(
      req.user!.id,
      req.user!.fullName,
      req.user!.role,
      'ANNOUNCEMENT_PUBLISHED',
      'ANNOUNCEMENT',
      id,
      `Published announcement: "${title}" (Priority: ${priority || 'NORMAL'})`
    );

    return res.status(201).json({ message: 'Announcement published.', announcementId: id });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to create announcement.' });
  }
});

export default router;
