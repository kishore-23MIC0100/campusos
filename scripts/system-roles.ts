import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { Server } from 'node:http';

// Intentionally isolated: never consumes a configured staging/production DB.
const directory = mkdtempSync(path.join(tmpdir(), 'campusos-role-system-'));
process.env.NODE_ENV = 'test';
process.env.CAMPUSOS_DATA_DIR = directory;
process.env.JWT_SECRET = randomBytes(48).toString('base64url');
process.env.CAMPUSOS_DEMO_STAFF_PASSWORD = randomBytes(24).toString('base64url');
delete process.env.DATABASE_URL;
delete process.env.VERCEL;
const { default: app } = await import('../server/src/index.js');
const { seedDatabase } = await import('../server/src/seed.js');
const { getDb } = await import('../server/src/db.js');
let server: Server | undefined;
let passed = 0;
try {
  await seedDatabase();
  server = await new Promise<Server>(resolve => { const instance = app.listen(0, '127.0.0.1', () => resolve(instance)); });
  const base = `http://127.0.0.1:${(server.address() as any).port}/api`;
  const request = async (endpoint: string, status: number, token?: string, body?: unknown) => {
    const response = await fetch(base + endpoint, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(15000) });
    const data = await response.json();
    assert.equal(response.status, status, `${endpoint}: ${response.status}, expected ${status}`);
    passed += 1;
    return data;
  };
  await request('/health', 200);
  await request('/auth/me', 401);
  await request('/missing-endpoint', 401);
  const passwords: Record<string, string> = { SUPER_ADMIN: 'Admin@2026', SCHOOL_ADMIN: 'Admin@2026', TEACHER: 'Teacher@2026', STUDENT: 'Student@2026', PARENT: 'Parent@2026', STAFF: process.env.CAMPUSOS_DEMO_STAFF_PASSWORD };
  for (const role of Object.keys(passwords)) {
    const identity = getDb().prepare('SELECT * FROM users WHERE role = ? AND status = ?').get(role, 'APPROVED');
    const signedIn = await request('/auth/login', 200, undefined, { identifier: identity.email, password: passwords[role], expectedRole: role });
    assert.equal(signedIn.user.role, role);
    const token = signedIn.token;
    const me = await request('/auth/me', 200, token);
    assert.equal(me.id, identity.id);
    for (const [endpoint, key] of [['/leave', 'leaves'], ['/events', 'events'], ['/announcements', 'announcements'], ['/transport/routes', 'routes'], ['/notifications', 'notifications']]) {
      const data = await request(endpoint, 200, token);
      assert.ok(Array.isArray(data[key]), `${role} ${endpoint} must return ${key}`);
    }
    for (const endpoint of ['/students', '/attendance', '/homework', '/timetable', '/performance', '/assessments']) {
      const denied = role === 'STAFF' || (role === 'PARENT' && endpoint === '/assessments');
      await request(endpoint, denied ? 403 : 200, token);
    }
    const admin = ['SUPER_ADMIN', 'SCHOOL_ADMIN'].includes(role);
    await request('/staff/directory', admin || role === 'TEACHER' || role === 'STAFF' ? 200 : 403, token);
    if (role === 'SUPER_ADMIN') await request('/missing-endpoint', 404, token);
    for (const endpoint of ['/users', '/staff', '/payroll/summary', '/audit-logs']) await request(endpoint, admin ? 200 : 403, token);
    await request('/reports/summary', admin || role === 'TEACHER' ? 200 : 403, token);
    if (role === 'PARENT') {
      const children = await request('/parents/my-children', 200, token);
      assert.equal(children.children.length, 2);
    }
    if (role === 'STUDENT') {
      const students = await request('/students', 200, token);
      assert.equal(students.students.length, 1);
      assert.equal(students.students[0].user_id, identity.id);
      await request('/students/stu_2', 403, token);
    }
    console.log(`PASS ${role}: sign-in, profile, operational/academic reads and administration boundaries`);
  }
  console.log(`${passed} isolated HTTP role-system checks passed across all six roles. Temporary records removed after execution.`);
} catch (error) {
  console.error(`FAIL after ${passed} role-system checks: ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
} finally {
  if (server) await new Promise<void>(resolve => server!.close(() => resolve()));
  await getDb().close();
  rmSync(directory, { recursive: true, force: true });
}
