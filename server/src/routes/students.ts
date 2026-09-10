import { Router, Request, Response } from 'express';
import { getDb } from '../db.js';
import { authMiddleware, logAudit } from '../middleware/auth.js';

const router = Router();

// List students with search, filter, pagination
router.get('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const { grade, section, search, status } = req.query;
    const db = getDb();

    let query = 'SELECT * FROM students WHERE 1=1';
    const params: any[] = [];

    if (grade && grade !== 'ALL') {
      query += ' AND grade = ?';
      params.push(grade);
    }
    if (section && section !== 'ALL') {
      query += ' AND section = ?';
      params.push(section);
    }
    if (status && status !== 'ALL') {
      query += ' AND status = ?';
      params.push(status);
    }
    if (search) {
      query += ' AND (LOWER(first_name) LIKE ? OR LOWER(last_name) LIKE ? OR LOWER(student_id) LIKE ? OR LOWER(admission_no) LIKE ?)';
      const term = `%${String(search).toLowerCase()}%`;
      params.push(term, term, term, term);
    }

    query += ' ORDER BY grade ASC, section ASC, roll_no ASC';

    const students = db.prepare(query).all(...params);
    return res.json({ students });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch students.' });
  }
});

// Single student profile with full deep details
router.get('/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = getDb();

    const student = db.prepare('SELECT * FROM students WHERE id = ? OR student_id = ?').get(id, id) as any;
    if (!student) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    // Related academic data
    const attendance = db.prepare('SELECT * FROM attendance_records WHERE student_id = ? ORDER BY date DESC LIMIT 30').all(student.id);
    const performance = db.prepare('SELECT * FROM performance_records WHERE student_id = ? ORDER BY exam_type, subject').all(student.id);
    const homework = db.prepare('SELECT * FROM homework WHERE grade = ? AND section = ? ORDER BY due_date DESC').all(student.grade, student.section);
    const leaves = db.prepare('SELECT * FROM leave_requests WHERE applicant_id = ? OR applicant_name LIKE ? ORDER BY submitted_at DESC').all(student.user_id || '', `%${student.first_name}%`);

    return res.json({
      student,
      attendance,
      performance,
      homework,
      leaves,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch student details.' });
  }
});

// Create new student
router.post('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const { firstName, lastName, gender, dob, grade, section, rollNo, bloodGroup, house, parentName, parentPhone, address } = req.body;
    const db = getDb();

    const id = `stu_${Date.now()}`;
    const studentId = `STU-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const admissionNo = `ADM-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    db.prepare(`
      INSERT INTO students (
        id, student_id, admission_no, first_name, last_name, gender, dob, grade, section, roll_no, blood_group, house, parent_name, parent_phone, address, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, studentId, admissionNo, firstName, lastName, gender || 'Other', dob || '2010-01-01', grade, section, rollNo || 1, bloodGroup || 'O+', house || 'Orion Blue', parentName || '', parentPhone || '', address || '', 'ACTIVE'
    );

    logAudit(req.user!.id, req.user!.fullName, req.user!.role, 'STUDENT_CREATED', 'STUDENT', id, `Admitted new student ${firstName} ${lastName} (${studentId}) into ${grade} ${section}`);

    return res.status(201).json({ message: 'Student created successfully.', studentId, id });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to create student.' });
  }
});

// Update student
router.put('/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, grade, section, rollNo, parentName, parentPhone, address, status } = req.body;
    const db = getDb();

    db.prepare(`
      UPDATE students 
      SET first_name = ?, last_name = ?, grade = ?, section = ?, roll_no = ?, parent_name = ?, parent_phone = ?, address = ?, status = ?
      WHERE id = ?
    `).run(firstName, lastName, grade, section, rollNo, parentName, parentPhone, address, status || 'ACTIVE', id);

    logAudit(req.user!.id, req.user!.fullName, req.user!.role, 'STUDENT_UPDATED', 'STUDENT', id, `Updated student profile for ${firstName} ${lastName}`);

    return res.json({ message: 'Student updated successfully.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update student.' });
  }
});

export default router;
