import { accessibleStudents, scopeAcademicRecords, canAccessClass } from '../middleware/access.js';
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


    if (grade && grade !== 'ALL') {
      query += ' AND grade = ?';
      params.push(grade);
    }

    if (term && term !== 'ALL') { query += ' AND term = ?'; params.push(term); }
    if (examType && examType !== 'ALL') { query += ' AND exam_type = ?'; params.push(examType); }

    const requestedStudent = studentId ? db.prepare('SELECT * FROM students WHERE id = ? OR student_id = ?').get(studentId, studentId) : null;
    const requestedIds = new Set([requestedStudent?.id, requestedStudent?.student_id, requestedStudent?.user_id, studentId].filter(Boolean));
    const records = scopeAcademicRecords(db.prepare(query).all(...params), req.user!, db).filter(record => !studentId || requestedIds.has(record.student_id));

    // Normalize every recorded mark to a percentage before comparing subjects.
    const scoredRecords = records.filter(record => Number(record.max_marks) > 0 && record.marks_obtained != null && Number.isFinite(Number(record.marks_obtained)));
    const scores = scoredRecords.map(record => Number(record.marks_obtained) / Number(record.max_marks) * 100);
    const subjectStats: Record<string, { total: number; count: number }> = {};
    scoredRecords.forEach(record => {
      const stat = subjectStats[record.subject] ||= { total: 0, count: 0 };
      stat.total += Number(record.marks_obtained) / Number(record.max_marks) * 100;
      stat.count += 1;
    });
    const subjectAverages = Object.entries(subjectStats).map(([subject, stat]) => ({ subject, average: Number((stat.total / stat.count).toFixed(1)) }));

    return res.json({
      records,
      subjectAverages,
      analytics: {
        highestScore: scores.length ? Number(Math.max(...scores).toFixed(1)) : null,
        averageScore: scores.length ? Number((scores.reduce((total, score) => total + score, 0) / scores.length).toFixed(1)) : null,
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

    const student = db.prepare('SELECT * FROM students WHERE id = ? OR student_id = ?').get(studentId, studentId);
    if (!student) return res.status(404).json({ error: 'Student not found.' });
    if (!Number.isFinite(Number(marksObtained)) || !Number.isFinite(Number(maxMarks ?? 100)) || Number(maxMarks ?? 100) <= 0 || Number(marksObtained) < 0 || Number(marksObtained) > Number(maxMarks ?? 100)) return res.status(400).json({ error: 'Marks must be between zero and the maximum score.' });
    if ((grade && grade !== student.grade) || (section && section !== student.section)) return res.status(400).json({ error: 'Student class does not match the selected class.' });

    // Verify teacher authorization
    if (userRole === 'TEACHER') {
      const allotments = getTeacherAllotments(req.user!.id, db);
      const targetGrade = student.grade;
      const targetSection = student.section;
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
    const pct = ((marksObtained / (maxMarks ?? 100)) * 100);
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
      student.id,
      `${student.first_name} ${student.last_name}`,
      student.grade,
      student.section,
      subject,
      term || 'TERM_1',
      examType || 'MAIN_EXAM',
      Number(maxMarks ?? 100),
      Number(marksObtained),
      gradeLetter,
      parseFloat(pct.toFixed(1)),
      teacherRemarks || ''
    );

    logAudit(
      req.user!.id,
      req.user!.fullName,
      req.user!.role,
      'PERFORMANCE_RECORDED',
      'PERFORMANCE',
      id,
      `Recorded score for ${studentName}: ${marksObtained}/${maxMarks ?? 100} in ${subject}`
    );

    return res.status(201).json({ message: 'Performance score saved.', recordId: id });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to record performance.' });
  }
});

export default router;
