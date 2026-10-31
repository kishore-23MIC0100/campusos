import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { Server } from 'node:http';
const directory = mkdtempSync(path.join(tmpdir(), 'campusos-api-test-'));
process.env.CAMPUSOS_DATA_DIR = directory;
process.env.JWT_SECRET = 'test-secret-do-not-use-in-production-0123456789';
process.env.NODE_ENV = 'test';
delete process.env.DATABASE_URL;
const { default: app } = await import('../src/index.js');
const { seedDatabase } = await import('../src/seed.js');
const { getDb } = await import('../src/db.js');
const { generateToken } = await import('../src/middleware/auth.js');
let server: Server; let base: string;
const tokens: Record<string, string> = {};
async function call(endpoint: string, token?: string, method = 'GET', body?: unknown) {
  const response = await fetch(`${base}/api${endpoint}`, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: response.status, body: await response.json() };
}
before(async () => {
  await seedDatabase();
  for (const role of ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STAFF', 'STUDENT', 'PARENT']) {
    const user = getDb().prepare('SELECT * FROM users WHERE role = ? AND status = ?').get(role, 'APPROVED');
    tokens[role] = generateToken(user);
  }
  await new Promise<void>(resolve => { server = app.listen(0, '127.0.0.1', resolve); });
  base = `http://127.0.0.1:${(server.address() as any).port}`;
});
after(async () => { await new Promise<void>(resolve => server.close(() => resolve())); await getDb().close(); rmSync(directory, { recursive: true, force: true }); });

