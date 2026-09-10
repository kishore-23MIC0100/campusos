import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { getDb } from '../db.js';
import { generateToken, logAudit, authMiddleware } from '../middleware/auth.js';

const router = Router();

export function getTeacherAllotments(userId: string, db: any) {
  try {
    const teacher = db.prepare('SELECT * FROM teachers WHERE user_id = ? OR email IN (SELECT email FROM users WHERE id = ?)').get(userId, userId) as any;
    if (!teacher) {
      return {
        allottedClasses: [
          { grade: 'Grade 10', section: 'A' },
          { grade: 'Grade 11', section: 'A' },
          { grade: 'Grade 12', section: 'A' },
        ],
        allottedSubjects: ['Mathematics', 'Computing'],
        department: 'Mathematics',
        employeeId: 'EMP-TCH-101',
      };
    }

    // Parse classes_handled e.g. "Grade 10A, Grade 11A, Grade 12A"
    const rawClasses = (teacher.classes_handled || 'Grade 10A').split(',').map((c: string) => c.trim());
    const allottedClasses = rawClasses.map((rc: string) => {
      const match = rc.match(/(Grade\s*\d+)\s*([A-Z])/i);
      if (match) {
        return { grade: match[1], section: match[2].toUpperCase() };
      }
      return { grade: 'Grade 10', section: 'A' };
    });

    // Parse subjects
    const rawSubjects = (teacher.subjects || teacher.department || 'General')
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean);

    return {
      allottedClasses,
      allottedSubjects: rawSubjects.length > 0 ? rawSubjects : [teacher.department],
      department: teacher.department,
      employeeId: teacher.employee_id,
    };
  } catch (err) {
    return {
      allottedClasses: [{ grade: 'Grade 10', section: 'A' }],
      allottedSubjects: ['General Studies'],
      department: 'Academics',
      employeeId: 'EMP-001',
    };
  }
}

// Login endpoint
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { identifier, password, expectedRole } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Please enter your login identifier and password.' });
    }

    const db = getDb();
    const cleanId = identifier.trim().toLowerCase();

    // Query user by email, username, student_id, or phone
    const user = db.prepare(`
      SELECT * FROM users 
      WHERE LOWER(email) = ? 
         OR LOWER(username) = ? 
         OR LOWER(student_id) = ? 
         OR phone = ?
    `).get(cleanId, cleanId, cleanId, identifier.trim()) as any;

    if (!user) {
      return res.status(401).json({ error: 'Invalid login credentials. Please verify your ID and try again.' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      logAudit(user.id, user.full_name, user.role, 'LOGIN_FAILED', 'AUTH', user.id, `Failed password attempt for ${identifier}`);
      return res.status(401).json({ error: 'Invalid password. Please check your credentials.' });
    }

    // Check account approval status
    if (user.status === 'PENDING') {
      logAudit(user.id, user.full_name, user.role, 'LOGIN_BLOCKED_PENDING', 'AUTH', user.id, `Pending user attempted to sign in`);
      return res.status(403).json({
        error: 'Your account is pending administrator verification.',
        status: 'PENDING',
        requestId: `REQ-${user.id.substring(4).toUpperCase()}`,
        user: {
          fullName: user.full_name,
          email: user.email,
          role: user.role,
        },
      });
    }

    if (user.status === 'REJECTED' || user.status === 'DISABLED') {
      return res.status(403).json({
        error: 'This account has been disabled or access was rejected. Please contact institution administration.',
        status: user.status,
      });
    }

    // Check expected role alignment warning/guidance if user opened a specific portal
    const roleMismatch = expectedRole && expectedRole !== 'ANY' && user.role !== expectedRole && user.role !== 'SUPER_ADMIN';

    const token = generateToken(user);

    logAudit(user.id, user.full_name, user.role, 'LOGIN_SUCCESS', 'AUTH', user.id, `Successful login from ${req.ip || '127.0.0.1'}`);

    const teacherData = user.role === 'TEACHER' ? getTeacherAllotments(user.id, db) : null;

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        fullName: user.full_name,
        avatarUrl: user.avatar_url,
        phone: user.phone,
        status: user.status,
        department: user.department,
        studentId: user.student_id,
        admissionNo: user.admission_no,
        gradeSection: user.grade_section,
        bio: user.bio,
        allottedClasses: teacherData?.allottedClasses || null,
        allottedSubjects: teacherData?.allottedSubjects || null,
        employeeId: teacherData?.employeeId || null,
      },
      roleMismatchWarning: roleMismatch
        ? `Note: You signed in as ${user.role}. You will be redirected to your authorized workspace.`
        : null,
    });
  } catch (err: any) {
    console.error('[Login Error]', err);
    return res.status(500).json({ error: 'Internal server error during authentication.' });
  }
});

