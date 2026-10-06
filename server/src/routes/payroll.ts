import express from 'express';
import { getDb } from '../db.js';
import { authMiddleware, requireRoles } from '../middleware/auth.js';

const router = express.Router();

// 1. Get Payroll Summary & Stats
router.get('/summary', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const payrolls = db.prepare('SELECT * FROM payrolls').all() as any[];
    const staff = db.prepare('SELECT * FROM staff_details').all() as any[];

    const currentYear = 2026;
    const currentMonth = 'October';

    const currentPayrolls = payrolls.filter(
      p => String(p.month).toLowerCase() === currentMonth.toLowerCase() && Number(p.year) === currentYear
    );

    const totalDisbursed = currentPayrolls
      .filter(p => p.payment_status === 'PAID')
      .reduce((acc, p) => acc + (Number(p.net_salary) || 0), 0);

    const pendingDisbursements = currentPayrolls
      .filter(p => p.payment_status !== 'PAID')
      .reduce((acc, p) => acc + (Number(p.net_salary) || 0), 0);

    const totalDeductions = currentPayrolls.reduce(
      (acc, p) => acc + (Number(p.pf_deduction) || 0) + (Number(p.tax_deduction) || 0),
      0
    );

    const departmentBreakdown: Record<string, number> = {};
    currentPayrolls.forEach(p => {
      const dept = p.department || 'General';
      departmentBreakdown[dept] = (departmentBreakdown[dept] || 0) + (Number(p.net_salary) || 0);
    });

    res.json({
      month: currentMonth,
      year: currentYear,
      totalStaffCount: staff.length,
      processedCount: currentPayrolls.length,
      paidCount: currentPayrolls.filter(p => p.payment_status === 'PAID').length,
      pendingCount: currentPayrolls.filter(p => p.payment_status !== 'PAID').length,
      totalDisbursed,
      pendingDisbursements,
      totalDeductions,
      departmentBreakdown,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Get All Payroll Records with Filters
router.get('/records', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { month, year, department, status, search } = req.query;
    let records = db.prepare('SELECT * FROM payrolls').all() as any[];

    if (month) {
      records = records.filter(r => String(r.month).toLowerCase() === String(month).toLowerCase());
    }
    if (year) {
      records = records.filter(r => Number(r.year) === Number(year));
    }
    if (department) {
      records = records.filter(r => (r.department || '').toLowerCase() === String(department).toLowerCase());
    }
    if (status) {
      records = records.filter(r => (r.payment_status || '').toUpperCase() === String(status).toUpperCase());
    }
    if (search) {
      const q = String(search).toLowerCase();
      records = records.filter(
        r =>
          (r.employee_name && r.employee_name.toLowerCase().includes(q)) ||
          (r.employee_id && r.employee_id.toLowerCase().includes(q)) ||
          (r.designation && r.designation.toLowerCase().includes(q))
      );
    }

    res.json({ records });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Get Employee's Personal Payslips
router.get('/employee/:employeeId', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { employeeId } = req.params;
    const records = (db.prepare('SELECT * FROM payrolls').all() as any[]).filter(
      r => r.employee_id === employeeId || r.user_id === employeeId
    );
    res.json({ records });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Batch Generate Monthly Payroll for All Staff
router.post('/generate', authMiddleware, requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'), (req, res) => {
  try {
    const db = getDb();
    const { month = 'October', year = 2026 } = req.body;
    const staffList = db.prepare('SELECT * FROM staff_details').all() as any[];

    let createdCount = 0;
    const now = new Date().toISOString();

    for (const s of staffList) {
      const existing = (db.prepare('SELECT * FROM payrolls').all() as any[]).find(
        p => p.employee_id === s.employee_id && String(p.month).toLowerCase() === String(month).toLowerCase() && Number(p.year) === Number(year)
      );

      if (!existing) {
        const base = Number(s.base_salary) || 65000;
        const hra = Math.round(base * 0.20);
        const allowances = Math.round(base * 0.15);
        const gross = base + hra + allowances;
        const pf = Math.round(base * 0.12);
        const tax = Math.round(gross * 0.08);
        const net = gross - pf - tax;

        db.prepare(`
          INSERT INTO payrolls (
            id, employee_id, user_id, employee_name, department, designation,
            month, year, base_salary, hra, allowances, pf_deduction, tax_deduction,
            gross_salary, net_salary, payment_status, payment_date, payment_method, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          `pr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          s.employee_id,
          s.id,
          s.full_name,
          s.department,
          s.designation,
          month,
          year,
          base,
          hra,
          allowances,
          pf,
          tax,
          gross,
          net,
          'PROCESSED',
          now.split('T')[0],
          'Bank Transfer (NEFT/RTGS)',
          `Standard automated payroll run for ${month} ${year}`
        );
        createdCount++;
      }
    }

    res.json({ success: true, message: `Successfully generated ${createdCount} payroll records for ${month} ${year}.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Update Payroll Payment Status (e.g. Mark as PAID)
router.patch('/:id/status', authMiddleware, requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'), (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { status, paymentMethod, paymentDate } = req.body;

    const allPayrolls = db.prepare('SELECT * FROM payrolls').all() as any[];
    const target = allPayrolls.find(p => p.id === id);

    if (!target) {
      return res.status(404).json({ error: 'Payroll record not found' });
    }

    target.payment_status = status || target.payment_status;
    target.payment_method = paymentMethod || target.payment_method || 'Bank Direct Deposit';
    target.payment_date = paymentDate || new Date().toISOString().split('T')[0];
    target.updated_at = new Date().toISOString();

    db.scheduleSave();
    res.json({ success: true, record: target });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Get Itemized Single Payslip
router.get('/:id/payslip', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const record = (db.prepare('SELECT * FROM payrolls').all() as any[]).find(p => p.id === id);

    if (!record) {
      return res.status(404).json({ error: 'Payslip not found' });
    }

    const staff = (db.prepare('SELECT * FROM staff_details').all() as any[]).find(
      s => s.employee_id === record.employee_id
    ) || {};

    res.json({
      payslip: {
        ...record,
        pan_no: staff.pan_no || 'ABCDE1234F',
        bank_name: staff.bank_name || 'HDFC Bank',
        account_no: staff.account_no || '5010049281920',
        ifsc_code: staff.ifsc_code || 'HDFC0001824',
        date_of_joining: staff.date_of_joining || '2021-06-01',
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
