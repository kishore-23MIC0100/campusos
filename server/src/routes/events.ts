import { Router, Request, Response } from 'express';
import { getDb } from '../db.js';
import { authMiddleware, logAudit } from '../middleware/auth.js';

const router = Router();

// Get all events with category filter
router.get('/', (req: Request, res: Response) => {
  try {
    const { category, search } = req.query;
    const db = getDb();

    let query = 'SELECT * FROM events WHERE 1=1';
    const params: any[] = [];

    if (category && category !== 'ALL') {
      query += ' AND category = ?';
      params.push(category);
    }
    if (search) {
      query += ' AND (LOWER(title) LIKE ? OR LOWER(description) LIKE ? OR LOWER(venue) LIKE ?)';
      const term = `%${String(search).toLowerCase()}%`;
      params.push(term, term, term);
    }

    query += ' ORDER BY date ASC';

    const events = db.prepare(query).all(...params);
    return res.json({ events });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch events.' });
  }
});

// Single event
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = getDb();
    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found.' });
    }
    return res.json({ event });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch event.' });
  }
});

// Create event (Admin / Faculty)
router.post('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const { title, category, date, startTime, endTime, venue, description, organizer, maxCapacity, bannerUrl } = req.body;

    if (!title || !category || !date || !venue || !description) {
      return res.status(400).json({ error: 'Title, category, date, venue, and description are required.' });
    }

    const db = getDb();
    const id = `evt_${Date.now()}`;

    db.prepare(`
      INSERT INTO events (
        id, title, category, date, start_time, end_time, venue, description, organizer, max_capacity, banner_url, registration_open
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      title.trim(),
      category.toUpperCase(),
      date,
      startTime || '09:00',
      endTime || '17:00',
      venue.trim(),
      description.trim(),
      organizer || req.user!.fullName,
      maxCapacity || 500,
      bannerUrl || 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&auto=format&fit=crop&q=80',
      1
    );

    logAudit(
      req.user!.id,
      req.user!.fullName,
      req.user!.role,
      'EVENT_CREATED',
      'EVENT',
      id,
      `Created campus event "${title}" on ${date} at ${venue}`
    );

    return res.status(201).json({ message: 'Event published successfully.', eventId: id });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to create event.' });
  }
});

// RSVP / Register for event
router.post('/:id/rsvp', authMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = getDb();

    db.prepare('UPDATE events SET participants_count = participants_count + 1 WHERE id = ?').run(id);

    return res.json({ message: 'RSVP confirmed. Pass dispatched to your CampusOS wallet.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to RSVP.' });
  }
});

export default router;
