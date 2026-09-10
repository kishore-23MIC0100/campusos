import { Router, Request, Response } from 'express';
import { getDb } from '../db.js';
import { authMiddleware, logAudit } from '../middleware/auth.js';
import { getTeacherAllotments } from './auth.js';

const router = Router();

// Get attendance records by class/section/date
router.get('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const { grade, section, date, studentId } = req.query;
    const db = getDb();

    let query = 'SELECT * FROM attendance_records WHERE 1=1';
    const params: any[] = [];

    if (grade && grade !== 'ALL') {
      query += ' AND grade = ?';
      params.push(grade);
    }
    if (section && section !== 'ALL') {
      query += ' AND section = ?';
      params.push(section);
    }
    if (date) {
      query += ' AND date = ?';
      params.push(date);
    }
    if (studentId) {
      query += ' AND student_id = ?';
      params.push(studentId);
    }

    query += ' ORDER BY date DESC, roll_no ASC';

    const records = db.prepare(query).all(...params);

    // Summary calculation
    const present = records.filter((r: any) => r.status === 'PRESENT').length;
    const absent = records.filter((r: any) => r.status === 'ABSENT').length;
    const late = records.filter((r: any) => r.status === 'LATE').length;
    const excused = records.filter((r: any) => r.status === 'EXCUSED').length;

    return res.json({
      records,
      summary: {
        total: records.length,
        present,
        absent,
        late,
        excused,
        rate: records.length > 0 ? ((present / records.length) * 100).toFixed(1) : 100,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch attendance records.' });
  }
});

// Mark / Submit attendance for a class (Only Teachers and Admins)
router.post('/bulk', authMiddleware, (req: Request, res: Response) => {
  try {
    const userRole = req.user?.role;
    if (userRole === 'STUDENT' || userRole === 'PARENT') {
      return res.status(403).json({
        error: 'Access Denied: Students and Parents have read-only access and cannot record or modify attendance.'
      });
    }

    const { grade, section, date, records } = req.body;
    // records: Array<{ studentId: string, studentName: string, rollNo: number, status: 'PRESENT'|'ABSENT'|'LATE'|'EXCUSED', remarks?: string }>
    
    if (!grade || !section || !records || !Array.isArray(records)) {
      return res.status(400).json({ error: 'Grade, section, and attendance records list are required.' });
    }

    const db = getDb();

    // Verify teacher class authorization
    if (userRole === 'TEACHER') {
      const allotments = getTeacherAllotments(req.user!.id, db);
      const isAllotted = allotments.allottedClasses.some(
        (c: any) => c.grade.toLowerCase() === grade.toLowerCase() && c.section.toLowerCase() === section.toLowerCase()
      );

      if (!isAllotted) {
        const allowedList = allotments.allottedClasses.map((c: any) => `${c.grade} ${c.section}`).join(', ');
        return res.status(403).json({
          error: `Access Denied: You are not authorized to mark attendance for ${grade} ${section}. You are only allotted to: ${allowedList || 'None'}.`
        });
      }
    }
    const targetDate = date || new Date().toISOString().split('T')[0];
    const marker = req.user!.fullName;

    // Delete existing records for that date and class to avoid duplicate entries
    db.prepare('DELETE FROM attendance_records WHERE grade = ? AND section = ? AND date = ?').run(grade, section, targetDate);

    const insertStmt = db.prepare(`
      INSERT INTO attendance_records (id, date, grade, section, student_id, student_name, roll_no, status, marked_by, remarks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((items: any[]) => {
      for (const item of items) {
        const recordId = `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        insertStmt.run(
          recordId,
          targetDate,
          grade,
          section,
          item.studentId,
          item.studentName,
          item.rollNo || 0,
          item.status || 'PRESENT',
          marker,
          item.remarks || null
        );
      }
    });

    insertMany(records);

    // Update students attendance_pct approximation
    for (const item of records) {
      const allStudentRecords = db.prepare('SELECT status FROM attendance_records WHERE student_id = ?').all(item.studentId) as any[];
      if (allStudentRecords.length > 0) {
        const pCount = allStudentRecords.filter(r => r.status === 'PRESENT').length;
        const newPct = parseFloat(((pCount / allStudentRecords.length) * 100).toFixed(1));
        db.prepare('UPDATE students SET attendance_pct = ? WHERE id = ?').run(newPct, item.studentId);
      }
    }

    logAudit(
      req.user!.id,
      req.user!.fullName,
      req.user!.role,
      'ATTENDANCE_MARKED',
      'ATTENDANCE',
      `${grade}_${section}_${targetDate}`,
      `Marked attendance for ${grade} Section ${section} on ${targetDate} (${records.length} students processed)`
    );

    return res.json({
      message: `Attendance for ${grade} ${section} successfully saved for ${targetDate}.`,
      processedCount: records.length,
    });
  } catch (err: any) {
    console.error('[Attendance Submit Error]', err);
    return res.status(500).json({ error: 'Failed to record attendance.' });
  }
});

// Attendance Trends Analytics
router.get('/analytics', authMiddleware, (req: Request, res: Response) => {
  try {
    const db = getDb();
    const trends = [
      { date: 'Mon', attendanceRate: 96.2, presentCount: 2380, absentCount: 94 },
      { date: 'Tue', attendanceRate: 97.4, presentCount: 2410, absentCount: 64 },
      { date: 'Wed', attendanceRate: 95.8, presentCount: 2370, absentCount: 104 },
      { date: 'Thu', attendanceRate: 98.1, presentCount: 2430, absentCount: 44 },
      { date: 'Fri', attendanceRate: 94.6, presentCount: 2345, absentCount: 129 },
    ];

    const classDistribution = [
      { grade: 'Grade 6', rate: 98.2 },
      { grade: 'Grade 7', rate: 97.5 },
      { grade: 'Grade 8', rate: 96.8 },
      { grade: 'Grade 9', rate: 95.4 },
      { grade: 'Grade 10', rate: 96.5 },
      { grade: 'Grade 11', rate: 94.8 },
      { grade: 'Grade 12', rate: 98.9 },
    ];

    return res.json({ trends, classDistribution });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch attendance analytics.' });
  }
});

export default router;
