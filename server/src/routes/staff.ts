import express from 'express';
import { getDb } from '../db.js';
import { authMiddleware, requireRoles } from '../middleware/auth.js';

const router = express.Router();

// 1. Get All Staff Members (Faculty & Non-Teaching)
router.get('/', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { department, role, status, search } = req.query;
    let list = db.prepare('SELECT * FROM staff_details').all() as any[];

    if (department) {
      list = list.filter(s => (s.department || '').toLowerCase() === String(department).toLowerCase());
    }
    if (role) {
      list = list.filter(s => (s.role || '').toUpperCase() === String(role).toUpperCase());
    }
    if (status) {
      list = list.filter(s => (s.status || '').toUpperCase() === String(status).toUpperCase());
    }
    if (search) {
      const q = String(search).toLowerCase();
      list = list.filter(
        s =>
          (s.full_name && s.full_name.toLowerCase().includes(q)) ||
          (s.employee_id && s.employee_id.toLowerCase().includes(q)) ||
          (s.designation && s.designation.toLowerCase().includes(q)) ||
          (s.email && s.email.toLowerCase().includes(q))
      );
    }

    res.json({ staff: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Department Statistics & Staff Count
router.get('/stats', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const staff = db.prepare('SELECT * FROM staff_details').all() as any[];

    const departmentCounts: Record<string, number> = {};
    const roleCounts: Record<string, number> = {};
    let totalFaculty = 0;
    let totalSupportStaff = 0;

    staff.forEach(s => {
      const dept = s.department || 'General';
      departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;

      const r = s.role || 'STAFF';
      roleCounts[r] = (roleCounts[r] || 0) + 1;

      if (r === 'TEACHER' || r === 'FACULTY') totalFaculty++;
      else totalSupportStaff++;
    });

    res.json({
      totalCount: staff.length,
      totalFaculty,
      totalSupportStaff,
      departmentCounts,
      roleCounts,
      activeCount: staff.filter(s => s.status === 'ACTIVE').length,
      onLeaveCount: staff.filter(s => s.status === 'ON_LEAVE').length,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Get Single Staff Member by ID or Employee ID
router.get('/:id', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const staff = (db.prepare('SELECT * FROM staff_details').all() as any[]).find(
      s => s.id === id || s.employee_id === id
    );

    if (!staff) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    // Attach latest payroll records
    const payrolls = (db.prepare('SELECT * FROM payrolls').all() as any[]).filter(
      p => p.employee_id === staff.employee_id
    );

    res.json({ staff, payrolls });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Create New Staff Member
router.post('/', authMiddleware, requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'), (req, res) => {
  try {
    const db = getDb();
    const {
      fullName, email, phone, department, designation, role = 'TEACHER',
      qualification, experienceYears = 0, dateOfJoining, employmentType = 'Full-Time',
      baseSalary = 65000, bankName, accountNo, ifscCode, panNo,
      assignedSubjects = [], assignedClasses = [], avatarUrl
    } = req.body;

    if (!fullName || !email) {
      return res.status(400).json({ error: 'Full name and email are required' });
    }

    const id = `stf_${Date.now()}`;
    const employeeId = `EMP-${role === 'TEACHER' ? 'FAC' : 'STF'}-${Math.floor(100 + Math.random() * 900)}`;

    const newStaff = {
      id,
      employee_id: employeeId,
      full_name: fullName,
      email,
      phone: phone || '+91 98000 00000',
      department: department || 'Academics',
      designation: designation || (role === 'TEACHER' ? 'Faculty' : 'Staff Member'),
      role: role.toUpperCase(),
      qualification: qualification || 'Post Graduate / Bachelor',
      experience_years: Number(experienceYears) || 0,
      date_of_joining: dateOfJoining || new Date().toISOString().split('T')[0],
      employment_type: employmentType,
      status: 'ACTIVE',
      base_salary: Number(baseSalary) || 65000,
      bank_name: bankName || 'HDFC Bank',
      account_no: accountNo || '501004' + Math.floor(1000000 + Math.random() * 9000000),
      ifsc_code: ifscCode || 'HDFC0001824',
      pan_no: panNo || 'ABCD' + Math.floor(1000 + Math.random() * 9000) + 'X',
      assigned_subjects: JSON.stringify(assignedSubjects),
      assigned_classes: JSON.stringify(assignedClasses),
      avatar_url: avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      created_at: new Date().toISOString(),
    };

    const table = (db as any).data.staff_details || [];
    table.push(newStaff);
    (db as any).scheduleSave();

    res.status(201).json({ success: true, staff: newStaff });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Update Staff Details
router.put('/:id', authMiddleware, requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'), (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const table = (db as any).data.staff_details || [];
    const staff = table.find((s: any) => s.id === id || s.employee_id === id);

    if (!staff) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    const {
      fullName, email, phone, department, designation, qualification,
      experienceYears, status, baseSalary, bankName, accountNo, ifscCode, panNo,
      assignedSubjects, assignedClasses, avatarUrl
    } = req.body;

    if (fullName) staff.full_name = fullName;
    if (email) staff.email = email;
    if (phone) staff.phone = phone;
    if (department) staff.department = department;
    if (designation) staff.designation = designation;
    if (qualification) staff.qualification = qualification;
    if (experienceYears !== undefined) staff.experience_years = Number(experienceYears);
    if (status) staff.status = status;
    if (baseSalary !== undefined) staff.base_salary = Number(baseSalary);
    if (bankName) staff.bank_name = bankName;
    if (accountNo) staff.account_no = accountNo;
    if (ifscCode) staff.ifsc_code = ifscCode;
    if (panNo) staff.pan_no = panNo;
    if (avatarUrl) staff.avatar_url = avatarUrl;
    if (assignedSubjects) staff.assigned_subjects = JSON.stringify(assignedSubjects);
    if (assignedClasses) staff.assigned_classes = JSON.stringify(assignedClasses);
    staff.updated_at = new Date().toISOString();

    (db as any).scheduleSave();
    res.json({ success: true, staff });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Delete / Archive Staff Member
router.delete('/:id', authMiddleware, requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'), (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const table = (db as any).data.staff_details || [];
    const initialLen = table.length;
    (db as any).data.staff_details = table.filter((s: any) => s.id !== id && s.employee_id !== id);

    if ((db as any).data.staff_details.length === initialLen) {
      return res.status(404).json({ error: 'Staff record not found' });
    }

    (db as any).scheduleSave();
    res.json({ success: true, message: 'Staff record archived successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