test('health, public campus endpoints and missing authentication behave correctly', async () => {
  assert.equal((await call('/health')).status, 200);
  for (const endpoint of ['/events', '/announcements', '/school/profile', '/spotlight']) assert.equal((await call(endpoint)).status, 200, endpoint);
  for (const endpoint of ['/students', '/attendance', '/performance', '/users', '/leave', '/payroll/summary']) assert.equal((await call(endpoint)).status, 401, endpoint);
  assert.equal((await call('/students', 'forged')).status, 401);
});
test('staff demo login is verified and does not expose hashes', async () => {
  const result = await call('/auth/login', undefined, 'POST', { identifier: 'staff.operations', password: 'StaffDemo!2026', expectedRole: 'STAFF' });
  assert.equal(result.status, 200); assert.equal(result.body.user.role, 'STAFF'); assert.ok(result.body.token); assert.equal(result.body.user.password_hash, undefined);
  assert.equal((await call('/auth/me', result.body.token)).status, 200);
});
test('pending, rejected and disabled accounts cannot self-approve by signing in', async () => {
  for (const status of ['PENDING', 'REJECTED', 'DISABLED']) {
    getDb().prepare('UPDATE users SET status = ? WHERE id = ?').run(status, 'usr_pending_student');
    const response = await call('/auth/login', undefined, 'POST', { identifier: 'STU-2026-9901', password: 'Pending@2026', expectedRole: 'STUDENT' });
    assert.equal(response.status, 403); assert.equal(getDb().prepare('SELECT status FROM users WHERE id = ?').get('usr_pending_student').status, status);
  }
});
test('registration validates types/passwords and forbids privileged self-registration', async () => {
  assert.equal((await call('/auth/login', undefined, 'POST', { identifier: {}, password: [] })).status, 400);
  assert.equal((await call('/auth/register', undefined, 'POST', { fullName: 'New Person', email: 'new@example.com', password: 'short', role: 'STAFF' })).status, 400);
  assert.equal((await call('/auth/register', undefined, 'POST', { fullName: 'New Person', email: 'new@example.com', password: 'StrongPass!2026', role: 'SUPER_ADMIN' })).status, 400);
  const valid = await call('/auth/register', undefined, 'POST', { fullName: 'New Person', email: 'new@example.com', password: 'StrongPass!2026', role: 'STAFF' });
  assert.equal(valid.status, 201); assert.equal(valid.body.status, 'PENDING');
  assert.equal((await call('/auth/login', undefined, 'POST', { identifier: 'new@example.com', password: 'StrongPass!2026' })).status, 403);
});
test('all non-administrator roles are denied financial, staff, users and audit data', async () => {
  for (const role of ['TEACHER', 'STAFF', 'STUDENT', 'PARENT']) for (const endpoint of ['/users', '/staff', '/payroll/summary', '/payroll/records', '/audit-logs']) assert.equal((await call(endpoint, tokens[role])).status, 403, `${role}: ${endpoint}`);
  assert.equal((await call('/users', tokens.SUPER_ADMIN)).body.users.some((user: any) => 'password_hash' in user), false);
});
test('students and parents can only read their authorized academic records', async () => {
  const own = await call('/students', tokens.STUDENT); assert.equal(own.status, 200); assert.equal(own.body.students.length, 1); assert.equal(own.body.students[0].id, 'stu_1');
  assert.equal((await call('/students/stu_2', tokens.STUDENT)).status, 403);
  for (const endpoint of ['/attendance', '/performance']) {
    const result = await call(endpoint, tokens.STUDENT); assert.equal(result.status, 200); assert.ok(result.body.records.every((record: any) => ['stu_1', 'STU-2026-8841'].includes(record.student_id)));
  }
  const children = await call('/parents/my-children', tokens.PARENT); assert.equal(children.status, 200); assert.equal(children.body.children.length, 2);
  assert.equal((await call('/parents', tokens.PARENT)).status, 403);
});
test('read-only users cannot mutate academic or public records', async () => {
  for (const role of ['STUDENT', 'PARENT', 'STAFF']) for (const endpoint of ['/students', '/attendance/bulk', '/homework', '/performance', '/events', '/announcements', '/spotlight', '/timetable', '/transport/routes']) assert.equal((await call(endpoint, tokens[role], 'POST', {})).status, 403, `${role}: ${endpoint}`);
});
test('staff leave submission persists, is private and can be approved once by administrator', async () => {
  const invalid = await call('/leave', tokens.STAFF, 'POST', { leaveType: 'CASUAL', fromDate: '2026-10-31', toDate: '2026-10-30', reason: 'Invalid range' }); assert.equal(invalid.status, 400);
  const created = await call('/leave', tokens.STAFF, 'POST', { leaveType: 'CASUAL', fromDate: '2026-10-31', toDate: '2026-11-01', totalDays: 99, reason: 'Family commitment' }); assert.equal(created.status, 201);
  const id = created.body.leaveId;
  assert.equal(getDb().prepare('SELECT * FROM leave_requests WHERE id = ?').get(id).total_days, 2);
  assert.equal((await call('/leave', tokens.STUDENT)).body.leaves.some((leave: any) => leave.id === id), false);
  assert.equal((await call(`/leave/${id}/approve`, tokens.STAFF, 'PUT', {})).status, 403);
  assert.equal((await call(`/leave/${id}/approve`, tokens.SUPER_ADMIN, 'PUT', {})).status, 200);
  assert.equal(getDb().prepare('SELECT * FROM leave_requests WHERE id = ?').get(id).status, 'APPROVED');
  assert.equal((await call(`/leave/${id}/approve`, tokens.SUPER_ADMIN, 'PUT', {})).status, 409);
});
test('notifications respect named recipients and read state is per user', async () => {
  const db = getDb();
  db.prepare('INSERT INTO notifications (id, user_id, target_role, title) VALUES (?, ?, ?, ?)').run('private-test', 'usr_teacher_1', 'TEACHER', 'Private message');
  assert.equal((await call('/notifications/private-test/read', tokens.STUDENT, 'PUT', {})).status, 404);
  const staff = await call('/notifications', tokens.STAFF); assert.equal(staff.body.notifications.some((n: any) => n.id === 'private-test'), false);
  await call('/notifications/read-all', tokens.STAFF, 'PUT', {});
  assert.equal(db.prepare('SELECT * FROM notifications WHERE id = ?').get('private-test').is_read, undefined);
});
test('reports and analytics use actual records instead of marketing numbers', async () => {
  const report = await call('/reports/summary', tokens.SUPER_ADMIN); assert.equal(report.status, 200); assert.equal(report.body.metrics.totalStudents, getDb().prepare('SELECT count(*) FROM students').get().count);
  const trend = await call('/attendance/analytics', tokens.SUPER_ADMIN); assert.equal(trend.status, 200); assert.ok(trend.body.trends.every((item: any) => /^\d{4}-\d{2}-\d{2}$/.test(item.date)));
});

