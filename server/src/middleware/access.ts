import type { Request, Response, NextFunction } from 'express';
import { getDb } from '../db.js';
import { authMiddleware, type AuthenticatedUser } from './auth.js';

export function accessibleStudents(user: AuthenticatedUser, db = getDb()): any[] | null {
  if (['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'].includes(user.role)) return null;
  const students = db.prepare('SELECT * FROM students').all();
  if (user.role === 'STUDENT') return students.filter(student => student.user_id === user.id || (user.studentId && student.student_id === user.studentId));
  if (user.role === 'PARENT') {
    const parent = db.prepare('SELECT * FROM parents WHERE user_id = ? OR email = ?').get(user.id, user.email);
    let ids: string[] = [];
    try { ids = JSON.parse(parent?.children_ids || '[]'); } catch { /* malformed links grant no access */ }
    return students.filter(student => student.parent_id === user.id || ids.includes(student.id) || ids.includes(student.student_id));
  }
  return [];
}

export function scopeAcademicRecords(records: any[], user: AuthenticatedUser, db = getDb()) {
  const students = accessibleStudents(user, db);
  if (students === null) return records;
  const ids = new Set(students.flatMap(student => [student.id, student.student_id, student.user_id]).filter(Boolean));
  return records.filter(record => ids.has(record.student_id));
}

export function canAccessClass(record: any, user: AuthenticatedUser, db = getDb()) {
  const students = accessibleStudents(user, db);
  return students === null || students.some(student => student.grade === record.grade && student.section === record.section);
}

// Central defense in depth complements each route's ownership checks.
export function accessPolicy(req: Request, res: Response, next: NextFunction) {
  const path = req.path.replace(/\/$/, '') || '/';
  const family = path.split('/')[1];
  const publicRead = req.method === 'GET' && ['health', 'events', 'announcements', 'spotlight', 'school'].includes(family);
  if (publicRead && !req.headers.authorization) return next();
  authMiddleware(req, res, () => {
    const role = req.user!.role;
    const admin = ['SUPER_ADMIN', 'SCHOOL_ADMIN'].includes(role);
    const educator = admin || role === 'TEACHER';
    const read = ['GET', 'HEAD', 'OPTIONS'].includes(req.method);
    const staffDirectory = path === '/staff/directory' && read && (educator || role === 'STAFF');
    if (['payroll', 'staff', 'audit-logs', 'users'].includes(family) && !admin && !staffDirectory) return res.status(403).json({ error: 'Administrator access is required.' });
    if (family === 'reports' && !educator) return res.status(403).json({ error: 'Academic leadership access is required.' });
    if (family === 'parents' && path !== '/parents/my-children' && !educator) return res.status(403).json({ error: 'You may only access your linked children.' });
    if (role === 'STAFF') {
      const allowed = staffDirectory || (family === 'leave' && ['GET', 'POST'].includes(req.method)) ||
        (['events', 'announcements', 'transport', 'notifications'].includes(family) && read) ||
        (family === 'events' && /^\/events\/[^/]+\/rsvp$/.test(path) && req.method === 'POST') ||
        (family === 'notifications' && ['PUT', 'DELETE'].includes(req.method));
      if (!allowed) return res.status(403).json({ error: 'This staff account does not have access to that operation.' });
    }
    if (!read) {
      const selfService = family === 'notifications' || (family === 'leave' && path === '/leave' && req.method === 'POST') ||
        (family === 'events' && /^\/events\/[^/]+\/rsvp$/.test(path) && req.method === 'POST') ||
        (family === 'homework' && /^\/homework\/[^/]+\/submit$/.test(path) && req.method === 'POST' && role === 'STUDENT') ||
        (family === 'assessments' && /^\/assessments\/[^/]+\/(start|submit)$/.test(path) && req.method === 'POST' && role === 'STUDENT');
      if (!selfService && !educator) return res.status(403).json({ error: 'You do not have permission to change these records.' });
      if (['students', 'school', 'transport', 'staff', 'payroll', 'users'].includes(family) && !admin) return res.status(403).json({ error: 'Administrator access is required to change these records.' });
    }
    next();
  });
}
