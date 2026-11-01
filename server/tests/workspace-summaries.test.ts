import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type { Server } from "node:http";
const directory = mkdtempSync(path.join(tmpdir(), "scholaxys-summary-check-"));
process.env.NODE_ENV = "test";
process.env.CAMPUSOS_DATA_DIR = directory;
process.env.JWT_SECRET = "summary-check-private-signing-secret-123456789";
delete process.env.DATABASE_URL;
delete process.env.VERCEL;
delete process.env.CAMPUSOS_SHARED_PORTAL_ACCOUNTS;
const { getDb } = await import("../src/db.js");
const { default: app } = await import("../src/index.js");
const { createSharedPortalConfig, applySharedPortalAccounts } = await import(
  "../src/shared-portal-accounts.js"
);
const { generateToken } = await import("../src/middleware/auth.js");
const db = getDb();
const config = await createSharedPortalConfig({
  email: "summary.review@example.com",
  fullName: "Summary Reviewer",
  password: "SummaryReviewFixture!2026",
});
applySharedPortalAccounts(db, config);
const user = (role: string) =>
  db
    .prepare("SELECT * FROM users WHERE email = ? AND role = ?")
    .get(config.email, role);
const insert = (table: string, row: Record<string, any>) =>
  db
    .prepare(
      `INSERT INTO ${table} (${Object.keys(row).join(",")}) VALUES (${Object.keys(
        row,
      )
        .map(() => "?")
        .join(",")})`,
    )
    .run(...Object.values(row));
db.prepare("UPDATE users SET student_id = ? WHERE id = ?").run(
  "REVIEW-1",
  user("STUDENT").id,
);
for (const row of [
  {
    id: "student-1",
    user_id: user("STUDENT").id,
    student_id: "REVIEW-1",
    grade: "Grade 10",
    section: "A",
    status: "ACTIVE",
  },
  {
    id: "student-2",
    student_id: "REVIEW-2",
    grade: "Grade 10",
    section: "A",
    status: "ACTIVE",
  },
  {
    id: "student-other",
    student_id: "REVIEW-3",
    grade: "Grade 7",
    section: "A",
    status: "ACTIVE",
  },
])
  insert("students", row);
for (const id of ["homework-1", "homework-empty"])
  insert("homework", {
    id,
    grade: id === "homework-empty" ? "Grade 11" : "Grade 10",
    section: "A",
    subject: "Mathematics",
    title: id,
  });
for (const row of [
  {
    id: "old",
    student_id: "student-1",
    status: "SUBMITTED",
    created_at: "2020-01-01",
  },
  {
    id: "latest",
    student_id: "REVIEW-1",
    status: "GRADED",
    marks_obtained: 0,
    created_at: "2020-01-02",
  },
  {
    id: "peer",
    student_id: "student-2",
    status: "SUBMITTED",
    created_at: "2020-01-02",
  },
  {
    id: "outside",
    student_id: "student-other",
    status: "GRADED",
    marks_obtained: 8,
    created_at: "2020-01-02",
  },
])
  insert("homework_submissions", { homework_id: "homework-1", ...row });
for (const [index, status] of ["PRESENT", "LATE", "ABSENT"].entries())
  insert("attendance_records", {
    id: `attendance-${index}`,
    student_id: "student-1",
    date: `2020-01-0${index + 1}`,
    status,
  });