test('password change checks current credentials and invalidates older tokens', async () => {
  assert.equal((await call('/auth/change-password', tokens.STAFF, 'POST', { currentPassword: 'wrong', newPassword: 'NewStaffSecure!2026' })).status, 400);
  const changed = await call('/auth/change-password', tokens.STAFF, 'POST', { currentPassword: 'StaffDemo!2026', newPassword: 'NewStaffSecure!2026' });
  assert.equal(changed.status, 200); assert.ok(changed.body.token);
  assert.equal((await call('/auth/me', tokens.STAFF)).status, 401);
  assert.equal((await call('/auth/me', changed.body.token)).status, 200);
  assert.equal((await call('/auth/login', undefined, 'POST', { identifier: 'staff.operations', password: 'StaffDemo!2026' })).status, 401);
  assert.equal((await call('/auth/login', undefined, 'POST', { identifier: 'staff.operations', password: 'NewStaffSecure!2026' })).status, 200);
});

test('administrator can read every core module and filtered queries', async () => {
  for (const endpoint of ['/students?grade=Grade%2010&section=A&search=patel', '/teachers?search=priya', '/parents?search=rajesh', '/attendance?grade=Grade%2010&section=A', '/leave?status=PENDING', '/homework?grade=Grade%2010&subject=Mathematics', '/timetable?grade=Grade%2010', '/events?category=ACADEMIC', '/announcements?audience=STUDENT', '/spotlight', '/performance?studentId=STU-2026-8841', '/school/profile', '/school/hierarchy', '/school/facilities', '/school/classes', '/school/subjects', '/audit-logs', '/notifications', '/reports/summary', '/staff', '/staff/stats', '/staff/stf_1', '/payroll/summary', '/payroll/records', '/transport/overview', '/transport/routes', '/transport/vehicles', '/transport/allocations', '/assessments', '/users/roles/all']) {
    const result = await call(endpoint, tokens.SUPER_ADMIN); assert.equal(result.status, 200, `${endpoint}: ${JSON.stringify(result.body)}`);
  }
});
test('quiz lifecycle creates roster, hides answers, starts session, submits and grades once', async () => {
  const created = await call('/assessments', tokens.SUPER_ADMIN, 'POST', { title: 'Integration test quiz', assessmentType: 'Quiz', grade: 'Grade 10', section: 'A', subject: 'Mathematics', maxMarks: 10, dueAt: new Date(Date.now() + 86400000).toISOString(), questions: [{ id: 'q-test', prompt: 'What is two plus two?', type: 'MULTIPLE_CHOICE', marks: 10, options: ['Four', 'Five'], correctAnswer: 'Four' }], settings: { timeLimitMinutes: 10, attemptsAllowed: 1 } });
  assert.equal(created.status, 201); const id = created.body.assessment.id;
  const detail = await call(`/assessments/${id}`, tokens.STUDENT); assert.equal(detail.status, 200); assert.equal(detail.body.assessment.questions[0].correctAnswer, undefined);
  assert.equal((await call(`/assessments/${id}/start`, tokens.STUDENT, 'POST', {})).status, 200);
  assert.equal((await call(`/assessments/${id}/submit`, tokens.STUDENT, 'POST', { answers: { 'q-test': 'Four' } })).status, 201);
  const marks = await call(`/assessments/${id}`, tokens.SUPER_ADMIN); assert.equal(marks.body.marks.find((mark: any) => mark.student_id === 'stu_1').marks_obtained, 10);
  assert.equal((await call(`/assessments/${id}/start`, tokens.STUDENT, 'POST', {})).status, 403);
  assert.equal((await call(`/assessments/${id}`, tokens.SUPER_ADMIN, 'DELETE')).status, 200);
});
test('attendance rejects unknown students before replacing records and accepts a valid roster', async () => {
  const date = '2030-01-01';
  assert.equal((await call('/attendance/bulk', tokens.SUPER_ADMIN, 'POST', { grade: 'Grade 10', section: 'A', date, records: [{ studentId: 'not-a-student', status: 'PRESENT' }] })).status, 400);
  assert.equal((await call('/attendance/bulk', tokens.SUPER_ADMIN, 'POST', { grade: 'Grade 10', section: 'A', date, records: [{ studentId: 'stu_1', studentName: 'Arav Patel', status: 'PRESENT' }] })).status, 200);
  const result = await call(`/attendance?date=${date}&studentId=STU-2026-8841`, tokens.STUDENT); assert.equal(result.body.records.length, 1);
});


