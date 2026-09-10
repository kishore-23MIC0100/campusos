import { Router, Request, Response } from 'express';
import { getDb } from '../db.js';
import { authMiddleware, logAudit } from '../middleware/auth.js';

const router = Router();

// School Profile
router.get('/profile', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const profile = db.prepare('SELECT * FROM school_profile LIMIT 1').get();
    return res.json({ profile });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch school profile.' });
  }
});

// Update School Profile (Admin)
router.put('/profile', authMiddleware, (req: Request, res: Response) => {
  try {
    const { name, affiliationNo, principalName, vicePrincipalName, email, phone, website, address, motto, vision } = req.body;
    const db = getDb();

    db.prepare(`
      UPDATE school_profile 
      SET name = ?, affiliation_no = ?, principal_name = ?, vice_principal_name = ?, email = ?, phone = ?, website = ?, address = ?, motto = ?, vision = ?
      WHERE id = 'sch_1'
    `).run(name, affiliationNo, principalName, vicePrincipalName, email, phone, website, address, motto, vision);

    logAudit(req.user!.id, req.user!.fullName, req.user!.role, 'SCHOOL_PROFILE_UPDATED', 'SCHOOL', 'sch_1', 'Updated institution core profile and credentials');

    return res.json({ message: 'Institution profile updated successfully.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update school profile.' });
  }
});

// Management Hierarchy
router.get('/hierarchy', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const hierarchy = db.prepare('SELECT * FROM management_hierarchy ORDER BY priority_order ASC').all();
    return res.json({ hierarchy });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch management hierarchy.' });
  }
});

// Facilities & 3D Campus Rooms
router.get('/facilities', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const facilities = db.prepare('SELECT * FROM rooms_facilities ORDER BY building_name, room_code').all();
    return res.json({ facilities });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch campus facilities.' });
  }
});

// Classes
router.get('/classes', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const classes = db.prepare('SELECT * FROM classes ORDER BY grade, section').all();
    return res.json({ classes });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch classes.' });
  }
});

// Subjects
router.get('/subjects', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const subjects = db.prepare('SELECT * FROM subjects ORDER BY department, name').all();
    return res.json({ subjects });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch subjects.' });
  }
});

export default router;
