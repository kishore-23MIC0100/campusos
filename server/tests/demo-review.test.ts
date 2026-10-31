import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type { Server } from "node:http";
const directory = mkdtempSync(path.join(tmpdir(), "scholaxys-demo-review-"));
process.env.NODE_ENV = "test";
process.env.CAMPUSOS_DATA_DIR = directory;
process.env.JWT_SECRET = "demo-review-private-test-signing-secret-123456";
delete process.env.DATABASE_URL;
delete process.env.VERCEL;
delete process.env.CAMPUSOS_SHARED_PORTAL_ACCOUNTS;
const { getDb } = await import("../src/db.js");
const { default: app } = await import("../src/index.js");
const { createSharedPortalConfig, applySharedPortalAccounts } = await import(
  "../src/shared-portal-accounts.js"
);
const { seedSharedPortalDemo } = await import("../src/demo-review.js");
const { generateToken } = await import("../src/middleware/auth.js");
const db = getDb();
const config = await createSharedPortalConfig({
  email: "family.review@example.com",
  fullName: "Review Operator",
  password: "LocalReviewFixture!2026",
});
applySharedPortalAccounts(db, config);
const user = (role: string) =>
  db
    .prepare("SELECT * FROM users WHERE email = ? AND role = ?")
    .get(config.email, role);
let server: Server;
let base: string;
before(async () => {
  server = await new Promise((resolve) => {
    const instance = app.listen(0, "127.0.0.1", () => resolve(instance));
  });
  base = `http://127.0.0.1:${(server.address() as any).port}/api`;
});
after(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await db.close();
  rmSync(directory, { recursive: true, force: true });
});
async function read(endpoint: string, role: string) {
  const result = await fetch(base + endpoint, {
    headers: { Authorization: `Bearer ${generateToken(user(role))}` },
  });
  return { status: result.status, body: await result.json() };
}
test("demo provisioning cannot write to production or any connected PostgreSQL database", () => {
  for (const [key, value] of [
    ["NODE_ENV", "production"],
    ["VERCEL", "1"],
    ["DATABASE_URL", "postgres://fixture.invalid/demo"],
  ]) {
    const previous = process.env[key];
    process.env[key] = value;
    assert.equal(seedSharedPortalDemo(db, config).enabled, false);
    if (previous === undefined) delete process.env[key];
    else process.env[key] = previous;
  }
  assert.equal(db.prepare("SELECT * FROM students").all().length, 0);
});
test("local review creates linked students with persistent coursework, attendance and schedules", () => {
  assert.deepEqual(seedSharedPortalDemo(db, config), {
    enabled: true,
    students: 2,
  });
  const students = db.prepare("SELECT * FROM students").all();
  assert.equal(students.length, 2);
  assert.ok(students.every((student) => student.is_demo));
  assert.ok(user("STUDENT").student_id.startsWith("DEMO-"));
  const counts = [
    "students",
    "parents",
    "attendance_records",
    "performance_records",
    "homework",
    "timetables",
    "assessments",
  ].map((table) => db.prepare(`SELECT * FROM ${table}`).all().length);
  seedSharedPortalDemo(db, config);
  assert.deepEqual(
    [
      "students",
      "parents",
      "attendance_records",
      "performance_records",
      "homework",
      "timetables",
      "assessments",
    ].map((table) => db.prepare(`SELECT * FROM ${table}`).all().length),
    counts,
  );
});
test("student and parent APIs show their linked demo records while preserving role boundaries", async () => {
  const family = await read("/parents/my-children", "PARENT");
  assert.equal(family.status, 200);
  assert.equal(family.body.children.length, 2);
  for (const child of family.body.children) {
    assert.equal(child.recentAttendance.length, 10);
    assert.equal(child.performanceRecords.length, 4);
    assert.equal(child.pendingHomework.length, 4);
    assert.equal(child.todayTimetable.length, 20);
  }
  const student = await read(
    "/students/" + user("STUDENT").student_id,
    "STUDENT",
  );
  assert.equal(student.status, 200);
  assert.equal(student.body.attendance.length, 20);
  assert.equal(student.body.performance.length, 4);
  assert.equal(student.body.homework.length, 4);
  assert.equal(
    (await read("/students/" + family.body.children[1].id, "STUDENT")).status,
    403,
  );
  assert.equal((await read("/parents/my-children", "STUDENT")).status, 403);
  const quiz = await read("/assessments", "STUDENT");
  assert.equal(quiz.status, 200);
  assert.equal(quiz.body.assessments.length, 4);
  assert.equal(quiz.body.assessments[0].questions.length, 2);
  assert.equal(quiz.body.assessments[0].questions[0].correctAnswer, undefined);
});
test("demo seeding leaves explicitly linked academic records and other accounts unchanged", () => {
  const student = db
    .prepare("SELECT * FROM students WHERE user_id = ?")
    .get(user("STUDENT").id);
  student.is_demo = false;
  const before = JSON.stringify(db.prepare("SELECT * FROM students").all());
  assert.equal(seedSharedPortalDemo(db, config).students, 0);
  assert.equal(
    JSON.stringify(db.prepare("SELECT * FROM students").all()),
    before,
  );
});
