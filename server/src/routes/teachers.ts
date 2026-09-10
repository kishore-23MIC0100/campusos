import { Router, Request, Response } from 'express';
import { getDb } from '../db.js';
import { authMiddleware, logAudit } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const { department, search } = req.query;
    const db = getDb();

    let query = 'SELECT * FROM teachers WHERE 1=1';
    const params: any[] = [];

    if (department && department !== 'ALL') {
      query += ' AND department = ?';
      params.push(department);
    }
    if (search) {
      query += ' AND (LOWER(first_name) LIKE ? OR LOWER(last_name) LIKE ? OR LOWER(employee_id) LIKE ? OR LOWER(subjects) LIKE ?)';
      const term = `%${String(search).toLowerCase()}%`;
      params.push(term, term, term, term);
    }

    query += ' ORDER BY department ASC, first_name ASC';

    const teachers = db.prepare(query).all(...params);
    return res.json({ teachers });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch teachers.' });
  }
});

router.get('/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = getDb();

    const teacher = db.prepare('SELECT * FROM teachers WHERE id = ? OR employee_id = ?').get(id, id) as any;
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found.' });
    }

    const timetable = db.prepare('SELECT * FROM timetables WHERE teacher_name LIKE ? OR teacher_id = ? ORDER BY day_of_week, period_index').all(`%${teacher.first_name}%`, teacher.user_id || '');
    const activeHomework = db.prepare('SELECT * FROM homework WHERE teacher_name LIKE ? OR teacher_id = ? ORDER BY due_date DESC').all(`%${teacher.first_name}%`, teacher.user_id || '');

    return res.json({
      teacher,
      timetable,
      activeHomework,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch teacher details.' });
  }
});

export default router;
