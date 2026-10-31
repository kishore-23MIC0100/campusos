import { accessibleStudents, scopeAcademicRecords, canAccessClass } from '../middleware/access.js';
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


    query += ' ORDER BY date DESC, roll_no ASC';

    const requestedStudent = studentId ? db.prepare('SELECT * FROM students WHERE id = ? OR student_id = ?').get(studentId, studentId) : null;
    const requestedIds = new Set([requestedStudent?.id, requestedStudent?.student_id, requestedStudent?.user_id, studentId].filter(Boolean));
    const records = scopeAcademicRecords(db.prepare(query).all(...params), req.user!, db).filter(record => !studentId || requestedIds.has(record.student_id));

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
        rate: records.length > 0 ? (((present + late) / records.length) * 100).toFixed(1) : null,
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
    const roster = db.prepare('SELECT * FROM students WHERE grade = ? AND section = ?').all(grade, section);
    const rosterIds = new Set(roster.flatMap(student => [student.id, student.student_id]));
    if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate) || Number.isNaN(Date.parse(targetDate)) || records.length > 1000 || new Set(records.map((item: any) => item?.studentId)).size !== records.length || records.some((item: any) => !item || !rosterIds.has(item.studentId) || !['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'].includes(item.status))) return res.status(400).json({ error: 'Use valid dates, unique students in this class, and supported attendance statuses.' });

    const insertStmt = db.prepare(`
      INSERT INTO attendance_records (id, date, grade, section, student_id, student_name, roll_no, status, marked_by, remarks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((items: any[]) => {
      db.prepare('DELETE FROM attendance_records WHERE grade = ? AND section = ? AND date = ?').run(grade, section, targetDate);
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
    const records = scopeAcademicRecords(db.prepare('SELECT * FROM attendance_records ORDER BY date ASC').all(), req.user!, db);
    const dates = [...new Set(records.map(record => record.date))].sort().slice(-7);
    const trends = dates.map(date => {
      const day = records.filter(record => record.date === date);
      const presentCount = day.filter(record => ['PRESENT', 'LATE'].includes(record.status)).length;
      return { date, presentCount, absentCount: day.filter(record => record.status === 'ABSENT').length, attendanceRate: Number((presentCount / day.length * 100).toFixed(1)) };
    });
    const classDistribution = [...new Set(records.map(record => record.grade))].map(grade => {
      const group = records.filter(record => record.grade === grade);
      return { grade, rate: Number((group.filter(record => ['PRESENT', 'LATE'].includes(record.status)).length / group.length * 100).toFixed(1)) };
    });

    return res.json({ trends, classDistribution });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch attendance analytics.' });
  }
});

export default router;
