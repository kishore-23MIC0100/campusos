import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import { api, ApiError, buildQuery, getToken, setToken, clearToken, getStoredUser, setStoredUser, type User } from '../client/src/services/api.ts';

const entries = new Map<string, string>();
const storage = {
  getItem: (key: string) => entries.get(key) ?? null,
  setItem: (key: string, value: string) => { entries.set(key, value); },
  removeItem: (key: string) => { entries.delete(key); },
};
const originalFetch = globalThis.fetch;
const user: User = { id: 'staff_21', email: 'operations@example.edu', username: 'operations', role: 'STAFF', fullName: 'Operations Team', status: 'APPROVED' };
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
beforeEach(() => { clearToken(); entries.clear(); });
afterEach(() => { globalThis.fetch = originalFetch; });

function json(value: unknown, status = 200) { return new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } }); }

test('query filters omit unset values and preserve false, zero and special characters', () => {
  assert.equal(buildQuery({ grade: undefined, section: null, search: 'A&B / C', limit: 0, enabled: false, empty: '' }), 'search=A%26B+%2F+C&limit=0&enabled=false');
});

test('login uses same-origin API without an old bearer token and stores the new identity', async () => {
  setToken('old-token');
  globalThis.fetch = async (input, options) => {
    assert.equal(input, '/api/auth/login');
    assert.equal(new Headers(options?.headers).get('Authorization'), null);
    assert.equal(options?.method, 'POST');
    assert.deepEqual(JSON.parse(options?.body as string), { identifier: 'operations', password: 'test-password', expectedRole: 'STAFF' });
    return json({ token: 'verified-token', user });
  };
  const result = await api.login('operations', 'test-password', 'STAFF');
  assert.equal(result.user.id, user.id);
  assert.equal(getToken(), 'verified-token');
  assert.deepEqual(getStoredUser(), user);
});

test('authenticated read sends bearer token and escapes path identifiers', async () => {
  setToken('session-token');
  globalThis.fetch = async (input, options) => {
    assert.equal(input, '/api/students/grade%2F1%3Fadmin%3Dtrue');
    assert.equal(new Headers(options?.headers).get('Authorization'), 'Bearer session-token');
    return json({ student: { id: 'grade/1?admin=true' } });
  };
  const response = await api.getStudent('grade/1?admin=true');
  assert.equal(response.student.id, 'grade/1?admin=true');
});

test('expired session clears both token and cached profile', async () => {
  setToken('expired'); setStoredUser(user);
  globalThis.fetch = async () => json({ error: 'Session expired.' }, 401);
  await assert.rejects(api.getMe(), (error: unknown) => error instanceof ApiError && error.status === 401 && error.message === 'Session expired.');
  assert.equal(getToken(), null);
  assert.equal(getStoredUser(), null);
});

test('account restriction on profile invalidates the session', async () => {
  setToken('restricted'); setStoredUser(user);
  globalThis.fetch = async () => json({ error: 'Account is disabled.' }, 403);
  await assert.rejects(api.getMe(), { status: 403 });
  assert.equal(getToken(), null);
});

test('operation permission failure preserves a valid session', async () => {
  setToken('staff-token');
  globalThis.fetch = async () => json({ error: 'Permission denied.' }, 403);
  await assert.rejects(api.getUsers(), { status: 403 });
  assert.equal(getToken(), 'staff-token');
});

test('non-JSON gateway failures become a useful error without leaking HTML', async () => {
  globalThis.fetch = async () => new Response('<html>upstream trace</html>', { status: 502 });
  await assert.rejects(api.getEvents(), (error: unknown) => error instanceof ApiError && error.status === 502 && !error.message.includes('<html>'));
});

test('unreadable successful response fails explicitly', async () => {
  globalThis.fetch = async () => new Response('<html>wrong route</html>', { status: 200 });
  await assert.rejects(api.getEvents(), /unreadable response/);
});

test('network failure gets an actionable connection error', async () => {
  globalThis.fetch = async () => { throw new TypeError('Failed to fetch'); };
  await assert.rejects(api.getEvents(), /Check your connection/);
});

test('empty 204 responses are accepted', async () => {
  globalThis.fetch = async () => new Response(null, { status: 204 });
  assert.equal(await api.deleteNotification('notice-1'), undefined);
});

test('malformed and unauthorized cached profiles are discarded', () => {
  entries.set('campusos_user', '{broken'); assert.equal(getStoredUser(), null);
  entries.set('campusos_user', JSON.stringify({ ...user, status: 'DISABLED' })); assert.equal(getStoredUser(), null);
  entries.set('campusos_user', JSON.stringify({ ...user, role: 'ROOT' })); assert.equal(getStoredUser(), null);
});

test('token removal in another tab is reflected even after this tab set a token', () => {
  setToken('session'); entries.delete('campusos_token'); assert.equal(getToken(), null);
});

test('storage restrictions use an in-memory session safely', () => {
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error('Storage blocked'); } });
  try {
    setToken('private-session'); setStoredUser(user);
    assert.equal(getToken(), 'private-session'); assert.deepEqual(getStoredUser(), user);
    clearToken(); assert.equal(getToken(), null);
  } finally { Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage }); }
});

test('password changes send current proof and replace the revoked session token', async () => {
  setToken('old-session');
  globalThis.fetch = async (input, options) => {
    assert.equal(input, '/api/auth/change-password');
    assert.equal(options?.method, 'POST');
    assert.deepEqual(JSON.parse(options?.body as string), { currentPassword: 'current-password', newPassword: 'new-secure-password' });
    return json({ message: 'Password updated.', token: 'rotated-session' });
  };
  await api.changePassword('current-password', 'new-secure-password');
  assert.equal(getToken(), 'rotated-session');
});

test('staff directory filters use the restricted directory endpoint', async () => {
  setToken('staff-session');
  globalThis.fetch = async (input, options) => {
    assert.equal(input, '/api/staff/directory?category=TECHNICIAN&search=AV+%26+IT');
    assert.equal(new Headers(options?.headers).get('Authorization'), 'Bearer staff-session');
    return json({ staff: [], categories: [], categoryCounts: {}, myProfile: null });
  };
  const result = await api.getStaffDirectory({ category: 'TECHNICIAN', search: 'AV & IT' });
  assert.deepEqual(result.staff, []);
});
