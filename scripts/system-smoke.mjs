import assert from 'node:assert/strict';

const base = (process.env.SYSTEM_API_BASE || 'http://localhost:4000/api').replace(/\/$/, '');
const identifier = process.env.CAMPUSOS_TEST_IDENTIFIER;
const password = process.env.CAMPUSOS_TEST_PASSWORD;
const role = process.env.CAMPUSOS_TEST_ROLE || 'STAFF';
if (!identifier || !password) {
  console.error('Set CAMPUSOS_TEST_IDENTIFIER and CAMPUSOS_TEST_PASSWORD to an approved test account. The API must already be running.');
  process.exit(1);
}
let passed = 0;
async function request(path, options = {}, token) {
  const response = await fetch(`${base}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    signal: AbortSignal.timeout(20000),
  });
  let body;
  try { body = await response.json(); } catch { throw new Error(`${path}: response is not JSON (HTTP ${response.status})`); }
  return { response, body };
}
function check(label, assertion) { assertion(); passed++; console.log(`PASS ${label}`); }

try {
  const health = await request('/health');
  check('health responds successfully', () => assert.equal(health.response.status, 200));
  const anonymous = await request('/auth/me');
  check('anonymous profile is rejected', () => assert.equal(anonymous.response.status, 401));
  const login = await request('/auth/login', { method: 'POST', body: JSON.stringify({ identifier, password, expectedRole: role }) });
  check('approved account can sign in', () => { assert.equal(login.response.status, 200); assert.equal(typeof login.body.token, 'string'); assert.equal(login.body.user.status, 'APPROVED'); });
  const token = login.body.token;
  const me = await request('/auth/me', {}, token);
  check('authenticated identity matches login', () => { assert.equal(me.response.status, 200); assert.equal(me.body.id, login.body.user.id); });
  for (const [path, key] of [['/leave', 'leaves'], ['/events', 'events'], ['/announcements', 'announcements'], ['/transport/routes', 'routes'], ['/notifications', 'notifications']]) {
    const result = await request(path, {}, token);
    check(`workspace data ${path}`, () => { assert.equal(result.response.status, 200); assert.ok(Array.isArray(result.body[key])); });
  }
  if (login.body.user.role === 'STAFF') {
    for (const path of ['/users', '/students', '/payroll/summary']) {
      const result = await request(path, {}, token);
      check(`staff cannot access ${path}`, () => assert.equal(result.response.status, 403));
    }
  }
  console.log(`${passed} system smoke checks passed against ${base}. Only sign-in audit entries may be recorded; no academic records were changed.`);
} catch (error) {
  console.error(`FAIL after ${passed} checks: ${error.message}`);
  process.exitCode = 1;
}