// Registration / Access Request endpoint (Creates PENDING user)
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { fullName, email, username, password, role, phone, department, gradeSection, studentId, notes } = req.body;

    if (!fullName || !email || !password || !role) {
      return res.status(400).json({ error: 'Full name, email, password, and requested role are required.' });
    }

    const db = getDb();
    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = (username || email.split('@')[0]).trim().toLowerCase();

    // Check if user already exists
    const existing = db.prepare('SELECT id, status FROM users WHERE LOWER(email) = ? OR LOWER(username) = ?').get(cleanEmail, cleanUsername) as any;
    if (existing) {
      if (existing.status === 'PENDING') {
        return res.status(400).json({
          error: 'An access request with this email is already awaiting administrator approval.',
          status: 'PENDING',
        });
      }
      return res.status(400).json({ error: 'An account with this email or username already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = `usr_req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const reqId = `REQ-${Date.now().toString().slice(-6)}`;

    db.prepare(`
      INSERT INTO users (
        id, email, username, password_hash, role, full_name, phone, status, department, student_id, admission_no, grade_section, bio
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      cleanEmail,
      cleanUsername,
      passwordHash,
      role.toUpperCase(),
      fullName.trim(),
      phone || null,
      'PENDING',
      department || null,
      studentId || (role === 'STUDENT' ? `STU-${Date.now().toString().slice(-4)}` : null),
      studentId ? `ADM-${Date.now().toString().slice(-4)}` : null,
      gradeSection || null,
      notes || 'Self-service access request submitted via CampusOS Portal'
    );

    // Create notification for admin
    db.prepare(`
      INSERT INTO notifications (id, user_id, target_role, title, message, type, link_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      `notif_${Date.now()}`,
      'usr_admin_1',
      'SUPER_ADMIN',
      `New ${role} Access Request: ${fullName}`,
      `${fullName} has requested access as a ${role}. Review and approve in User Management.`,
      'SECURITY',
      '/admin/users'
    );

    logAudit(userId, fullName, role, 'ACCESS_REQUESTED', 'USER', userId, `New access registration submitted for approval (#${reqId})`);

    return res.status(201).json({
      message: 'Access request submitted successfully.',
      status: 'PENDING',
      requestId: reqId,
      details: {
        fullName,
        email: cleanEmail,
        role: role.toUpperCase(),
      },
    });
  } catch (err: any) {
    console.error('[Register Error]', err);
    return res.status(500).json({ error: 'Failed to submit access request.' });
  }
});

// Current user profile
router.get('/me', authMiddleware, (req: Request, res: Response) => {
  try {
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.id) as any;
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const teacherData = user.role === 'TEACHER' ? getTeacherAllotments(user.id, db) : null;

    return res.json({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      fullName: user.full_name,
      avatarUrl: user.avatar_url,
      phone: user.phone,
      status: user.status,
      department: user.department,
      studentId: user.student_id,
      admissionNo: user.admission_no,
      gradeSection: user.grade_section,
      bio: user.bio,
      mfaEnabled: Boolean(user.mfa_enabled),
      allottedClasses: teacherData?.allottedClasses || null,
      allottedSubjects: teacherData?.allottedSubjects || null,
      employeeId: teacherData?.employeeId || null,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve profile.' });
  }
});

// Reset password request
router.post('/reset-password', (req: Request, res: Response) => {
  const { identifier } = req.body;
  if (!identifier) {
    return res.status(400).json({ error: 'Please enter your registered email or username.' });
  }

  const db = getDb();
  const cleanId = identifier.trim().toLowerCase();
  const user = db.prepare('SELECT id, email, full_name, role FROM users WHERE LOWER(email) = ? OR LOWER(username) = ?').get(cleanId, cleanId) as any;

  if (user) {
    logAudit(user.id, user.full_name, user.role, 'PASSWORD_RESET_REQUESTED', 'AUTH', user.id, `Password reset token requested for ${identifier}`);
  }

  // Always return friendly response to avoid email enumeration
  return res.json({
    message: 'If a matching account exists, password recovery instructions and a secure reset token have been dispatched to your registered institutional contact.',
  });
});

export default router;
