import { Router, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { getDb } from '../db.js';
import { authMiddleware, logAudit } from '../middleware/auth.js';

const router = Router();

// List leave requests
router.get('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const { status, role, search } = req.query;
    const db = getDb();

    let query = 'SELECT * FROM leave_requests WHERE 1=1';
    const params: any[] = [];

    if (!['SUPER_ADMIN', 'SCHOOL_ADMIN'].includes(req.user!.role)) {
      query += ' AND applicant_id = ?';
      params.push(req.user!.id);
    }

    if (status && status !== 'ALL') {
      query += ' AND status = ?';
      params.push(status);
    }

    if (role && role !== 'ALL') {
      query += ' AND applicant_role = ?';
      params.push(role);
    }

    if (search) {
      query += ' AND (LOWER(applicant_name) LIKE ? OR LOWER(reason) LIKE ? OR LOWER(leave_type) LIKE ?)';
      const term = `%${String(search).toLowerCase()}%`;
      params.push(term, term, term);
    }

    query += ' ORDER BY CASE WHEN status = "PENDING" THEN 0 ELSE 1 END, submitted_at DESC';

    const leaves = db.prepare(query).all(...params);

    // Compute analytics
    const allLeaves = ['SUPER_ADMIN', 'SCHOOL_ADMIN'].includes(req.user!.role)
      ? db.prepare('SELECT status, leave_type FROM leave_requests').all() as any[]
      : leaves as any[];
    const analytics = {
      total: allLeaves.length,
      pending: allLeaves.filter(l => l.status === 'PENDING').length,
      approved: allLeaves.filter(l => l.status === 'APPROVED').length,
      rejected: allLeaves.filter(l => l.status === 'REJECTED').length,
    };

    return res.json({ leaves, analytics });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch leave requests.' });
  }
});

// Submit new leave request
router.post('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const { leaveType, fromDate, toDate, totalDays, reason, isEmergency } = req.body;

    if (!leaveType || !fromDate || !toDate || !reason) {
      return res.status(400).json({ error: 'Leave type, start date, end date, and reason are required.' });
    }

    const db = getDb();
    const start = Date.parse(fromDate); const end = Date.parse(toDate);
    if (typeof leaveType !== 'string' || typeof reason !== 'string' || reason.trim().length < 3 || reason.length > 2000 || !/^\d{4}-\d{2}-\d{2}$/.test(fromDate) || !/^\d{4}-\d{2}-\d{2}$/.test(toDate) || !Number.isFinite(start) || !Number.isFinite(end) || end < start) return res.status(400).json({ error: 'Enter valid leave dates and a reason between 3 and 2000 characters.' });
    const days = Math.round((end - start) / 86400000) + 1;
    if (days > 366) return res.status(400).json({ error: 'Leave requests cannot exceed one year.' });
    const id = `lv_${randomUUID()}`;

    db.prepare(`
      INSERT INTO leave_requests (
        id, applicant_id, applicant_name, applicant_role, leave_type, from_date, to_date, total_days, reason, is_emergency, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      req.user!.id,
      req.user!.fullName,
      req.user!.role,
      leaveType.toUpperCase(),
      fromDate,
      toDate,
      days,
      reason.trim(),
      isEmergency ? 1 : 0,
      'PENDING'
    );

    // Put the request in both leadership inboxes, independent of which admin
    // account is used to review leave.
    const reviewers = db.prepare("SELECT id, role FROM users WHERE role IN ('SUPER_ADMIN', 'SCHOOL_ADMIN') AND status = 'APPROVED'").all() as any[];
    const insertNotification = db.prepare(`
      INSERT INTO notifications (id, user_id, target_role, title, message, type, link_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    reviewers.forEach((reviewer, index) => insertNotification.run(
      `notif_${Date.now()}_${index}`,
      reviewer.id,
      reviewer.role,
      `New ${leaveType} Leave Request: ${req.user!.fullName}`,
      `${req.user!.fullName} (${req.user!.role}) submitted a leave application for ${fromDate} to ${toDate}.`,
      'LEAVE',
      '/leave'
    ));

    logAudit(
      req.user!.id,
      req.user!.fullName,
      req.user!.role,
      'LEAVE_REQUESTED',
      'LEAVE',
      id,
      `Submitted ${leaveType} leave request from ${fromDate} to ${toDate} (${reason})`
    );

    return res.status(201).json({ message: 'Leave application submitted successfully.', leaveId: id });
  } catch (err: any) {
    console.error('[Leave Submit Error]', err);
    return res.status(500).json({ error: 'Failed to submit leave request.' });
  }
});

