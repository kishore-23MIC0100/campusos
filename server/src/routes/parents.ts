import { Router, Request, Response } from 'express';
import { getDb } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// List all parents (Admin/Teacher access)
router.get('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    const db = getDb();

    let query = 'SELECT * FROM parents WHERE 1=1';
    const params: any[] = [];

    if (search) {
      query += ' AND (LOWER(first_name) LIKE ? OR LOWER(last_name) LIKE ? OR LOWER(email) LIKE ? OR phone LIKE ?)';
      const term = `%${String(search).toLowerCase()}%`;
      params.push(term, term, term, term);
    }

    const parents = db.prepare(query).all(...params);
    return res.json({ parents });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch parents.' });
  }
});

// Parent specific route: get linked children data
router.get('/my-children', authMiddleware, (req: Request, res: Response) => {
  try {
    const db = getDb();
    const userId = req.user!.id;

    // Find parent record by user_id or email
    const parent = db.prepare('SELECT * FROM parents WHERE user_id = ? OR email = ?').get(userId, req.user!.email) as any;

    let children: any[] = [];
    if (parent && parent.children_ids) {
      const childIds = JSON.parse(parent.children_ids || '[]');
      if (childIds.length > 0) {
        const placeholders = childIds.map(() => '?').join(',');
        children = db.prepare(`SELECT * FROM students WHERE id IN (${placeholders})`).all(...childIds);
      }
    } else {
      // Fallback: search students matching parent email or name
      children = db.prepare('SELECT * FROM students WHERE parent_id = ? OR LOWER(parent_name) LIKE ?').all(userId, `%${req.user!.fullName.split(' ')[0].toLowerCase()}%`);
    }

    // Attach deep academic context to each child (attendance %, recent homework, performance summary)
    const enrichedChildren = children.map((c: any) => {
      const attendance = db.prepare('SELECT * FROM attendance_records WHERE student_id = ? ORDER BY date DESC LIMIT 10').all(c.id);
      const performance = db.prepare('SELECT * FROM performance_records WHERE student_id = ? ORDER BY marks_obtained DESC').all(c.id);
      const homework = db.prepare('SELECT * FROM homework WHERE grade = ? AND section = ? ORDER BY due_date DESC LIMIT 5').all(c.grade, c.section);
      const timetable = db.prepare('SELECT * FROM timetables WHERE grade = ? AND section = ? ORDER BY period_index ASC').all(c.grade, c.section);

      return {
        ...c,
        recentAttendance: attendance,
        performanceRecords: performance,
        pendingHomework: homework,
        todayTimetable: timetable,
      };
    });

    return res.json({
      parent: parent || {
        first_name: req.user!.fullName.split(' ')[0],
        last_name: req.user!.fullName.split(' ').slice(1).join(' '),
        email: req.user!.email,
        phone: req.user!.phone,
      },
      children: enrichedChildren,
    });
  } catch (err: any) {
    console.error('[Parent Children Error]', err);
    return res.status(500).json({ error: 'Failed to fetch linked children information.' });
  }
});

export default router;
