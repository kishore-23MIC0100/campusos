import { Router } from 'express';
import { getDb } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.get('/summary', authMiddleware, (_req, res) => {
  const db = getDb();
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: process.env.SCHOOL_TIMEZONE || 'Asia/Kolkata' }).format(new Date());
  const students = db.prepare('SELECT * FROM students').all();
  const records = db.prepare('SELECT * FROM attendance_records WHERE date = ?').all(today);
  const present = records.filter(record => ['PRESENT', 'LATE'].includes(record.status)).length;
  const absent = records.filter(record => record.status === 'ABSENT').length;
  const performance = db.prepare('SELECT * FROM performance_records').all().filter(record => Number(record.max_marks) > 0 && Number.isFinite(Number(record.marks_obtained)));
  const school = db.prepare('SELECT * FROM school_profile LIMIT 1').get();
  res.json({
    metrics: {
      totalStudents: students.length,
      totalTeachers: db.prepare('SELECT count(*) FROM teachers').get().count,
      totalParents: db.prepare('SELECT count(*) FROM parents').get().count,
      presentToday: present, absentToday: absent,
      attendanceRate: records.length ? Number((present / records.length * 100).toFixed(1)) : null,
      pendingLeaves: db.prepare('SELECT count(*) FROM leave_requests WHERE status = "PENDING"').get().count,
      upcomingEvents: db.prepare('SELECT * FROM events').all().filter(event => event.date >= today).length,
      activeAnnouncements: db.prepare('SELECT count(*) FROM announcements').get().count,
      academicHealthScore: performance.length ? Number((performance.reduce((sum, record) => sum + Number(record.marks_obtained) / Number(record.max_marks) * 100, 0) / performance.length).toFixed(1)) : null,
    },
    institution: { name: school?.name || 'Scholaxys', affiliation: school?.affiliation_no || null, academicYear: school?.academic_year || null, reportGeneratedAt: new Date().toISOString() },
  });
});
export default router;
