import bcrypt from 'bcryptjs';
import { getDb } from './db.js';

export async function seedDatabase() {
  const db = getDb();

  // Check if users already exist
  const existingUsers = db.prepare('SELECT count(*) as count FROM users').get() as { count: number };
  if (existingUsers.count > 0) {
    console.log('[Seed] Database already contains data. Skipping full re-seed.');
    return;
  }

  console.log('[Seed] Seeding Oakridge International School data...');

  const passwordAdmin = await bcrypt.hash('Admin@2026', 10);
  const passwordTeacher = await bcrypt.hash('Teacher@2026', 10);
  const passwordStudent = await bcrypt.hash('Student@2026', 10);
  const passwordParent = await bcrypt.hash('Parent@2026', 10);
  const passwordPending = await bcrypt.hash('Pending@2026', 10);

  // 1. Roles & Permissions
  const insertRole = db.prepare('INSERT INTO roles (id, name, description, is_system) VALUES (?, ?, ?, ?)');
  insertRole.run('role_super_admin', 'SUPER_ADMIN', 'Executive Super Administrator with complete system access', 1);
  insertRole.run('role_school_admin', 'SCHOOL_ADMIN', 'School Operations & Academic Administrator', 1);
  insertRole.run('role_teacher', 'TEACHER', 'Classroom educator, attendance taker, and grade manager', 1);
  insertRole.run('role_student', 'STUDENT', 'Enrolled student with course, assignment, and timetable access', 1);
  insertRole.run('role_parent', 'PARENT', 'Guardian with multi-child monitoring and communication access', 1);

  const permissionsList = [
    { id: 'p1', key: 'student.read', description: 'View student directory and profiles', category: 'Students' },
    { id: 'p2', key: 'student.create', description: 'Admit new students', category: 'Students' },
    { id: 'p3', key: 'student.update', description: 'Edit student details', category: 'Students' },
    { id: 'p4', key: 'student.delete', description: 'Archive student records', category: 'Students' },
    { id: 'p5', key: 'attendance.read', description: 'View attendance records & analytics', category: 'Attendance' },
    { id: 'p6', key: 'attendance.mark', description: 'Mark daily attendance', category: 'Attendance' },
    { id: 'p7', key: 'leave.create', description: 'Submit leave applications', category: 'Leaves' },
    { id: 'p8', key: 'leave.approve', description: 'Approve or reject leave requests', category: 'Leaves' },
    { id: 'p9', key: 'homework.create', description: 'Publish and grade homework', category: 'Homework' },
    { id: 'p10', key: 'announcement.create', description: 'Publish school-wide announcements', category: 'Announcements' },
    { id: 'p11', key: 'spotlight.manage', description: 'Curate editorial spotlight stories', category: 'Spotlight' },
    { id: 'p12', key: 'performance.manage', description: 'Enter & publish academic marks', category: 'Performance' },
    { id: 'p13', key: 'admin.users.manage', description: 'Approve accounts and manage RBAC', category: 'Administration' },
    { id: 'p14', key: 'admin.audit.view', description: 'Inspect security audit logs', category: 'Administration' },
  ];

  const insertPerm = db.prepare('INSERT INTO permissions (id, key, description, category) VALUES (?, ?, ?, ?)');
  for (const p of permissionsList) {
    insertPerm.run(p.id, p.key, p.description, p.category);
  }

  // 2. Users Table Seed
  const insertUser = db.prepare(`
    INSERT INTO users (
      id, email, username, password_hash, role, full_name, avatar_url, phone, status, department, student_id, admission_no, grade_section, bio
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Super Admin
  insertUser.run(
    'usr_admin_1',
    'admin@campusos.edu',
    'admin.lead',
    passwordAdmin,
    'SUPER_ADMIN',
    'Dr. Alistair Sterling',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    '+91 98110 20304',
    'APPROVED',
    'Executive Leadership',
    null,
    null,
    null,
    'Campus Director & Head of Educational Governance'
  );

  // School Admin
  insertUser.run(
    'usr_admin_2',
    'sarah.admin@campusos.edu',
    'sarah.admin',
    passwordAdmin,
    'SCHOOL_ADMIN',
    'Sarah Jenkins',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    '+91 98110 20305',
    'APPROVED',
    'Academic Affairs',
    null,
    null,
    null,
    'Dean of Academic Operations & Student Affairs'
  );

  // Teacher 1 (Maths)
  insertUser.run(
    'usr_teacher_1',
    'priya.nair@campusos.edu',
    'priya.teacher',
    passwordTeacher,
    'TEACHER',
    'Mrs. Priya Nair',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    '+91 98450 11223',
    'APPROVED',
    'Mathematics & Computing',
    null,
    null,
    'Grade 10A Lead',
    'Senior Mathematics Faculty & Grade 10 Mentor'
  );

  // Teacher 2 (Physics)
  insertUser.run(
    'usr_teacher_2',
    'marcus.vance@campusos.edu',
    'marcus.physics',
    passwordTeacher,
    'TEACHER',
    'Dr. Marcus Vance',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    '+91 98450 44556',
    'APPROVED',
    'Physical Sciences',
    null,
    null,
    'Grade 11A Lead',
    'Head of Science Department & Robotics Coordinator'
  );

  // Student 1 (Grade 10A)
  insertUser.run(
    'usr_student_1',
    'arav.patel@campusos.edu',
    'STU-2026-8841',
    passwordStudent,
    'STUDENT',
    'Arav Patel',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    '+91 98765 43211',
    'APPROVED',
    'Secondary School',
    'STU-2026-8841',
    'ADM-2021-0412',
    'Grade 10A',
    'Student Council STEM Lead & Physics Enthusiast'
  );

  // Student 2 (Grade 7A - sibling)
  insertUser.run(
    'usr_student_2',
    'diya.patel@campusos.edu',
    'STU-2026-5120',
    passwordStudent,
    'STUDENT',
    'Diya Patel',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    '+91 98765 43212',
    'APPROVED',
    'Middle School',
    'STU-2026-5120',
    'ADM-2024-0891',
    'Grade 7A',
    'Middle School Debate Club & Badminton Team'
  );

  // Parent (Father of Arav and Diya)
  insertUser.run(
    'usr_parent_1',
    'rajesh.patel@gmail.com',
    'rajesh.patel',
    passwordParent,
    'PARENT',
    'Rajesh Patel',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    '+91 98765 43210',
    'APPROVED',
    'Parent Association',
    null,
    null,
    null,
    'Parent Association Treasurer & Tech Entrepreneur'
  );

  // Pending Registrations for Admin Approval Demo!
  insertUser.run(
    'usr_pending_student',
    'kavya.verma@campusos.edu',
    'STU-2026-9901',
    passwordPending,
    'STUDENT',
    'Kavya Verma',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    '+91 98199 88776',
    'PENDING',
    'Secondary School',
    'STU-2026-9901',
    'ADM-2026-9901',
    'Grade 11B',
    'New Transfer Student from Bangalore International'
  );

  insertUser.run(
    'usr_pending_teacher',
    'vikram.sen@campusos.edu',
    'vikram.chem',
    passwordPending,
    'TEACHER',
    'Dr. Vikram Sen',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    '+91 98200 11229',
    'PENDING',
    'Chemistry & Organic Sciences',
    null,
    null,
    'Senior Wing',
    'Applicant for Chemistry Department Chair'
  );

  // 3. Students Directory
  const insertStudent = db.prepare(`
    INSERT INTO students (
      id, user_id, student_id, admission_no, first_name, last_name, gender, dob, grade, section, roll_no, academic_year, blood_group, house, attendance_pct, gpa, parent_id, parent_name, parent_phone, address, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertStudent.run('stu_1', 'usr_student_1', 'STU-2026-8841', 'ADM-2021-0412', 'Arav', 'Patel', 'Male', '2010-04-14', 'Grade 10', 'A', 14, '2025-2026', 'O+', 'Orion Blue', 96.4, 3.92, 'usr_parent_1', 'Rajesh Patel', '+91 98765 43210', '42 Palm Avenue, Cyber City', 'ACTIVE');
  insertStudent.run('stu_2', 'usr_student_2', 'STU-2026-5120', 'ADM-2024-0891', 'Diya', 'Patel', 'Female', '2013-09-22', 'Grade 7', 'A', 9, '2025-2026', 'A+', 'Orion Blue', 97.8, 3.88, 'usr_parent_1', 'Rajesh Patel', '+91 98765 43210', '42 Palm Avenue, Cyber City', 'ACTIVE');
  insertStudent.run('stu_3', null, 'STU-2026-8842', 'ADM-2021-0413', 'Rohan', 'Sharma', 'Male', '2010-06-18', 'Grade 10', 'A', 15, '2025-2026', 'B+', 'Phoenix Red', 94.2, 3.75, null, 'Sunil Sharma', '+91 98221 00112', '12 Emerald Heights', 'ACTIVE');
  insertStudent.run('stu_4', null, 'STU-2026-8843', 'ADM-2021-0414', 'Ananya', 'Deshmukh', 'Female', '2010-11-05', 'Grade 10', 'A', 16, '2025-2026', 'AB+', 'Pegasus Gold', 98.6, 4.00, null, 'Meera Deshmukh', '+91 98334 55667', '77 Horizon Towers', 'ACTIVE');
  insertStudent.run('stu_5', null, 'STU-2026-8844', 'ADM-2021-0415', 'Kabir', 'Mehta', 'Male', '2010-02-28', 'Grade 10', 'B', 1, '2025-2026', 'O-', 'Aquila Green', 92.0, 3.65, null, 'Nikhil Mehta', '+91 98440 99881', '104 Lakeview Enclave', 'ACTIVE');
  insertStudent.run('stu_6', null, 'STU-2026-8845', 'ADM-2021-0416', 'Zoya', 'Khan', 'Female', '2010-08-12', 'Grade 10', 'B', 2, '2025-2026', 'A-', 'Phoenix Red', 95.1, 3.85, null, 'Farhan Khan', '+91 98551 22334', '18 Park Lane', 'ACTIVE');
  insertStudent.run('stu_7', null, 'STU-2026-9101', 'ADM-2020-0301', 'Siddharth', 'Iyer', 'Male', '2009-03-15', 'Grade 11', 'A', 10, '2025-2026', 'O+', 'Pegasus Gold', 97.2, 3.95, null, 'Raman Iyer', '+91 98662 33445', '502 Skylark Vista', 'ACTIVE');
  insertStudent.run('stu_8', null, 'STU-2026-9201', 'ADM-2019-0199', 'Tanvi', 'Chopra', 'Female', '2008-12-01', 'Grade 12', 'A', 5, '2025-2026', 'B-', 'Orion Blue', 98.9, 3.98, null, 'Deepak Chopra', '+91 98773 44556', '88 Aspen Woods', 'ACTIVE');

  // 4. Teachers Directory
  const insertTeacher = db.prepare(`
    INSERT INTO teachers (
      id, user_id, employee_id, first_name, last_name, designation, department, qualification, experience_years, subjects, classes_handled, weekly_periods, office_room, phone, email, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertTeacher.run('tch_1', 'usr_teacher_1', 'EMP-MTH-101', 'Priya', 'Nair', 'Senior Faculty & Lead Mentor', 'Mathematics', 'M.Sc Mathematics, B.Ed', 12, 'Advanced Calculus, Linear Algebra, Grade 10 Math', 'Grade 10A, Grade 11A, Grade 12A', 22, 'Room 204 (Math Block)', '+91 98450 11223', 'priya.nair@campusos.edu', 'ACTIVE');
  insertTeacher.run('tch_2', 'usr_teacher_2', 'EMP-PHY-102', 'Marcus', 'Vance', 'Head of Science Department', 'Physics', 'Ph.D Physics, M.Ed', 15, 'Classical Mechanics, Electromagnetism, Quantum Concepts', 'Grade 10A, Grade 11A, Grade 12A', 20, 'Room 308 (Science Lab Wing)', '+91 98450 44556', 'marcus.vance@campusos.edu', 'ACTIVE');
  insertTeacher.run('tch_3', null, 'EMP-CS-103', 'Elena', 'Rostova', 'Associate Professor of Computer Science', 'Computer Science', 'M.Tech AI & Data Science', 8, 'Data Structures, Python, Web Architecture', 'Grade 9A, Grade 10A, Grade 11A', 18, 'Room 112 (Turing Tech Center)', '+91 98450 77889', 'elena.rostova@campusos.edu', 'ACTIVE');
  insertTeacher.run('tch_4', null, 'EMP-ENG-104', 'Arthur', 'Pendelton', 'Head of Humanities', 'English Literature', 'M.A. English Literature (Oxford)', 18, 'World Literature, Rhetoric & Creative Writing', 'Grade 10A, Grade 10B, Grade 12A', 20, 'Room 215 (Humanities Wing)', '+91 98450 99001', 'arthur.pendelton@campusos.edu', 'ACTIVE');

  // 5. Parents Table
  const insertParent = db.prepare(`
    INSERT INTO parents (id, user_id, first_name, last_name, relation, occupation, email, phone, alt_phone, address, children_ids)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertParent.run('par_1', 'usr_parent_1', 'Rajesh', 'Patel', 'Father', 'Managing Director - Nexus Technologies', 'rajesh.patel@gmail.com', '+91 98765 43210', '+91 98765 43299', '42 Palm Avenue, Cyber City', JSON.stringify(['stu_1', 'stu_2']));

  // 6. Classes
  const insertClass = db.prepare(`
    INSERT INTO classes (id, grade, section, class_teacher_id, class_teacher_name, room_number, total_students, academic_year)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertClass.run('cls_6a', 'Grade 6', 'A', 'tch_4', 'Arthur Pendelton', 'Room 101', 32, '2025-2026');
  insertClass.run('cls_7a', 'Grade 7', 'A', 'tch_3', 'Elena Rostova', 'Room 105', 34, '2025-2026');
  insertClass.run('cls_8a', 'Grade 8', 'A', 'tch_1', 'Priya Nair', 'Room 201', 35, '2025-2026');
  insertClass.run('cls_9a', 'Grade 9', 'A', 'tch_2', 'Dr. Marcus Vance', 'Room 205', 36, '2025-2026');
  insertClass.run('cls_10a', 'Grade 10', 'A', 'tch_1', 'Priya Nair', 'Room 301', 38, '2025-2026');
  insertClass.run('cls_10b', 'Grade 10', 'B', 'tch_4', 'Arthur Pendelton', 'Room 302', 36, '2025-2026');
  insertClass.run('cls_11a', 'Grade 11', 'A', 'tch_2', 'Dr. Marcus Vance', 'Room 401', 30, '2025-2026');
  insertClass.run('cls_12a', 'Grade 12', 'A', 'tch_1', 'Priya Nair', 'Room 402', 28, '2025-2026');

  // 7. Subjects
  const insertSubject = db.prepare(`
    INSERT INTO subjects (id, code, name, department, credits, weekly_hours)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertSubject.run('sb_mth', 'MTH-101', 'Mathematics & Calculus', 'Mathematics', 4, 6);
  insertSubject.run('sb_phy', 'PHY-102', 'Physics & Laboratory Mechanics', 'Physical Sciences', 4, 5);
  insertSubject.run('sb_chm', 'CHM-103', 'Chemistry & Molecular Dynamics', 'Physical Sciences', 4, 5);
  insertSubject.run('sb_bio', 'BIO-104', 'Biology & Genetics', 'Life Sciences', 4, 5);
  insertSubject.run('sb_cs', 'CSC-105', 'Computer Science & Computational Thinking', 'Computer Science', 4, 5);
  insertSubject.run('sb_eng', 'ENG-106', 'English Language & World Literature', 'Humanities', 3, 4);
  insertSubject.run('sb_sst', 'SST-107', 'Social Sciences & Global Geopolitics', 'Humanities', 3, 4);

  // 8. Attendance Records
  const insertAttendance = db.prepare(`
    INSERT INTO attendance_records (id, date, class_id, grade, section, student_id, student_name, roll_no, status, marked_by, remarks)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const todayStr = new Date().toISOString().split('T')[0];
  insertAttendance.run('att_1', todayStr, 'cls_10a', 'Grade 10', 'A', 'stu_1', 'Arav Patel', 14, 'PRESENT', 'Priya Nair', 'Present in first period');
  insertAttendance.run('att_2', todayStr, 'cls_10a', 'Grade 10', 'A', 'stu_3', 'Rohan Sharma', 15, 'PRESENT', 'Priya Nair', 'Present');
  insertAttendance.run('att_3', todayStr, 'cls_10a', 'Grade 10', 'A', 'stu_4', 'Ananya Deshmukh', 16, 'PRESENT', 'Priya Nair', 'Present');
  insertAttendance.run('att_4', todayStr, 'cls_7a', 'Grade 7', 'A', 'stu_2', 'Diya Patel', 9, 'PRESENT', 'Elena Rostova', 'Present');

  // 9. Homework
  const insertHomework = db.prepare(`
    INSERT INTO homework (id, title, subject, grade, section, teacher_id, teacher_name, description, due_date, priority, attachments, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertHomework.run(
    'hw_1',
    'Calculus: Optimization & Maximum Rate of Change',
    'Mathematics',
    'Grade 10',
    'A',
    'usr_teacher_1',
    'Mrs. Priya Nair',
    'Complete problem set 4.3 questions 1 through 18. Provide step-by-step differentiation and graph sketches on coordinate grid.',
    '2026-09-15',
    'IMPORTANT',
    JSON.stringify(['differentiation_problem_set.pdf']),
    'ACTIVE'
  );

  insertHomework.run(
    'hw_2',
    'Electromagnetism & Faraday Induction Lab Simulation',
    'Physics',
    'Grade 10',
    'A',
    'usr_teacher_2',
    'Dr. Marcus Vance',
    'Execute the digital twin induction experiment on CampusOS Lab and submit summary observations on magnetic flux variations.',
    '2026-09-18',
    'NORMAL',
    JSON.stringify(['lab_guide_faraday.pdf']),
    'ACTIVE'
  );

  insertHomework.run(
    'hw_3',
    'Critical Essay: Dystopian Motifs in 20th Century Fiction',
    'English Literature',
    'Grade 10',
    'A',
    'tch_4',
    'Arthur Pendelton',
    'Draft a 1,200-word comparative essay analyzing societal surveillance themes with cited textual evidence.',
    '2026-09-22',
    'NORMAL',
    JSON.stringify(['essay_rubric.pdf']),
    'ACTIVE'
  );

  // 10. Leave Requests
  const insertLeave = db.prepare(`
    INSERT INTO leave_requests (id, applicant_id, applicant_name, applicant_role, leave_type, from_date, to_date, total_days, reason, is_emergency, status, reviewed_by, reviewer_remarks)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertLeave.run(
    'lv_1',
    'usr_student_1',
    'Arav Patel',
    'STUDENT',
    'MEDICAL',
    '2026-09-24',
    '2026-09-25',
    2,
    'Scheduled dental extraction and recovery procedure.',
    0,
    'PENDING',
    null,
    null
  );

  insertLeave.run(
    'lv_2',
    'usr_teacher_2',
    'Dr. Marcus Vance',
    'TEACHER',
    'CASUAL',
    '2026-09-28',
    '2026-09-29',
    2,
    'Attending National Science Teachers Symposium at Indian Institute of Science.',
    0,
    'APPROVED',
    'Dr. Alistair Sterling',
    'Approved. Substitute teacher assigned for Grade 10 & 11 Physics.'
  );

  // 11. Timetable Slots
  const insertTimetable = db.prepare(`
    INSERT INTO timetables (id, grade, section, day_of_week, period_index, start_time, end_time, subject, teacher_id, teacher_name, room_number)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const scheduleData = [
    { period: 1, start: '08:30', end: '09:15', subject: 'Mathematics', teacher: 'Mrs. Priya Nair', room: 'Room 301' },
    { period: 2, start: '09:20', end: '10:05', subject: 'Physics Lab', teacher: 'Dr. Marcus Vance', room: 'Lab 3' },
    { period: 3, start: '10:10', end: '10:55', subject: 'Computer Science', teacher: 'Elena Rostova', room: 'Tech Lab 1' },
    { period: 4, start: '11:15', end: '12:00', subject: 'English Literature', teacher: 'Arthur Pendelton', room: 'Room 301' },
    { period: 5, start: '12:05', end: '12:50', subject: 'Chemistry', teacher: 'Dr. Vikram Sen', room: 'Lab 2' },
    { period: 6, start: '13:40', end: '14:25', subject: 'Social Science', teacher: 'Arthur Pendelton', room: 'Room 301' },
    { period: 7, start: '14:30', end: '15:15', subject: 'Physical Education / Track', teacher: 'Coach R. Singh', room: 'Sports Arena' },
  ];

  for (const day of days) {
    for (const item of scheduleData) {
      insertTimetable.run(
        `tt_${day.toLowerCase()}_${item.period}`,
        'Grade 10',
        'A',
        day,
        item.period,
        item.start,
        item.end,
        item.subject,
        'usr_teacher_1',
        item.teacher,
        item.room
      );
    }
  }

  // 12. Events & Occasions
  const insertEvent = db.prepare(`
    INSERT INTO events (id, title, category, date, start_time, end_time, venue, description, organizer, participants_count, max_capacity, banner_url, registration_open, is_featured)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertEvent.run(
    'evt_1',
    'CampusOS Annual Innovation & STEM Summit 2026',
    'ACADEMIC',
    '2026-10-15',
    '09:00',
    '17:00',
    'Grand Auditorium & Innovation Quad',
    'Showcase of 80+ student robotics, AI algorithms, sustainable engineering prototypes and inter-school keynote speakers.',
    'Department of STEM & Technology',
    240,
    500,
    'https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&auto=format&fit=crop&q=80',
    1,
    1
  );

  insertEvent.run(
    'evt_2',
    'Inter-School Athletics Championship & Track Gala',
    'SPORTS',
    '2026-10-24',
    '08:00',
    '16:30',
    'Olympic Track & Sports Pavilion',
    'Annual track & field events featuring 100m sprint, hurdles, relay, long jump, and football finals.',
    'Sports Committee',
    350,
    1200,
    'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&auto=format&fit=crop&q=80',
    1,
    1
  );

  insertEvent.run(
    'evt_3',
    'Term 1 Parent-Teacher Academic Partnership Conclave',
    'MEETING',
    '2026-10-04',
    '09:30',
    '15:00',
    'Classroom Wings & Central Atrium',
    'One-on-one comprehensive dialogue between parents and faculty mentors regarding holistic child progression and exam insights.',
    'Dean of Student Affairs',
    420,
    600,
    'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=600&auto=format&fit=crop&q=80',
    1,
    0
  );

  // 13. Announcements
  const insertAnnouncement = db.prepare(`
    INSERT INTO announcements (id, title, content, category, priority, target_audience, author_name, author_role, publish_date, expires_at, attachments, is_pinned)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertAnnouncement.run(
    'anc_1',
    'Mid-Term Assessment Schedule & Digital Hall Tickets Released',
    'ACADEMIC',
    'IMPORTANT',
    'ALL',
    'Dr. Alistair Sterling',
    'Principal',
    '2026-09-08',
    '2026-10-10',
    JSON.stringify(['midterm_schedule_2026.pdf']),
    1
  );

  insertAnnouncement.run(
    'anc_2',
    'Campus Transit Route 7 & Route 12 Timing Optimization',
    'TRANSPORT',
    'NORMAL',
    'PARENTS',
    'School Operations Center',
    'Logistics Officer',
    '2026-09-07',
    '2026-09-30',
    null,
    0
  );

  insertAnnouncement.run(
    'anc_3',
    'Parent-Teacher Partnership Conclave Registration Open',
    'GENERAL',
    'IMPORTANT',
    'PARENTS',
    'Sarah Jenkins',
    'Dean of Academic Operations',
    '2026-09-06',
    '2026-10-04',
    null,
    1
  );

  // 14. Spotlights (Editorial Magazine Style)
  const insertSpotlight = db.prepare(`
    INSERT INTO spotlights (id, title, badge_label, recipient_name, recipient_role, recipient_image, category, story, metrics_highlight, citation_quote, award_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertSpotlight.run(
    'spot_1',
    'National STEM Olympiad Gold Laureate: Arav Patel',
    'STUDENT OF THE MONTH',
    'Arav Patel (Grade 10A)',
    'Student Council STEM Lead',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
    'STUDENT_ACHIEVEMENT',
    'Arav spearheaded an autonomous solar tracking clean-water filtration device that won 1st Place at the National Young Innovators Fair among 1,400 schools across the nation.',
    '1st Rank Nationally • 99.8th Percentile Score',
    '"Discovery begins the moment curiosity meets disciplined mathematical rigor."',
    '2026-09-01'
  );

  insertSpotlight.run(
    'spot_2',
    'Excellence in Interactive Pedagogy: Mrs. Priya Nair',
    'FACULTY DISTINCTION',
    'Mrs. Priya Nair',
    'Senior Mathematics Faculty',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
    'FACULTY_EXCELLENCE',
    'Recognized with the Regional Educator Excellence Award for pioneering visual calculus modules that elevated student conceptual mastery by 42% over the academic term.',
    '42% Improvement in Problem-Solving Index',
    '"When students visualize equations in 3D, abstract formulas transform into living insights."',
    '2026-08-28'
  );

  insertSpotlight.run(
    'spot_3',
    'State Champions: Oakridge Girls Basketball Team',
    'SPORTS TRIUMPH',
    'Oakridge Varsity Eagles',
    'Athletics Department',
    'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&auto=format&fit=crop&q=80',
    'SPORTS_CHAMPION',
    'Undeafeated throughout the 12-match tournament, the Varsity Eagles secured the State Trophy in a thrilling 68-62 overtime victory against St. Andrews.',
    '12-0 Undefeated Season • State Gold Trophy',
    '"Tenacity on the court mirrors the character we cultivate in every classroom."',
    '2026-08-20'
  );

  // 15. Performance Records
  const insertPerformance = db.prepare(`
    INSERT INTO performance_records (id, student_id, student_name, grade, section, subject, term, exam_type, max_marks, marks_obtained, grade_letter, percentile, teacher_remarks, academic_year)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertPerformance.run('perf_1', 'stu_1', 'Arav Patel', 'Grade 10', 'A', 'Mathematics', 'TERM_1', 'MAIN_EXAM', 100, 98, 'A+', 99.4, 'Flawless analytical proofs and speed.', '2025-2026');
  insertPerformance.run('perf_2', 'stu_1', 'Arav Patel', 'Grade 10', 'A', 'Physics', 'TERM_1', 'MAIN_EXAM', 100, 96, 'A+', 98.8, 'Outstanding experimental accuracy.', '2025-2026');
  insertPerformance.run('perf_3', 'stu_1', 'Arav Patel', 'Grade 10', 'A', 'Computer Science', 'TERM_1', 'MAIN_EXAM', 100, 99, 'A+', 99.9, 'Mastery of algorithmic complexity.', '2025-2026');
  insertPerformance.run('perf_4', 'stu_1', 'Arav Patel', 'Grade 10', 'A', 'English Literature', 'TERM_1', 'MAIN_EXAM', 100, 91, 'A', 92.5, 'Nuanced critical thesis in essays.', '2025-2026');
  insertPerformance.run('perf_5', 'stu_1', 'Arav Patel', 'Grade 10', 'A', 'Chemistry', 'TERM_1', 'MAIN_EXAM', 100, 94, 'A+', 96.0, 'Strong theoretical understanding.', '2025-2026');

  // Diya's Performance
  insertPerformance.run('perf_6', 'stu_2', 'Diya Patel', 'Grade 7', 'A', 'Mathematics', 'TERM_1', 'MAIN_EXAM', 100, 95, 'A+', 97.2, 'Excellent algebraic fundamentals.', '2025-2026');
  insertPerformance.run('perf_7', 'stu_2', 'Diya Patel', 'Grade 7', 'A', 'General Science', 'TERM_1', 'MAIN_EXAM', 100, 97, 'A+', 98.5, 'Curious and methodical investigator.', '2025-2026');
  insertPerformance.run('perf_8', 'stu_2', 'Diya Patel', 'Grade 7', 'A', 'English Literature', 'TERM_1', 'MAIN_EXAM', 100, 96, 'A+', 98.0, 'Top-tier vocabulary and reading comprehension.', '2025-2026');

  // 16. School Profile
  const insertProfile = db.prepare(`
    INSERT INTO school_profile (id, name, affiliation_no, established_year, principal_name, vice_principal_name, email, phone, website, address, motto, vision, current_academic_year, total_capacity)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertProfile.run(
    'sch_1',
    'Oakridge International School',
    'CBSE-AFF-2026-9801',
    1998,
    'Dr. Alistair Sterling',
    'Sarah Jenkins',
    'admissions@oakridge.campusos.edu',
    '+91 (080) 4120-9900',
    'https://oakridge.campusos.edu',
    'Plot 18, Knowledge Corridor, Tech Hub, Bangalore 560100',
    'Inspiring Intellectual Courage & Humane Excellence',
    'To foster forward-thinking leaders equipped with empathy, scientific discernment, and moral fortitude.',
    '2025-2026',
    3200
  );

  // 17. Management Hierarchy
  const insertHierarchy = db.prepare(`
    INSERT INTO management_hierarchy (id, name, designation, department, email, phone, office, priority_order, responsibilities, avatar_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertHierarchy.run('mgt_1', 'Dr. Alistair Sterling', 'Principal & Campus Director', 'Executive Governance', 'principal@oakridge.campusos.edu', '+91 98110 20304', 'Executive Suite 401', 1, 'Strategic institution leadership, governance, regulatory oversight and academic vision.', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80');
  insertHierarchy.run('mgt_2', 'Sarah Jenkins', 'Vice Principal & Academic Dean', 'Academic Operations', 'sarah.jenkins@oakridge.campusos.edu', '+91 98110 20305', 'Dean Office 302', 2, 'Curriculum implementation, faculty evaluation, and student academic welfare.', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80');
  insertHierarchy.run('mgt_3', 'Dr. Marcus Vance', 'Head of STEM & Research', 'Physical Sciences', 'marcus.vance@campusos.edu', '+91 98450 44556', 'Science Wing 308', 3, 'Science laboratories, STEM innovation, and robotics development.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80');
  insertHierarchy.run('mgt_4', 'Mrs. Priya Nair', 'Coordinator of Senior Secondary', 'Mathematics', 'priya.nair@campusos.edu', '+91 98450 11223', 'Math Wing 204', 4, 'Senior secondary board examinations coordination and mentoring.', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80');

  // 18. Audit Logs
  const insertAudit = db.prepare(`
    INSERT INTO audit_logs (id, user_id, user_name, user_role, action, entity_type, entity_id, description, ip_address, user_agent)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertAudit.run('aud_1', 'usr_admin_1', 'Dr. Alistair Sterling', 'SUPER_ADMIN', 'SYSTEM_INITIALIZED', 'SYSTEM', 'SYS-001', 'CampusOS core database initialized with Oakridge profile and RBAC policies', '127.0.0.1', 'CampusOS-Kernel/4.8');
  insertAudit.run('aud_2', 'usr_teacher_1', 'Mrs. Priya Nair', 'TEACHER', 'ATTENDANCE_MARKED', 'ATTENDANCE', 'cls_10a', 'Attendance marked for Grade 10 Section A (38 enrolled, 37 present, 1 excused)', '192.168.1.104', 'Mozilla/5.0 Mac OS X');
  insertAudit.run('aud_3', 'usr_admin_1', 'Dr. Alistair Sterling', 'SUPER_ADMIN', 'LEAVE_APPROVED', 'LEAVE', 'lv_2', 'Approved Dr. Marcus Vance casual leave for National Science Symposium', '192.168.1.10', 'Mozilla/5.0 Mac OS X');
  insertAudit.run('aud_4', 'usr_teacher_1', 'Mrs. Priya Nair', 'TEACHER', 'HOMEWORK_PUBLISHED', 'HOMEWORK', 'hw_1', 'Published Calculus optimization problem set for Grade 10A', '192.168.1.104', 'Mozilla/5.0 Mac OS X');

  // 19. Notifications
  const insertNotification = db.prepare(`
    INSERT INTO notifications (id, user_id, target_role, title, message, type, is_read, link_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertNotification.run('notif_1', 'usr_student_1', 'STUDENT', 'New Assignment: Calculus Optimization', 'Mrs. Priya Nair assigned Problem Set 4.3 due Sept 15.', 'HOMEWORK', 0, '/homework/hw_1');
  insertNotification.run('notif_2', 'usr_parent_1', 'PARENT', 'Attendance Confirmation: Grade 10A', 'Arav Patel marked PRESENT today at 08:30 AM.', 'ATTENDANCE', 0, '/attendance');
  insertNotification.run('notif_3', 'usr_admin_1', 'SUPER_ADMIN', 'New Account Registration Pending', '2 new user access requests awaiting administrative review.', 'SECURITY', 0, '/admin/users');

  // 20. Campus Facilities & Rooms
  const insertFacility = db.prepare(`
    INSERT INTO rooms_facilities (id, room_code, building_name, floor, room_type, capacity, equipment, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertFacility.run('fac_1', 'AUD-01', 'Main Cultural Complex', 1, 'AUDITORIUM', 850, 'Dolby 7.1 Atmos, Dual 4K Laser Projection, Stage Rigging', 'AVAILABLE');
  insertFacility.run('fac_2', 'LAB-STEM', 'Turing Academic Block', 2, 'LAB', 45, 'Robotics Workbench, 3D Printers, High-Spec Workstations', 'AVAILABLE');
  insertFacility.run('fac_3', 'LIB-01', 'Alexander Knowledge Hub', 1, 'LIBRARY', 220, 'Digital Catalog Terminals, Silent Study Pods, Rare Books Archive', 'AVAILABLE');
  insertFacility.run('fac_4', 'SPT-01', 'Olympia Pavilion', 0, 'SPORTS_HALL', 600, 'Synthetic 8-lane Track, Wooden Basketball Court, Heated Pool', 'AVAILABLE');
  insertFacility.run('fac_5', 'MED-01', 'Wellness & First Aid Wing', 1, 'MEDICAL', 12, 'Defibrillator, Oxygen Concentrator, Nurse Triage Station', 'AVAILABLE');

  console.log('[Seed] Oakridge International School seed data populated successfully.');
}
