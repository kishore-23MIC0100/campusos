import { Router, Request, Response } from 'express';
import { getDb } from '../db.js';
import { authMiddleware, logAudit } from '../middleware/auth.js';
import { getTeacherAllotments } from './auth.js';

const router = Router();

// Get performance records
router.get('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const { studentId, grade, term, examType } = req.query;
    const db = getDb();

    let query = 'SELECT * FROM performance_records WHERE 1=1';
    const params: any[] = [];

    if (studentId) {
      query += ' AND student_id = ?';
      params.push(studentId);
    }
    if (grade && grade !== 'ALL') {
      query += ' AND grade = ?';
      params.push(grade);
    }

    const records = db.prepare(query).all(...params);

    // Subject breakdown analytics
    const subjectStats: Record<string, { totalMarks: number; count: number }> = {};
    records.forEach((r: any) => {
      if (!subjectStats[r.subject]) {
        subjectStats[r.subject] = { totalMarks: 0, count: 0 };
      }
      subjectStats[r.subject].totalMarks += r.marks_obtained;
      subjectStats[r.subject].count += 1;
    });

    const subjectAverages = Object.entries(subjectStats).map(([subject, stat]) => ({
      subject,
      average: parseFloat((stat.totalMarks / stat.count).toFixed(1)),
      benchmark: 85,
    }));

    return res.json({
      records,
      subjectAverages,
      analytics: {
        highestScore: records.length > 0 ? Math.max(...records.map((r: any) => r.marks_obtained)) : 0,
        averageScore: records.length > 0 ? parseFloat((records.reduce((acc: number, r: any) => acc + r.marks_obtained, 0) / records.length).toFixed(1)) : 0,
        totalAssessments: records.length,
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch performance records.' });
  }
});

// Add / Update performance mark (Teacher / Admin)
router.post('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const userRole = req.user?.role;
    if (userRole === 'STUDENT' || userRole === 'PARENT') {
      return res.status(403).json({ error: 'Access Denied: Read-only access for student/parent accounts.' });
    }

    const { studentId, studentName, grade, section, subject, term, examType, maxMarks, marksObtained, teacherRemarks } = req.body;

    if (!studentId || !subject || marksObtained === undefined) {
      return res.status(400).json({ error: 'Student, subject, and marks obtained are required.' });
    }

    const db = getDb();

    // Verify teacher authorization
    if (userRole === 'TEACHER') {
      const allotments = getTeacherAllotments(req.user!.id, db);
      const targetGrade = grade || 'Grade 10';
      const targetSection = section || 'A';
      const isClassAllotted = allotments.allottedClasses.some(
        (c: any) => c.grade.toLowerCase() === targetGrade.toLowerCase() && c.section.toLowerCase() === targetSection.toLowerCase()
      );

      if (!isClassAllotted) {
        const allowedList = allotments.allottedClasses.map((c: any) => `${c.grade} ${c.section}`).join(', ');
        return res.status(403).json({
          error: `Access Denied: You cannot record grades for ${targetGrade} ${targetSection}. You are only allotted to: ${allowedList}.`
        });
      }

      const isSubjectAllotted = allotments.allottedSubjects.some(
        (s: string) => s.toLowerCase() === subject.toLowerCase()
      );

      if (!isSubjectAllotted && allotments.allottedSubjects.length > 0) {
        return res.status(403).json({
          error: `Access Denied: You cannot record grades for subject '${subject}'. You are only authorized for: ${allotments.allottedSubjects.join(', ')}.`
        });
      }
    }
    const id = `perf_${Date.now()}`;
    const pct = ((marksObtained / (maxMarks || 100)) * 100);
    let gradeLetter = 'A+';
    if (pct < 60) gradeLetter = 'D';
    else if (pct < 75) gradeLetter = 'C';
    else if (pct < 85) gradeLetter = 'B';
    else if (pct < 92) gradeLetter = 'A';

    db.prepare(`
      INSERT INTO performance_records (
        id, student_id, student_name, grade, section, subject, term, exam_type, max_marks, marks_obtained, grade_letter, percentile, teacher_remarks
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      studentId,
      studentName || 'Student',
      grade || 'Grade 10',
      section || 'A',
      subject,
      term || 'TERM_1',
      examType || 'MAIN_EXAM',
      maxMarks || 100,
      marksObtained,
      gradeLetter,
      parseFloat(pct.toFixed(1)),
      teacherRemarks || 'Satisfactory work.'
    );

    logAudit(
      req.user!.id,
      req.user!.fullName,
      req.user!.role,
      'PERFORMANCE_RECORDED',
      'PERFORMANCE',
      id,
      `Recorded score for ${studentName}: ${marksObtained}/${maxMarks || 100} in ${subject}`
    );

    return res.status(201).json({ message: 'Performance score saved.', recordId: id });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to record performance.' });
  }
});

export default router;
