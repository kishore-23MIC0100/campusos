import { Router, Request, Response } from 'express';
import { getDb } from '../db.js';
import { authMiddleware, requireRoles, logAudit } from '../middleware/auth.js';

const router = Router();

// List all users with filtering by role and status
router.get('/', authMiddleware, requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'), (req: Request, res: Response) => {
  try {
    const { role, status, search } = req.query;
    const db = getDb();

    let query = 'SELECT id, email, username, role, full_name, avatar_url, phone, status, department, student_id, admission_no, grade_section, bio, created_at FROM users WHERE 1=1';
    const params: any[] = [];

    if (role && role !== 'ALL') {
      query += ' AND role = ?';
      params.push(role);
    }

    if (status && status !== 'ALL') {
      query += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (LOWER(full_name) LIKE ? OR LOWER(email) LIKE ? OR LOWER(username) LIKE ? OR LOWER(student_id) LIKE ?)';
      const term = `%${String(search).toLowerCase()}%`;
      params.push(term, term, term, term);
    }

    query += ' ORDER BY CASE WHEN status = "PENDING" THEN 0 ELSE 1 END, created_at DESC';

    const users = db.prepare(query).all(...params);
    return res.json({ users });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve users.' });
  }
});

// Approve pending user
router.put('/:id/approve', authMiddleware, requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'), (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = getDb();

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    db.prepare('UPDATE users SET status = "APPROVED", updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);

    // If student, create student directory record if doesn't exist
    if (user.role === 'STUDENT') {
      const existingStudent = db.prepare('SELECT id FROM students WHERE user_id = ?').get(id);
      if (!existingStudent) {
        const parts = (user.full_name || 'Student User').split(' ');
        const stuId = user.student_id || `STU-${Date.now().toString().slice(-4)}`;
        const admNo = user.admission_no || `ADM-${Date.now().toString().slice(-4)}`;
        db.prepare(`
          INSERT INTO students (id, user_id, student_id, admission_no, first_name, last_name, grade, section, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(`stu_${Date.now()}`, id, stuId, admNo, parts[0], parts.slice(1).join(' ') || 'Student', 'Grade 10', 'A', 'ACTIVE');
      }
    }

    // If teacher, create teacher directory record if doesn't exist
    if (user.role === 'TEACHER') {
      const existingTeacher = db.prepare('SELECT id FROM teachers WHERE user_id = ?').get(id);
      if (!existingTeacher) {
        const parts = (user.full_name || 'Faculty Member').split(' ');
        const empId = `EMP-${Date.now().toString().slice(-4)}`;
        db.prepare(`
          INSERT INTO teachers (id, user_id, employee_id, first_name, last_name, designation, department, email, phone, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(`tch_${Date.now()}`, id, empId, parts[0], parts.slice(1).join(' ') || 'Faculty', 'Instructor', user.department || 'General Academics', user.email, user.phone || '+91 98000 00000', 'ACTIVE');
      }
    }

    logAudit(
      req.user!.id,
      req.user!.fullName,
      req.user!.role,
      'USER_APPROVED',
      'USER',
      id,
      `Approved access request for ${user.full_name} (${user.email}) as ${user.role}`
    );

    return res.json({ message: `Access approved for ${user.full_name}. Account is now active.`, userId: id });
  } catch (err: any) {
    console.error('[Approve Error]', err);
    return res.status(500).json({ error: 'Failed to approve user.' });
  }
});

// Reject pending user
router.put('/:id/reject', authMiddleware, requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'), (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const db = getDb();

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    db.prepare('UPDATE users SET status = "REJECTED", updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);

    logAudit(
      req.user!.id,
      req.user!.fullName,
      req.user!.role,
      'USER_REJECTED',
      'USER',
      id,
      `Rejected access request for ${user.full_name} (${user.email}). Reason: ${reason || 'Administrative decision'}`
    );

    return res.json({ message: `Access request for ${user.full_name} has been rejected.` });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to reject user.' });
  }
});

// Toggle user active / disabled status
router.put('/:id/status', authMiddleware, requireRoles('SUPER_ADMIN'), (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const db = getDb();

    db.prepare('UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);

    logAudit(
      req.user!.id,
      req.user!.fullName,
      req.user!.role,
      'USER_STATUS_CHANGED',
      'USER',
      id,
      `Changed user status to ${status}`
    );

    return res.json({ message: `User status updated to ${status}.` });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update user status.' });
  }
});

// Roles and permissions
router.get('/roles/all', authMiddleware, (req: Request, res: Response) => {
  try {
    const db = getDb();
    const roles = db.prepare('SELECT * FROM roles').all();
    const permissions = db.prepare('SELECT * FROM permissions').all();
    return res.json({ roles, permissions });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve roles.' });
  }
});

export default router;
