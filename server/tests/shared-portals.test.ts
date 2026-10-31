import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type { Server } from "node:http";
const directory = mkdtempSync(path.join(tmpdir(), "campusos-shared-portals-"));
process.env.NODE_ENV = "test";
process.env.CAMPUSOS_DATA_DIR = directory;
process.env.JWT_SECRET = "shared-portal-test-private-secret-123456789";
delete process.env.DATABASE_URL;
delete process.env.VERCEL;
delete process.env.CAMPUSOS_SHARED_PORTAL_ACCOUNTS;
const { getDb } = await import("../src/db.js");
const { default: app } = await import("../src/index.js");
const {
  createSharedPortalConfig,
  encodeSharedPortalConfig,
  readSharedPortalConfig,
  applySharedPortalAccounts,
  portalRoles,
} = await import("../src/shared-portal-accounts.js");
const { generateToken } = await import("../src/middleware/auth.js");
let server: Server;
let base: string;
const db = getDb();
const fixturePassword = "Fixture8";
const email = "shared.review@example.com";
let config: Awaited<ReturnType<typeof createSharedPortalConfig>>;
async function request(endpoint: string, body?: unknown, token?: string) {
  const response = await fetch(base + endpoint, {
    method: body ? "POST" : "GET",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "CampusOS portal verification",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: response.status, body: await response.json() };
}
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
test("operator confirms a short password explicitly and stores only a bcrypt hash", async () => {
  await assert.rejects(
    createSharedPortalConfig({
      email,
      fullName: "Review Operator",
      password: fixturePassword,
    }),
    /12 to 128/,
  );
  config = await createSharedPortalConfig({
    email,
    fullName: "Review Operator",
    password: fixturePassword,
    allowShortPassword: true,
  });
  assert.match(config.passwordHash, /^\$2/);
  assert.ok(!JSON.stringify(config).includes(fixturePassword));
  assert.deepEqual(
    readSharedPortalConfig(encodeSharedPortalConfig(config)),
    config,
  );
  assert.throws(
    () => readSharedPortalConfig("invalid"),
    /configuration is invalid/,
  );
});
test("shared provisioning creates six separate role identities and preserves other users", () => {
  db.prepare(
    "INSERT INTO users (id,email,username,password_hash,role,full_name,status) VALUES (?,?,?,?,?,?,?)",
  ).run(
    "existing-user",
    "existing@example.com",
    "existing",
    "unchanged-hash",
    "STAFF",
    "Existing User",
    "DISABLED",
  );
  assert.deepEqual(applySharedPortalAccounts(db, config), {
    created: 6,
    updated: 0,
    unchanged: 0,
  });
  assert.equal(
    db.prepare("SELECT * FROM users WHERE id = ?").get("existing-user")
      .password_hash,
    "unchanged-hash",
  );
  assert.equal(
    db.prepare("SELECT * FROM users WHERE id = ?").get("existing-user").status,
    "DISABLED",
  );
  for (const role of portalRoles) {
    const user = db
      .prepare("SELECT * FROM users WHERE email = ? AND role = ?")
      .get(email, role);
    assert.equal(user.status, "APPROVED");
    assert.equal(user.portal_account_revision, config.revision);
  }
});
test("the same identifier and password open each selected portal with its own permissions", async () => {
  for (const role of portalRoles) {
    const result = await request("/auth/login", {
      identifier: email,
      password: fixturePassword,
      expectedRole: role,
    });
    assert.equal(result.status, 200, role);
    assert.equal(result.body.user.role, role);
    assert.equal(result.body.user.password_hash, undefined);
    const me = await request("/auth/me", undefined, result.body.token);
    assert.equal(me.body.role, role);
  }
  const staff = await request("/auth/login", {
    identifier: email,
    password: fixturePassword,
    expectedRole: "STAFF",
  });
  assert.equal(
    (await request("/users", undefined, staff.body.token)).status,
    403,
  );
});
test("idempotent bootstrapping respects later account status and password changes", async () => {
  const staff = db
    .prepare("SELECT * FROM users WHERE email = ? AND role = ?")
    .get(email, "STAFF");
  const changed = await createSharedPortalConfig({
    email,
    fullName: "Review Operator",
    password: "UserChangedPassword!2026",
  });
  db.prepare("UPDATE users SET status = ?, password_hash = ? WHERE id = ?").run(
    "DISABLED",
    changed.passwordHash,
    staff.id,
  );
  assert.deepEqual(applySharedPortalAccounts(db, config), {
    created: 0,
    updated: 0,
    unchanged: 6,
  });
  assert.equal(staff.status, "DISABLED");
  assert.equal(staff.password_hash, changed.passwordHash);
  db.prepare("UPDATE users SET status = ? WHERE id = ?").run(
    "APPROVED",
    staff.id,
  );
});
test("credential rotation revokes existing sessions and leaves unrelated accounts unchanged", async () => {
  const previous = db
    .prepare("SELECT * FROM users WHERE email = ? AND role = ?")
    .get(email, "STAFF");
  const token = generateToken(previous);
  const next = await createSharedPortalConfig({
    email,
    fullName: "Review Operator",
    password: "ReplacementFixture!2026",
  });
  assert.deepEqual(applySharedPortalAccounts(db, next), {
    created: 0,
    updated: 6,
    unchanged: 0,
  });
  assert.equal((await request("/auth/me", undefined, token)).status, 401);
  assert.equal(
    (
      await request("/auth/login", {
        identifier: email,
        password: fixturePassword,
        expectedRole: "STAFF",
      })
    ).status,
    401,
  );
  assert.equal(
    (
      await request("/auth/login", {
        identifier: email,
        password: "ReplacementFixture!2026",
        expectedRole: "STAFF",
      })
    ).status,
    200,
  );
  config = next;
});
test("login success, rejection, blocked attempts and provisioning are audited without passwords", async () => {
  const student = db
    .prepare("SELECT * FROM users WHERE email = ? AND role = ?")
    .get(email, "STUDENT");
  db.prepare("UPDATE users SET status = ? WHERE id = ?").run(
    "DISABLED",
    student.id,
  );
  assert.equal(
    (
      await request("/auth/login", {
        identifier: email,
        password: "ReplacementFixture!2026",
        expectedRole: "STUDENT",
      })
    ).status,
    403,
  );
  const logs = db.prepare("SELECT * FROM audit_logs").all();
  for (const action of [
    "LOGIN_SUCCESS",
    "LOGIN_FAILED",
    "LOGIN_BLOCKED",
    "PORTAL_ACCOUNT_CREATED",
    "PORTAL_CREDENTIALS_UPDATED",
  ])
    assert.ok(
      logs.some((log) => log.action === action),
      action,
    );
  assert.ok(
    logs.some(
      (log) =>
        log.action === "LOGIN_SUCCESS" &&
        log.description.includes("TEACHER portal") &&
        log.user_agent === "CampusOS portal verification",
    ),
  );
  const serialized = JSON.stringify(logs);
  assert.ok(!serialized.includes(fixturePassword));
  assert.ok(!serialized.includes("ReplacementFixture!2026"));
  assert.ok(!serialized.includes(config.passwordHash));
  const admin = db
    .prepare("SELECT * FROM users WHERE email = ? AND role = ?")
    .get(email, "SUPER_ADMIN");
  const result = await request(
    "/audit-logs?action=LOGIN_FAILED",
    undefined,
    generateToken(admin),
  );
  assert.equal(result.status, 200);
  assert.ok(result.body.actions.includes("PORTAL_CREDENTIALS_UPDATED"));
  assert.ok(
    result.body.logs.every((log: any) => log.action === "LOGIN_FAILED"),
  );
  assert.equal(
    (await request("/audit-logs?limit=-1", undefined, generateToken(admin)))
      .status,
    400,
  );
});

test("duplicate portal identities reject provisioning before altering any credentials", async () => {
  const before = db
    .prepare("SELECT * FROM users")
    .all()
    .map((user) => ({ id: user.id, hash: user.password_hash }));
  db.prepare(
    "INSERT INTO users (id,email,username,password_hash,role,full_name,status) VALUES (?,?,?,?,?,?,?)",
  ).run(
    "duplicate-shared-identity",
    email,
    "duplicate-fixture",
    config.passwordHash,
    "SCHOOL_ADMIN",
    "Duplicate Fixture",
    "APPROVED",
  );
  const next = await createSharedPortalConfig({
    email,
    fullName: "Review Operator",
    password: "AnotherFixturePassword!2026",
  });
  assert.throws(
    () => applySharedPortalAccounts(db, next),
    /More than one matching/,
  );
  for (const user of before)
    assert.equal(
      db.prepare("SELECT * FROM users WHERE id = ?").get(user.id).password_hash,
      user.hash,
    );
  db.prepare("DELETE FROM users WHERE id = ?").run("duplicate-shared-identity");
});

test("the administrator portal prefers the exact executive role over an older school administrator account", async () => {
  const email = "priority.review@example.com";
  const password = "RolePriorityFixture!2026";
  const configuration = await createSharedPortalConfig({
    email,
    fullName: "Review Operator",
    password,
  });
  db.prepare(
    "INSERT INTO users (id,email,username,password_hash,role,full_name,status) VALUES (?,?,?,?,?,?,?)",
  ).run(
    "older-school-admin",
    email,
    "older.school.admin",
    configuration.passwordHash,
    "SCHOOL_ADMIN",
    "Existing School Administrator",
    "APPROVED",
  );
  assert.deepEqual(applySharedPortalAccounts(db, configuration), {
    created: 5,
    updated: 1,
    unchanged: 0,
  });
  const executive = await request("/auth/login", {
    identifier: email,
    password,
    expectedRole: "SUPER_ADMIN",
  });
  assert.equal(executive.status, 200);
  assert.equal(executive.body.user.role, "SUPER_ADMIN");
  const school = await request("/auth/login", {
    identifier: email,
    password,
    expectedRole: "SCHOOL_ADMIN",
  });
  assert.equal(school.status, 200);
  assert.equal(school.body.user.role, "SCHOOL_ADMIN");
  assert.equal(school.body.user.fullName, "Existing School Administrator");
});
