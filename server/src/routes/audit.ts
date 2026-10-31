import { Router, Request, Response } from 'express';
import { getDb } from '../db.js';
import { authMiddleware, requireRoles } from '../middleware/auth.js';

const router = Router();

// Get audit logs
router.get('/', authMiddleware, requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'), (req: Request, res: Response) => {
  try {
    const { action, entityType, search, limit } = req.query;
    const db = getDb();

    let query = 'SELECT * FROM audit_logs WHERE 1=1';
    const params: any[] = [];

    if (action && action !== 'ALL') {
      query += ' AND action = ?';
      params.push(action);
    }
    if (entityType && entityType !== 'ALL') {
      query += ' AND entity_type = ?';
      params.push(entityType);
    }
    if (search) {
      query += ' AND (LOWER(user_name) LIKE ? OR LOWER(description) LIKE ? OR LOWER(action) LIKE ?)';
      const term = `%${String(search).toLowerCase()}%`;
      params.push(term, term, term);
    }

    query += ' ORDER BY created_at DESC';

    const logs = db.prepare(query).all(...params);
    const requestedLimit = limit === undefined ? 100 : Number(limit);
    if (!Number.isInteger(requestedLimit) || requestedLimit < 1 || requestedLimit > 500) return res.status(400).json({ error: 'Log limit must be an integer between 1 and 500.' });
    const maxItems = requestedLimit;
    const actions = [...new Set(db.prepare('SELECT action FROM audit_logs').all().map(log => String(log.action)))].sort();

    return res.json({ logs: logs.slice(0, maxItems), total: logs.length, actions });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch audit logs.' });
  }
});

export default router;