test('performance comparisons normalize differing maximum marks without a fabricated benchmark', async () => {
  const db = getDb();
  for (const [id, max, obtained] of [['normalization-one', 20, 10], ['normalization-two', 100, 80]] as const) db.prepare('INSERT INTO performance_records (id, student_id, subject, max_marks, marks_obtained, grade, section) VALUES (?, ?, ?, ?, ?, ?, ?)').run(id, 'stu_1', 'Percentage regression subject', max, obtained, 'Grade 10', 'A');
  const response = await call('/performance', tokens.SUPER_ADMIN);
  assert.equal(response.status, 200);
  const subject = response.body.subjectAverages.find((item: any) => item.subject === 'Percentage regression subject');
  assert.equal(subject.average, 65); assert.equal(subject.benchmark, undefined);
});

test('transport creation requires real contacts and allocation derives its student identity', async () => {
  assert.equal((await call('/transport/routes', tokens.SUPER_ADMIN, 'POST', { routeNumber: 'invalid-route', routeName: 'Incomplete', startPoint: 'Origin' })).status, 400);
  const created = await call('/transport/routes', tokens.SUPER_ADMIN, 'POST', { routeNumber: 'REGRESSION-01', routeName: 'Recorded route', startPoint: 'North gate', endPoint: 'Campus gate', morningStartTime: '07:15', eveningStartTime: '15:30', busNumber: 'TEST-01', driverName: 'Test Driver', driverPhone: '+91 9000000000', stops: [] });
  assert.equal(created.status, 201); assert.equal(created.body.route.attendant_name, ''); assert.equal(created.body.route.attendant_phone, '');
  const routeId = created.body.route.id;
  assert.equal((await call('/transport/allocate', tokens.SUPER_ADMIN, 'POST', { studentId: 'unknown', routeId, stopName: 'North gate' })).status, 404);
  const allocation = await call('/transport/allocate', tokens.SUPER_ADMIN, 'POST', { studentId: 'STU-2026-8841', studentName: 'Forged name', gradeSection: 'Incorrect grade', routeId, stopName: 'North gate', pickupTime: '07:20' });
  assert.equal(allocation.status, 201); assert.equal(allocation.body.allocation.student_id, 'stu_1'); assert.equal(allocation.body.allocation.student_name, 'Arav Patel'); assert.equal(allocation.body.allocation.grade_section, 'Grade 10 A'); assert.equal(allocation.body.allocation.stop_id, '');
  assert.equal((await call(`/transport/routes/${routeId}`, tokens.SUPER_ADMIN, 'DELETE')).status, 200);
});

