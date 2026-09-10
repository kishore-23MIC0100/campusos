import { Router, Request, Response } from 'express';
import { getDb } from '../db.js';
import { authMiddleware, logAudit } from '../middleware/auth.js';
import { getTeacherAllotments } from './auth.js';

const router = Router();

// Get homework list
router.get('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const { grade, section, subject, search } = req.query;
    const db = getDb();

    let query = 'SELECT * FROM homework WHERE 1=1';
    const params: any[] = [];

    if (grade && grade !== 'ALL') {
      query += ' AND grade = ?';
      params.push(grade);
    }
    if (section && section !== 'ALL') {
      query += ' AND section = ?';
      params.push(section);
    }
    if (subject && subject !== 'ALL') {
      query += ' AND subject = ?';
      params.push(subject);
    }
    if (search) {
      query += ' AND (LOWER(title) LIKE ? OR LOWER(description) LIKE ? OR LOWER(teacher_name) LIKE ?)';
      const term = `%${String(search).toLowerCase()}%`;
      params.push(term, term, term);
    }

    query += ' ORDER BY due_date ASC';

    const homeworkList = db.prepare(query).all(...params);

    // If user is a student, attach submission status
    if (req.user!.role === 'STUDENT') {
      const enriched = homeworkList.map((hw: any) => {
        const submission = db.prepare('SELECT * FROM homework_submissions WHERE homework_id = ? AND student_id = ?').get(hw.id, req.user!.studentId || req.user!.id);
        return {
          ...hw,
          submission: submission || null,
          isSubmitted: Boolean(submission),
        };
      });
      return res.json({ homework: enriched });
    }

    return res.json({ homework: homeworkList });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch homework assignments.' });
  }
});

// Single homework details with all submissions
router.get('/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = getDb();

    const hw = db.prepare('SELECT * FROM homework WHERE id = ?').get(id) as any;
    if (!hw) {
      return res.status(404).json({ error: 'Homework not found.' });
    }

    const submissions = db.prepare('SELECT * FROM homework_submissions WHERE homework_id = ? ORDER BY submission_date DESC').all(id);

    return res.json({
      homework: hw,
      submissions,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch homework details.' });
  }
});

// Create new homework (Teachers & Admins)
router.post('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const { title, subject, grade, section, description, dueDate, priority, attachments } = req.body;

    if (!title || !subject || !grade || !section || !dueDate || !description) {
      return res.status(400).json({ error: 'Title, subject, grade, section, due date, and description are required.' });
    }

    const db = getDb();

    // Verify teacher authorization
    if (req.user?.role === 'TEACHER') {
      const allotments = getTeacherAllotments(req.user.id, db);
      const isClassAllotted = allotments.allottedClasses.some(
        (c: any) => c.grade.toLowerCase() === grade.toLowerCase() && c.section.toLowerCase() === section.toLowerCase()
      );

      if (!isClassAllotted) {
        const allowedList = allotments.allottedClasses.map((c: any) => `${c.grade} ${c.section}`).join(', ');
        return res.status(403).json({
          error: `Access Denied: You cannot assign homework for ${grade} ${section}. You are only allotted to: ${allowedList}.`
        });
      }

      const isSubjectAllotted = allotments.allottedSubjects.some(
        (s: string) => s.toLowerCase() === subject.toLowerCase()
      );

      if (!isSubjectAllotted && allotments.allottedSubjects.length > 0) {
        return res.status(403).json({
          error: `Access Denied: You cannot assign homework for subject '${subject}'. You are only authorized for: ${allotments.allottedSubjects.join(', ')}.`
        });
      }
    }

    const id = `hw_${Date.now()}`;

    db.prepare(`
      INSERT INTO homework (
        id, title, subject, grade, section, teacher_id, teacher_name, description, due_date, priority, attachments, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      title.trim(),
      subject,
      grade,
      section,
      req.user!.id,
      req.user!.fullName,
      description.trim(),
      dueDate,
      priority || 'NORMAL',
      attachments ? JSON.stringify(attachments) : null,
      'ACTIVE'
    );

    // Notify students of this grade/section
    db.prepare(`
      INSERT INTO notifications (id, user_id, target_role, title, message, type, link_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      `notif_${Date.now()}`,
      'ALL_STUDENTS',
      'STUDENT',
      `New Homework: ${title} (${subject})`,
      `${req.user!.fullName} posted a new assignment for ${grade} ${section}. Due on ${dueDate}.`,
      'HOMEWORK',
      `/homework`
    );

    logAudit(
      req.user!.id,
      req.user!.fullName,
      req.user!.role,
      'HOMEWORK_PUBLISHED',
      'HOMEWORK',
      id,
      `Published homework "${title}" for ${grade} ${section} (${subject})`
    );

    return res.status(201).json({ message: 'Homework published successfully.', homeworkId: id });
  } catch (err: any) {
    console.error('[Homework Create Error]', err);
    return res.status(500).json({ error: 'Failed to create homework.' });
  }
});

// Submit homework (Student)
router.post('/:id/submit', authMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { content, attachment } = req.body;
    const db = getDb();

    const hw = db.prepare('SELECT * FROM homework WHERE id = ?').get(id) as any;
    if (!hw) {
      return res.status(404).json({ error: 'Homework not found.' });
    }

    const studentId = req.user!.studentId || req.user!.id;
    const submissionId = `sub_${Date.now()}`;

    // Upsert submission
    db.prepare('DELETE FROM homework_submissions WHERE homework_id = ? AND student_id = ?').run(id, studentId);

    db.prepare(`
      INSERT INTO homework_submissions (id, homework_id, student_id, student_name, content, attachment, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(submissionId, id, studentId, req.user!.fullName, content || 'Attached submission file.', attachment || 'student_solution.pdf', 'SUBMITTED');

    logAudit(
      req.user!.id,
      req.user!.fullName,
      req.user!.role,
      'HOMEWORK_SUBMITTED',
      'HOMEWORK',
      id,
      `Submitted assignment solution for "${hw.title}"`
    );

    return res.json({ message: 'Assignment submitted successfully!', submissionId });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to submit homework.' });
  }
});

export default router;
