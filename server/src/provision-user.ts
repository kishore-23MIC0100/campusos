import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { createInterface } from 'node:readline';

// Send one JSON line on stdin to keep credentials out of command arguments,
// shell history, source files and tool output. Env input remains supported for CI.
let input: Record<string, string> = {};
if (!process.env.CAMPUSOS_USER_EMAIL) {
  if (process.stdin.isTTY) process.stdin.setRawMode(true);
  console.log('Ready for provisioning JSON on stdin (input is hidden).');
  const reader = createInterface({ input: process.stdin, terminal: false });
  input = await new Promise((resolve, reject) => {
    reader.once('line', line => { try { resolve(JSON.parse(line)); } catch { reject(new Error('Provisioning input must be one valid JSON line.')); } finally { reader.close(); if (process.stdin.isTTY) process.stdin.setRawMode(false); } });
    reader.once('close', () => reject(new Error('Provisioning input ended before a valid JSON line was received.')));
  });
}
if (input.databaseUrl) process.env.DATABASE_URL = input.databaseUrl;
if (input.databaseSsl) process.env.DATABASE_SSL = input.databaseSsl;
const email = (input.email || process.env.CAMPUSOS_USER_EMAIL)?.trim().toLowerCase();
const password = input.password || process.env.CAMPUSOS_USER_PASSWORD;
const role = input.role || process.env.CAMPUSOS_USER_ROLE || 'STAFF';
const fullName = (input.fullName || process.env.CAMPUSOS_USER_NAME)?.trim();
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password || password.length < 12 || password.length > 128 || !fullName || !['STAFF', 'SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'PARENT'].includes(role)) {
  throw new Error('Supply email, password (12-128 characters), fullName and a supported role. Credentials are never printed.');
}
if ((process.env.VERCEL || process.env.NODE_ENV === 'production') && !process.env.DATABASE_URL) throw new Error('DATABASE_URL is required for production provisioning.');
const { getDb } = await import('./db.js');
const db = getDb();
const finish = await db.beginRequest();
try {
  if (db.prepare('SELECT id FROM users WHERE LOWER(email) = ? OR LOWER(username) = ?').get(email, email)) throw new Error('An account already exists. Use the administrator flow to change its status.');
  const hash = await bcrypt.hash(password, 12);
  db.prepare('INSERT INTO users (id, email, username, password_hash, role, full_name, status, department) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(`usr_${randomUUID()}`, email, email, hash, role, fullName, 'APPROVED', input.department || process.env.CAMPUSOS_USER_DEPARTMENT || null);
  await finish();
  console.log(`Approved ${role} account created. Sign in using the supplied email and password.`);
} catch (error) { await finish(false); throw error; } finally { await db.close(); }