test('staff teams include technicians and support categories without exposing HR records', async () => {
  const staffToken = generateToken(getDb().prepare('SELECT * FROM users WHERE username = ?').get('staff.operations'));
  const result = await call('/staff/directory', staffToken);
  assert.equal(result.status, 200);
  for (const category of ['TECHNICIAN','IT_SUPPORT','LAB_SUPPORT','MAINTENANCE','HOUSEKEEPING','SECURITY','TRANSPORT','OFFICE','LIBRARY','HEALTHCARE']) {
    assert.ok(result.body.categories.some((item: any) => item.id === category));
    assert.ok(result.body.staff.some((item: any) => item.category === category));
  }
  for (const member of result.body.staff) for (const field of ['base_salary','bank_name','account_no','ifsc_code','pan_no','password_hash']) assert.equal(member[field], undefined);
  const technicians = await call('/staff/directory?category=TECHNICIAN&search=Kavin', staffToken);
  assert.equal(technicians.body.staff.length, 1); assert.equal(technicians.body.staff[0].category, 'TECHNICIAN');
  for (const role of ['STUDENT','PARENT']) assert.equal((await call('/staff/directory', tokens[role])).status, 403);
  assert.equal((await call('/staff', staffToken)).status, 403);
});

test('staff category is editable, discoverable in the directory and reversibly archived', async () => {
  const created = await call('/staff', tokens.SUPER_ADMIN, 'POST', { fullName:'Test Technician',email:'technician-regression@example.com',role:'STAFF',department:'Technical services',designation:'AV Technician',staffCategory:'TECHNICIAN',baseSalary:0 });
  assert.equal(created.status, 201); const id=created.body.staff.id;
  assert.equal(created.body.staff.avatar_url, null); assert.equal(created.body.staff.base_salary, 0);
  assert.equal((await call(`/staff/${id}`,tokens.SUPER_ADMIN,'PUT',{staffCategory:'IT_SUPPORT',designation:'IT Support Engineer'})).status,200);
  assert.equal((await call(`/staff/${id}`,tokens.SUPER_ADMIN,'PUT',{email:'marcus.vance@campusos.edu',staffCategory:'SECURITY'})).status,409);
  assert.equal((await call(`/staff/${id}`,tokens.SUPER_ADMIN)).body.staff.staff_category,'IT_SUPPORT');
  const directory=await call('/staff/directory?search=technician-regression',tokens.SUPER_ADMIN);
  // Search matches person, department, designation and employee ID rather than private HR fields.
  assert.equal(directory.status,200);
  const all=await call('/staff/directory?category=IT_SUPPORT',tokens.SUPER_ADMIN);
  assert.ok(all.body.staff.some((member:any)=>member.id===id));
  assert.equal((await call(`/staff/${id}`,tokens.SUPER_ADMIN,'DELETE')).status,200);
  assert.equal((await call('/staff/directory',tokens.SUPER_ADMIN)).body.staff.some((member:any)=>member.id===id),false);
  assert.equal((await call(`/staff/${id}`,tokens.SUPER_ADMIN)).body.staff.status,'ARCHIVED');
  assert.equal((await call(`/staff/${id}`,tokens.SUPER_ADMIN,'PUT',{status:'ACTIVE'})).status,200);
  assert.equal((await call('/staff',tokens.SUPER_ADMIN,'POST',{fullName:'Invalid Category',email:'invalid-category@example.com',staffCategory:'ADMINISTRATOR',role:'STAFF',department:'Operations',designation:'Support'})).status,400);
});

test('school administrators cannot use approval actions to disable or reactivate existing accounts', async () => {
  const db=getDb();const executive=db.prepare('SELECT * FROM users WHERE role = ?').get('SUPER_ADMIN');
  assert.equal((await call(`/users/${executive.id}/reject`,tokens.SCHOOL_ADMIN,'PUT',{})).status,403);
  assert.equal(db.prepare('SELECT * FROM users WHERE id = ?').get(executive.id).status,'APPROVED');
  const teacher=db.prepare('SELECT * FROM users WHERE role = ? AND status = ?').get('TEACHER','APPROVED');
  assert.equal((await call(`/users/${teacher.id}/reject`,tokens.SCHOOL_ADMIN,'PUT',{})).status,409);
  assert.equal((await call(`/users/${teacher.id}/approve`,tokens.SCHOOL_ADMIN,'PUT',{})).status,409);
  assert.equal(db.prepare('SELECT * FROM users WHERE id = ?').get(teacher.id).status,'APPROVED');
});
