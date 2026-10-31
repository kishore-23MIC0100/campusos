import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { getDb } from '../db.js';
import { generateToken, logAudit, authMiddleware } from '../middleware/auth.js';

const router = Router();

export function getTeacherAllotments(userId: string, db: any) {
  try {
    const teacher = (db.prepare('SELECT * FROM teachers').all() as any[]).find(teacher => teacher.user_id === userId);
    if (!teacher) return { allottedClasses: [], allottedSubjects: [], department: null, employeeId: null };

    // Parse classes_handled e.g. "Grade 10A, Grade 11A, Grade 12A"
    const rawClasses = (teacher.classes_handled || '').split(',').map((c: string) => c.trim()).filter(Boolean);
    const allottedClasses = rawClasses.map((rc: string) => {
      const match = rc.match(/(Grade\s*\d+)\s*([A-Z])/i);
      if (match) {
        return { grade: match[1], section: match[2].toUpperCase() };
      }
      return null;
    }).filter(Boolean);

    // Parse subjects
    const rawSubjects = (teacher.subjects || '')
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean);

    return {
      allottedClasses,
      allottedSubjects: rawSubjects,
      department: teacher.department,
      employeeId: teacher.employee_id,
    };
  } catch (err) {
    return {
      allottedClasses: [],
      allottedSubjects: [],
      department: null,
      employeeId: null,
    };
  }
}

// Login endpoint
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { identifier, password, expectedRole } = req.body;

    if (typeof identifier !== 'string' || typeof password !== 'string' || !identifier.trim() || !password || identifier.length > 254 || password.length > 128) {
      return res.status(400).json({ error: 'Please enter your login identifier and password.' });
    }

    if ((process.env.NODE_ENV === 'production' || process.env.VERCEL) && ['Admin@2026', 'Teacher@2026', 'Student@2026', 'Parent@2026', 'Pending@2026', 'StaffDemo!2026'].includes(password)) return res.status(401).json({ error: 'Development credentials cannot be used in production. Contact your campus administrator for a secure account.' });
    const db = getDb();
    const cleanId = identifier.trim().toLowerCase();

    // Query user by email, username, student_id, or phone
    const matchingUsers = db.prepare(`
      SELECT * FROM users 
      WHERE LOWER(email) = ? 
         OR LOWER(username) = ? 
         OR LOWER(student_id) = ? 
         OR phone = ?
    `).all(cleanId, cleanId, cleanId, identifier.trim()) as any[];

    // A shared portal login can map to a separate account for each role. Use
    // the role selected on the login page to choose the matching account.
    const requestedRole = expectedRole && expectedRole !== 'ANY' ? expectedRole : null;
    const roleCandidates = requestedRole
      ? requestedRole === 'SUPER_ADMIN'
        ? matchingUsers.filter((candidate) => candidate.role === 'SUPER_ADMIN' || candidate.role === 'SCHOOL_ADMIN')
        : matchingUsers.filter((candidate) => candidate.role === requestedRole)
      : matchingUsers;
    let user: any = null;
    for (const candidate of roleCandidates) {
      if (await bcrypt.compare(password, candidate.password_hash)) {
        user = candidate;
        break;
      }
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid login credentials. Please verify your ID and try again.' });
    }

    if (user.status !== 'APPROVED') {
      return res.status(403).json({ error: user.status === 'PENDING' ? 'Your access request is awaiting administrator approval.' : 'This account is not active. Contact your campus administrator.', status: user.status });
    }

    // Check expected role alignment warning/guidance if user opened a specific portal
    const isAdminPortal = expectedRole === 'SUPER_ADMIN' && ['SUPER_ADMIN', 'SCHOOL_ADMIN'].includes(user.role);
    const roleMismatch = expectedRole && expectedRole !== 'ANY' && user.role !== expectedRole && !isAdminPortal;

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

    if (![fullName, email, password, role].every(value => typeof value === 'string' && value.trim())) {
      return res.status(400).json({ error: 'Full name, email, password, and requested role are required.' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || fullName.length > 120 || password.length < 12 || password.length > 128) return res.status(400).json({ error: 'Use a valid email, a name under 120 characters, and a password between 12 and 128 characters.' });
    if (username !== undefined && (typeof username !== 'string' || !/^[a-zA-Z0-9._-]{3,80}$/.test(username))) return res.status(400).json({ error: 'Username must be 3 to 80 letters, digits, dots, hyphens or underscores.' });
    const db = getDb();
    const cleanEmail = email.trim().toLowerCase();
    const allowedRoles = ['TEACHER', 'STAFF', 'STUDENT', 'PARENT'];
    if (!allowedRoles.includes(String(role).toUpperCase())) return res.status(400).json({ error: 'Choose a supported portal role.' });
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

// Change the authenticated user's password and revoke older sessions.
router.post('/change-password', authMiddleware, async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  if (typeof currentPassword !== 'string' || typeof newPassword !== 'string' || currentPassword.length > 128 || newPassword.length < 12 || newPassword.length > 128) return res.status(400).json({ error: 'Enter your current password and a new password between 12 and 128 characters.' });
  if (currentPassword === newPassword) return res.status(400).json({ error: 'Choose a different password.' });
  const db = getDb(); const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.id);
  if (!user || !await bcrypt.compare(currentPassword, user.password_hash)) return res.status(400).json({ error: 'Your current password is incorrect.' });
  const hash = await bcrypt.hash(newPassword, 12);
  db.prepare('UPDATE users SET password_hash = ?, token_version = ? WHERE id = ?').run(hash, Number(user.token_version || 0) + 1, user.id);
  logAudit(user.id, user.full_name, user.role, 'PASSWORD_CHANGED', 'AUTH', user.id, 'Password changed and earlier sessions revoked.');
  return res.json({ message: 'Your password has been changed. Earlier sessions have been signed out.', token: generateToken(user) });
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
  if (typeof identifier !== 'string' || !identifier.trim() || identifier.length > 254) {
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
    message: 'For password recovery, contact your campus administrator. Your request has been recorded for review.',
  });
});

export default router;
