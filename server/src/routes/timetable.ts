import { Router, Request, Response } from 'express';
import { getDb } from '../db.js';
import { authMiddleware, logAudit } from '../middleware/auth.js';

const router = Router();

// Get timetable
router.get('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const { grade, section, teacherName, day } = req.query;
    const db = getDb();

    let query = 'SELECT * FROM timetables WHERE 1=1';
    const params: any[] = [];

    if (grade && grade !== 'ALL') {
      query += ' AND grade = ?';
      params.push(grade);
    }
    if (section && section !== 'ALL') {
      query += ' AND section = ?';
      params.push(section);
    }
    if (teacherName) {
      query += ' AND LOWER(teacher_name) LIKE ?';
      params.push(`%${String(teacherName).toLowerCase()}%`);
    }
    if (day && day !== 'ALL') {
      query += ' AND day_of_week = ?';
      params.push(day);
    }

    query += ' ORDER BY CASE day_of_week WHEN "Monday" THEN 1 WHEN "Tuesday" THEN 2 WHEN "Wednesday" THEN 3 WHEN "Thursday" THEN 4 WHEN "Friday" THEN 5 ELSE 6 END, period_index ASC';

    const slots = db.prepare(query).all(...params);
    return res.json({ slots });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch timetable.' });
  }
});

// Create / Add timetable slot with clash detection
router.post('/', authMiddleware, (req: Request, res: Response) => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.role !== 'SCHOOL_ADMIN') {
      return res.status(403).json({ error: 'Access Denied: Timetable configuration is restricted to Institutional Administrators.' });
    }

    const { grade, section, dayOfWeek, periodIndex, startTime, endTime, subject, teacherName, roomNumber } = req.body;

    if (!grade || !section || !dayOfWeek || !periodIndex || !subject) {
      return res.status(400).json({ error: 'Grade, section, day, period index, and subject are required.' });
    }

    const db = getDb();

    // 1. Conflict Check: Teacher double-booking
    if (teacherName) {
      const teacherClash = db.prepare(`
        SELECT * FROM timetables 
        WHERE day_of_week = ? AND period_index = ? AND LOWER(teacher_name) = ?
      `).get(dayOfWeek, periodIndex, teacherName.toLowerCase()) as any;

      if (teacherClash) {
        return res.status(409).json({
          error: `Teacher Scheduling Conflict: ${teacherName} is already assigned to ${teacherClash.grade} ${teacherClash.section} (${teacherClash.subject}) during Period ${periodIndex} on ${dayOfWeek}.`,
          conflictType: 'TEACHER_BUSY',
          existingSlot: teacherClash,
        });
      }
    }

    // 2. Conflict Check: Room collision
    if (roomNumber) {
      const roomClash = db.prepare(`
        SELECT * FROM timetables 
        WHERE day_of_week = ? AND period_index = ? AND LOWER(room_number) = ?
      `).get(dayOfWeek, periodIndex, roomNumber.toLowerCase()) as any;

      if (roomClash) {
        return res.status(409).json({
          error: `Facility Clash: ${roomNumber} is already occupied by ${roomClash.grade} ${roomClash.section} (${roomClash.subject}) during Period ${periodIndex}.`,
          conflictType: 'ROOM_OCCUPIED',
          existingSlot: roomClash,
        });
      }
    }

    const id = `tt_${Date.now()}`;
    db.prepare(`
      INSERT INTO timetables (
        id, grade, section, day_of_week, period_index, start_time, end_time, subject, teacher_name, room_number
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, grade, section, dayOfWeek, periodIndex, startTime || '09:00', endTime || '09:45', subject, teacherName || 'TBD', roomNumber || 'Room 101');

    logAudit(
      req.user!.id,
      req.user!.fullName,
      req.user!.role,
      'TIMETABLE_UPDATED',
      'TIMETABLE',
      id,
      `Allocated ${subject} for ${grade} ${section} on ${dayOfWeek} Period ${periodIndex}`
    );

    return res.status(201).json({ message: 'Timetable slot created successfully.', id });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to create timetable slot.' });
  }
});

// Delete slot
router.delete('/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = getDb();
    db.prepare('DELETE FROM timetables WHERE id = ?').run(id);
    return res.json({ message: 'Timetable slot removed.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to delete timetable slot.' });
  }
});

export default router;
