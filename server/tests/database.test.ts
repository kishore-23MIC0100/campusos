import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
const directory = mkdtempSync(path.join(tmpdir(), 'campusos-db-test-'));
process.env.CAMPUSOS_DATA_DIR = directory;
delete process.env.DATABASE_URL;
const { PureDatabase } = await import('../src/db.js');
const db = new PureDatabase();
after(async () => { await db.close(); rmSync(directory, { recursive: true, force: true }); });

test('bound AND/OR predicates and projections never leak password hashes', () => {
  db.prepare('INSERT INTO users (id, email, username, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?)').run('u1', 'one@example.com', 'one', 'secret-hash', 'STAFF', 'APPROVED');
  db.prepare('INSERT INTO users (id, email, username, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?)').run('u2', 'two@example.com', 'two', 'secret-hash', 'TEACHER', 'PENDING');
  assert.deepEqual(db.prepare('SELECT id, role FROM users WHERE (LOWER(email) = ? OR LOWER(username) = ?) AND status = ?').all('one@example.com', 'two', 'APPROVED'), [{ id: 'u1', role: 'STAFF' }]);
  assert.equal(db.prepare('SELECT count(*) FROM users WHERE status = "PENDING"').get().count, 1);
  assert.deepEqual(db.prepare("SELECT id FROM users WHERE role IN ('STAFF', 'SUPER_ADMIN')").all(), [{ id: 'u1' }]);
  assert.equal(db.prepare('SELECT id FROM users WHERE username = ?').get("' OR 1=1 --"), undefined);
});
test('literal and parameterized assignments use correct values and WHERE ownership', () => {
  db.prepare('UPDATE users SET status = "APPROVED", email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('approved@example.com', 'u2');
  assert.equal(db.prepare('SELECT * FROM users WHERE id = ?').get('u2').status, 'APPROVED');
  assert.equal(db.prepare('SELECT * FROM users WHERE id = ?').get('u2').email, 'approved@example.com');
  assert.equal(db.prepare('SELECT * FROM users WHERE id = ?').get('u1').email, 'one@example.com');
  assert.equal(db.prepare('DELETE FROM users WHERE id = ? AND status = ?').run('u1', 'PENDING').changes, 0);
});
test('failed local transactions roll back all changes and writes persist atomically', () => {
  assert.throws(() => db.transaction(() => { db.prepare('DELETE FROM users WHERE id = ?').run('u1'); throw new Error('abort'); })());
  assert.ok(db.prepare('SELECT * FROM users WHERE id = ?').get('u1'));
  db.save();
  const saved = JSON.parse(readFileSync(path.join(directory, 'campusos_data.json'), 'utf-8'));
  assert.equal(saved.users.length, 2);
});
