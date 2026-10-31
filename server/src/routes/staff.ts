import express from 'express';
import { randomUUID } from 'node:crypto';
import { staffCategories, getStaffCategory, directoryEntry } from '../staff-categories.js';
import { getDb } from '../db.js';
import { authMiddleware, requireRoles } from '../middleware/auth.js';

const router = express.Router();

function validateStaffInput(body: any, creating = false): string | null {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return 'Supply a staff record.';
  for (const key of ['fullName','email','phone','department','designation','qualification','dateOfJoining','employmentType','status','bankName','accountNo','ifscCode','panNo','avatarUrl']) {
    if (body[key] !== undefined && body[key] !== null && (typeof body[key] !== 'string' || body[key].length > 500)) return `${key} must be text of at most 500 characters.`;
  }
  if (creating && (!body.fullName?.trim() || !body.department?.trim() || !body.designation?.trim())) return 'Full name, department and job title are required.';
  if (body.email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) return 'Enter a valid work email address.';
  if (body.status && !['ACTIVE','ON_LEAVE','INACTIVE','ARCHIVED'].includes(body.status)) return 'Choose a supported employment status.';
  if (body.experienceYears !== undefined && (!Number.isFinite(Number(body.experienceYears)) || Number(body.experienceYears) < 0 || Number(body.experienceYears) > 70)) return 'Experience must be between 0 and 70 years.';
  if (body.baseSalary !== undefined && (!Number.isFinite(Number(body.baseSalary)) || Number(body.baseSalary) < 0)) return 'Salary must be a non-negative number.';
  if (body.dateOfJoining && !/^\d{4}-\d{2}-\d{2}$/.test(body.dateOfJoining)) return 'Joining date must use YYYY-MM-DD.';
  for (const key of ['assignedSubjects','assignedClasses']) if (body[key] !== undefined && (!Array.isArray(body[key]) || body[key].length > 100)) return `${key} must contain at most 100 items.`;
  return null;
}

// The internal directory deliberately excludes salary, bank, PAN and payroll records.
router.get('/directory', authMiddleware, requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STAFF'), (req, res) => {
  const all = getDb().prepare('SELECT * FROM staff_details').all().filter(staff => ['ACTIVE', 'ON_LEAVE'].includes(staff.status));
  const entries = all.map(directoryEntry);
  const categoryCounts = Object.fromEntries(staffCategories.map(category => [category.id, entries.filter(entry => entry.category === category.id).length]));
  const category = String(req.query.category || 'ALL');
  const search = String(req.query.search || '').trim().toLowerCase();
  const staff = entries.filter(entry => (category === 'ALL' || entry.category === category) && (!search || [entry.fullName, entry.designation, entry.department, entry.employeeId].some(value => String(value || '').toLowerCase().includes(search))));
  const myProfile = entries.find(entry => entry.email.toLowerCase() === req.user!.email.toLowerCase()) || null;
  res.json({ staff, categories: staffCategories, categoryCounts, myProfile });
});

