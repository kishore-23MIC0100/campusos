import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getDb } from '../db.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'campusos-super-secret-enterprise-jwt-key-2026';

export interface AuthenticatedUser {
  id: string;
  email: string;
  username: string;
  role: string;
  fullName: string;
  status: string;
  studentId?: string;
  department?: string;
  phone?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export function generateToken(user: any) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      fullName: user.full_name,
      status: user.status,
      studentId: user.student_id,
      department: user.department,
      phone: user.phone,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. No bearer token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
    
    // Check if user still exists and is APPROVED in database
    const db = getDb();
    const user = db.prepare('SELECT id, email, username, role, full_name, status, student_id, department FROM users WHERE id = ?').get(decoded.id) as any;
    
    if (!user) {
      return res.status(401).json({ error: 'User account not found.' });
    }

    if (user.status !== 'APPROVED') {
      return res.status(403).json({ error: `Account access restricted. Status is ${user.status}.` });
    }

    req.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      fullName: user.full_name,
      status: user.status,
      studentId: user.student_id,
      department: user.department,
    };

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
}

export function requireRoles(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (req.user.role === 'SUPER_ADMIN') {
      return next(); // Super admin bypasses role check
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Permission denied. Required role: [${allowedRoles.join(', ')}], current role: ${req.user.role}`,
      });
    }

    next();
  };
}

export function logAudit(
  userId: string | null,
  userName: string,
  userRole: string,
  action: string,
  entityType: string,
  entityId: string | null,
  description: string,
  ipAddress: string = '127.0.0.1',
  userAgent: string = 'CampusOS Client'
) {
  try {
    const db = getDb();
    const id = `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    db.prepare(`
      INSERT INTO audit_logs (id, user_id, user_name, user_role, action, entity_type, entity_id, description, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, userId, userName, userRole, action, entityType, entityId, description, ipAddress, userAgent);
  } catch (err) {
    console.error('[Audit Log Error]', err);
  }
}