insert("staff_details", { id: "active-staff", status: "ACTIVE" });
insert("staff_details", { id: "archived-staff", status: "ARCHIVED" });
for (const row of [
  {
    id: "oct-paid",
    month: "October",
    department: "Teaching",
    payment_status: "PAID",
    net_salary: 100,
    pf_deduction: 10,
    tax_deduction: 5,
  },
  {
    id: "oct-pending",
    month: "October",
    department: "Office",
    payment_status: "PENDING",
    net_salary: 200,
    pf_deduction: 20,
    tax_deduction: 10,
  },
  {
    id: "nov-paid",
    month: "November",
    department: "Teaching",
    payment_status: "PAID",
    net_salary: 300,
    pf_deduction: 30,
    tax_deduction: 15,
  },
])
  insert("payrolls", {
    year: 2026,
    employee_name: "Review Employee",
    employee_id: row.id,
    ...row,
  });
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
async function request(endpoint: string, role = "SUPER_ADMIN", body?: unknown) {
  const response = await fetch(base + endpoint, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${generateToken(user(role))}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: response.status, body: await response.json() };
}
test("homework progress counts real students once across legacy identifiers and preserves zero grades", async () => {
  const result = await request("/homework");
  assert.equal(result.status, 200);
  assert.deepEqual(
    result.body.homework.find((item: any) => item.id === "homework-1")
      .submissionSummary,
    { assignedCount: 2, submittedCount: 2, gradedCount: 1 },
  );
  assert.deepEqual(
    result.body.homework.find((item: any) => item.id === "homework-empty")
      .submissionSummary,
    { assignedCount: 0, submittedCount: 0, gradedCount: 0 },
  );
  const student = await request("/homework", "STUDENT");
  assert.equal(student.body.homework.length, 1);
  assert.equal(student.body.homework[0].submissionSummary, undefined);
});
test("written homework responses save actual notes without inventing an attached PDF", async () => {
  assert.equal(
    (await request("/homework/homework-1/submit", "STUDENT", { content: "" }))
      .status,
    400,
  );
  assert.equal(
    (
      await request("/homework/homework-1/submit", "STUDENT", {
        content: "My reasoning and worked answer.",
      })
    ).status,
    200,
  );
  const result = await request("/homework", "STUDENT");
  assert.equal(result.body.homework[0].isSubmitted, true);
  assert.equal(result.body.homework[0].submission.attachment, null);
  assert.equal(
    result.body.homework[0].submission.content,
    "My reasoning and worked answer.",
  );
});
test("payroll summary and ledger use the same selected period and filters", async () => {
  const october = await request("/payroll/summary?month=October&year=2026");
  assert.equal(october.status, 200);
  assert.equal(october.body.month, "October");
  assert.equal(october.body.totalDisbursed, 100);
  assert.equal(october.body.pendingDisbursements, 200);
  assert.equal(october.body.totalDeductions, 45);
  assert.equal(october.body.processedCount, 2);
  assert.equal(october.body.totalStaffCount, 1);
  const november = await request("/payroll/summary?month=November&year=2026");
  assert.equal(november.body.totalDisbursed, 300);
  assert.equal(november.body.processedCount, 1);
  const filters =
    "month=October&year=2026&department=Teaching&status=PAID&search=Review";
  const summary = await request("/payroll/summary?" + filters);
  const ledger = await request("/payroll/records?" + filters);
  assert.equal(summary.body.processedCount, ledger.body.records.length);
  assert.equal(
    summary.body.totalDisbursed,
    ledger.body.records.reduce(
      (sum: number, row: any) => sum + row.net_salary,
      0,
    ),
  );
  const all = await request("/payroll/summary?month=ALL&year=2026");
  assert.equal(all.body.totalDisbursed, 400);
  assert.equal(all.body.processedCount, 3);
});
test("invalid payroll periods return a useful validation response", async () => {
  for (const endpoint of [
    "/payroll/summary?month=Unknown",
    "/payroll/records?year=abc",
    "/payroll/summary?year=2026.5",
  ])
    assert.equal((await request(endpoint)).status, 400);
});
test("student directory derives missing attendance from records without inventing GPA or contacts", async () => {
  const result = await request("/students");
  const student = result.body.students.find(
    (item: any) => item.id === "student-1",
  );
  assert.equal(student.attendance_pct, 66.7);
  assert.equal(student.attendance_record_count, 3);
  assert.equal(student.gpa, undefined);
  assert.equal(student.parent_phone, undefined);
  const scoped = await request("/students", "STUDENT");
  assert.equal(scoped.body.students.length, 1);
});