// 1. Get All Staff Members (Faculty & Non-Teaching)
router.get('/', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { department, role, status, search, category } = req.query;
    let list = db.prepare('SELECT * FROM staff_details').all().map(staff => ({ ...staff, staff_category: getStaffCategory(staff) })) as any[];
    if (category && category !== 'ALL') list = list.filter(staff => staff.staff_category === category);

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

    res.json({ staff: list, categories: staffCategories });
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
      categories: staffCategories,
      categoryCounts: Object.fromEntries(staffCategories.map(category => [category.id, staff.filter(member => getStaffCategory(member) === category.id).length])),
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

    res.json({ staff: { ...staff, staff_category: getStaffCategory(staff) }, payrolls });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Create New Staff Member
router.post('/', authMiddleware, requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'), (req, res) => {
  const validation = validateStaffInput(req.body, true);
  if (validation) return res.status(400).json({ error: validation });
  try {
    const db = getDb();
    const {
      fullName, email, phone, department, designation, role = 'TEACHER',
      staffCategory, qualification, experienceYears = 0, dateOfJoining, employmentType = 'Full-Time',
      baseSalary = 0, bankName, accountNo, ifscCode, panNo,
      assignedSubjects = [], assignedClasses = [], avatarUrl
    } = req.body;

    if (typeof fullName !== 'string' || typeof email !== 'string' || !fullName.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Full name and email are required' });
    }

    if (db.prepare('SELECT id FROM staff_details WHERE LOWER(email) = ?').get(email.toLowerCase())) return res.status(409).json({ error: 'A staff record with this email already exists.' });
    if (!['TEACHER', 'STAFF', 'FACULTY'].includes(String(role).toUpperCase()) || !Number.isFinite(Number(baseSalary)) || Number(baseSalary) < 0) return res.status(400).json({ error: 'Choose a supported staff role and a non-negative salary.' });
    if (staffCategory && !staffCategories.some(category => category.id === staffCategory)) return res.status(400).json({ error: 'Choose a supported staff category.' });
    const id = `stf_${randomUUID()}`;
    const employeeId = `EMP-${String(role).toUpperCase() === 'TEACHER' ? 'FAC' : 'STF'}-${randomUUID().slice(0,8).toUpperCase()}`;

    const newStaff = {
      id,
      employee_id: employeeId,
      full_name: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone || null,
      department: department || (String(role).toUpperCase() === 'TEACHER' ? 'Academics' : 'Campus services'),
      staff_category: staffCategory || getStaffCategory({ role: String(role).toUpperCase(), designation, department }),
      designation: designation || (role === 'TEACHER' ? 'Faculty' : 'Staff Member'),
      role: role.toUpperCase(),
      qualification: qualification || null,
      experience_years: Number(experienceYears) || 0,
      date_of_joining: dateOfJoining || new Date().toISOString().split('T')[0],
      employment_type: employmentType,
      status: req.body.status || 'ACTIVE',
      base_salary: Number(baseSalary),
      bank_name: bankName || null,
      account_no: accountNo || null,
      ifsc_code: ifscCode || null,
      pan_no: panNo || null,
      assigned_subjects: JSON.stringify(assignedSubjects),
      assigned_classes: JSON.stringify(assignedClasses),
      avatar_url: avatarUrl || null,
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
  const validation = validateStaffInput(req.body);
  if (validation) return res.status(400).json({ error: validation });
  try {
    const db = getDb();
    const { id } = req.params;
    const table = (db as any).data.staff_details || [];
    const staff = table.find((s: any) => s.id === id || s.employee_id === id);

    if (!staff) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    const {
      fullName, email, phone, department, designation, staffCategory, role, qualification,
      experienceYears, status, baseSalary, bankName, accountNo, ifscCode, panNo,
      assignedSubjects, assignedClasses, avatarUrl
    } = req.body;

    if (staffCategory && !staffCategories.some(category => category.id === staffCategory)) return res.status(400).json({ error: 'Choose a supported staff category.' });
    if (baseSalary !== undefined && (!Number.isFinite(Number(baseSalary)) || Number(baseSalary) < 0)) return res.status(400).json({ error: 'Salary must be a non-negative number.' });
    if (status && !['ACTIVE', 'ON_LEAVE', 'INACTIVE', 'ARCHIVED'].includes(status)) return res.status(400).json({ error: 'Choose a supported employment status.' });
    if (role && !['TEACHER','FACULTY','STAFF'].includes(role)) return res.status(400).json({ error: 'Choose a supported staff role.' });
    if (email && db.prepare('SELECT * FROM staff_details').all().some(member => member.id !== staff.id && String(member.email || '').toLowerCase() === email.trim().toLowerCase())) return res.status(409).json({ error: 'A staff record with this email already exists.' });
    if (role) staff.role = role;
    if (staffCategory) staff.staff_category = staffCategory;
    if (fullName) staff.full_name = fullName.trim();
    if (email) staff.email = email.trim().toLowerCase();
    if (phone !== undefined) staff.phone = phone || null;
    if (department) staff.department = department;
    if (designation) staff.designation = designation;
    if (qualification !== undefined) staff.qualification = qualification || null;
    if (experienceYears !== undefined) staff.experience_years = Number(experienceYears);
    if (status) staff.status = status;
    if (baseSalary !== undefined) staff.base_salary = Number(baseSalary);
    if (bankName !== undefined) staff.bank_name = bankName || null;
    if (accountNo !== undefined) staff.account_no = accountNo || null;
    if (ifscCode !== undefined) staff.ifsc_code = ifscCode || null;
    if (panNo !== undefined) staff.pan_no = panNo || null;
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
    const member = table.find((staff: any) => staff.id === id || staff.employee_id === id);
    if (!member) return res.status(404).json({ error: 'Staff record not found' });
    member.status = 'ARCHIVED';
    member.updated_at = new Date().toISOString();

    (db as any).scheduleSave();
    res.json({ success: true, message: 'Staff record archived successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
