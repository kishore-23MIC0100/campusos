import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';

test('production starts fail closed without a private JWT secret or database', () => {
  const env = { ...process.env, NODE_ENV: 'production', JWT_SECRET: '', DATABASE_URL: '' };
  const result = spawnSync(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', "await import('./src/index.ts')"], { env, encoding: 'utf8' });
  assert.notEqual(result.status, 0); assert.match(result.stderr, /Set JWT_SECRET/);
  env.JWT_SECRET = 'test-private-secret-at-least-32-characters';
  const noDatabase = spawnSync(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', "await import('./src/index.ts')"], { env, encoding: 'utf8' });
  assert.notEqual(noDatabase.status, 0); assert.match(noDatabase.stderr, /DATABASE_URL is required/);
});
test('production cannot seed demo accounts', () => {
  const result = spawnSync(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', "const {seedDatabase}=await import('./src/seed.ts'); await seedDatabase();"], { env: { ...process.env, NODE_ENV: 'production' }, encoding: 'utf8' });
  assert.notEqual(result.status, 0); assert.match(result.stderr, /Demo data cannot be seeded in production/);
});
test('stdin provisioning creates exactly one approved user without printing credentials', () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'campusos-provision-test-'));
  try {
    const env = { ...process.env, NODE_ENV: 'test', DATABASE_URL: '', CAMPUSOS_DATA_DIR: directory, CAMPUSOS_USER_EMAIL: '' };
    const input = JSON.stringify({ email: 'unique.staff@example.com', password: 'UniqueStaffSecret!2026', fullName: 'Campus Operations', role: 'STAFF' }) + '\n';
    const output = execFileSync(process.execPath, ['--import', 'tsx', 'src/provision-user.ts'], { env, input, encoding: 'utf8' });
    assert.match(output, /Approved STAFF account created/); assert.ok(!output.includes('UniqueStaffSecret!2026')); assert.ok(!output.includes('unique.staff@example.com'));
    const users = JSON.parse(readFileSync(path.join(directory, 'campusos_data.json'), 'utf8')).users;
    assert.equal(users.length, 1); assert.equal(users[0].status, 'APPROVED'); assert.ok(users[0].password_hash.startsWith('$2'));
    const duplicate = spawnSync(process.execPath, ['--import', 'tsx', 'src/provision-user.ts'], { env, input, encoding: 'utf8' });
    assert.notEqual(duplicate.status, 0); assert.equal(JSON.parse(readFileSync(path.join(directory, 'campusos_data.json'), 'utf8')).users.length, 1);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