// Approve leave request
router.put('/:id/approve', authMiddleware, (req: Request, res: Response) => {
  try {
    if (!['SUPER_ADMIN', 'SCHOOL_ADMIN'].includes(req.user!.role)) return res.status(403).json({ error: 'Only administrators can approve leave requests.' });
    const { id } = req.params;
    const { remarks } = req.body;
    const db = getDb();

    const leave = db.prepare('SELECT * FROM leave_requests WHERE id = ?').get(id) as any;
    if (!leave) {
      return res.status(404).json({ error: 'Leave request not found.' });
    }

    if (leave.status !== 'PENDING') return res.status(409).json({ error: 'This leave request has already been reviewed.' });
    db.prepare(`
      UPDATE leave_requests 
      SET status = 'APPROVED', reviewed_by = ?, reviewer_remarks = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(req.user!.fullName, remarks || 'Approved by authority.', id);

    // Notify applicant
    db.prepare(`
      INSERT INTO notifications (id, user_id, target_role, title, message, type, link_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      `notif_${Date.now()}`,
      leave.applicant_id,
      leave.applicant_role,
      'Leave Application Approved',
      `Your ${leave.leave_type} leave request (${leave.from_date} to ${leave.to_date}) has been approved by ${req.user!.fullName}.`,
      'LEAVE',
      '/leave'
    );

    logAudit(
      req.user!.id,
      req.user!.fullName,
      req.user!.role,
      'LEAVE_APPROVED',
      'LEAVE',
      id,
      `Approved leave request for ${leave.applicant_name}`
    );

    return res.json({ message: `Leave request for ${leave.applicant_name} approved.` });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to approve leave request.' });
  }
});

// Reject leave request
router.put('/:id/reject', authMiddleware, (req: Request, res: Response) => {
  try {
    if (!['SUPER_ADMIN', 'SCHOOL_ADMIN'].includes(req.user!.role)) return res.status(403).json({ error: 'Only administrators can decline leave requests.' });
    const { id } = req.params;
    const { remarks } = req.body;
    const db = getDb();

    const leave = db.prepare('SELECT * FROM leave_requests WHERE id = ?').get(id) as any;
    if (!leave) {
      return res.status(404).json({ error: 'Leave request not found.' });
    }

    if (leave.status !== 'PENDING') return res.status(409).json({ error: 'This leave request has already been reviewed.' });
    db.prepare(`
      UPDATE leave_requests 
      SET status = 'REJECTED', reviewed_by = ?, reviewer_remarks = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(req.user!.fullName, remarks || 'Leave request declined due to institutional requirements.', id);

    // Notify applicant
    db.prepare(`
      INSERT INTO notifications (id, user_id, target_role, title, message, type, link_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      `notif_${Date.now()}`,
      leave.applicant_id,
      leave.applicant_role,
      'Leave Application Update',
      `Your ${leave.leave_type} leave request was reviewed by ${req.user!.fullName}. Status: Declined. Remarks: ${remarks || 'None'}`,
      'LEAVE',
      '/leave'
    );

    logAudit(
      req.user!.id,
      req.user!.fullName,
      req.user!.role,
      'LEAVE_REJECTED',
      'LEAVE',
      id,
      `Rejected leave request for ${leave.applicant_name}`
    );

    return res.json({ message: `Leave request for ${leave.applicant_name} declined.` });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to reject leave request.' });
  }
});

export default router;
