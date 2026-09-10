import { Router, Request, Response } from 'express';
import { getDb } from '../db.js';
import { authMiddleware, logAudit } from '../middleware/auth.js';

const router = Router();

// Get spotlights
router.get('/', (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    const db = getDb();

    let query = 'SELECT * FROM spotlights WHERE 1=1';
    const params: any[] = [];

    if (category && category !== 'ALL') {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY award_date DESC';

    const spotlights = db.prepare(query).all(...params);
    return res.json({ spotlights });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch spotlights.' });
  }
});

// Create spotlight story
router.post('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const { title, badgeLabel, recipientName, recipientRole, recipientImage, category, story, metricsHighlight, citationQuote } = req.body;

    if (!title || !recipientName || !story) {
      return res.status(400).json({ error: 'Title, recipient name, and story are required.' });
    }

    const db = getDb();
    const id = `spot_${Date.now()}`;

    db.prepare(`
      INSERT INTO spotlights (
        id, title, badge_label, recipient_name, recipient_role, recipient_image, category, story, metrics_highlight, citation_quote
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      title.trim(),
      badgeLabel || 'EXCELLENCE HONORS',
      recipientName.trim(),
      recipientRole || 'Campus Member',
      recipientImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      category || 'STUDENT_ACHIEVEMENT',
      story.trim(),
      metricsHighlight || 'Outstanding Performance',
      citationQuote || null
    );

    logAudit(
      req.user!.id,
      req.user!.fullName,
      req.user!.role,
      'SPOTLIGHT_CREATED',
      'SPOTLIGHT',
      id,
      `Curated new spotlight feature: "${title}" honoring ${recipientName}`
    );

    return res.status(201).json({ message: 'Spotlight published.', spotlightId: id });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to create spotlight.' });
  }
});

export default router;
