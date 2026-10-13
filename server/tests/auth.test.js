import request from 'supertest';
import { createApp } from '../src/app.js';
import { User } from '../src/models/User.js';
import { useTestDb, createUser } from './helpers.js';

const app = createApp();
useTestDb('auth');

const getRefreshCookie = (res) => res.headers['set-cookie']?.find((c) => c.startsWith('refreshToken='));
const cookieValue = (cookie) => cookie.split(';')[0];

describe('POST /api/auth/register', () => {
  const body = { name: 'Asha', email: 'Asha@Test.dev', password: 'Password123' };

  it('creates an employee, returns an access token and sets an httpOnly refresh cookie', async () => {
    const res = await request(app).post('/api/auth/register').send(body);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toEqual(expect.any(String));
    expect(res.body.data.user).toMatchObject({ email: 'asha@test.dev', role: 'employee' });
    expect(res.body.data.user.password).toBeUndefined();
    expect(res.body.data.user.refreshTokenHash).toBeUndefined();

    const cookie = getRefreshCookie(res);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Strict/i);
    expect(cookie).toMatch(/Path=\/api\/auth/i);
  });

  it('ignores a role sent by the client, so nobody can self-register as admin', async () => {
    const res = await request(app).post('/api/auth/register').send({ ...body, role: 'admin' });
    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe('employee');
  });

  it('stores a bcrypt hash, never the plain password', async () => {
    await request(app).post('/api/auth/register').send(body);
    const user = await User.findOne({ email: 'asha@test.dev' }).select('+password');
    expect(user.password).not.toBe(body.password);
    expect(user.password).toMatch(/^\$2[aby]\$/);
  });

  it('rejects a duplicate email with 409', async () => {
    await request(app).post('/api/auth/register').send(body);
    const res = await request(app).post('/api/auth/register').send(body);
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('rejects a weak password with 400 and field details', async () => {
    const res = await request(app).post('/api/auth/register').send({ ...body, password: 'short' });
    expect(res.status).toBe(400);
    expect(res.body.details.some((d) => d.path === 'password')).toBe(true);
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with the right password', async () => {
    const user = await createUser({ email: 'login@test.dev' });
    const res = await request(app).post('/api/auth/login').send({ email: 'login@test.dev', password: 'Password123' });

    expect(res.status).toBe(200);
    expect(res.body.data.user._id).toBe(user.id);
    expect(res.body.data.user.password).toBeUndefined();
    expect(getRefreshCookie(res)).toBeDefined();
  });

  it('returns the same 401 for a wrong password and an unknown email', async () => {
    await createUser({ email: 'login@test.dev' });
    const wrong = await request(app).post('/api/auth/login').send({ email: 'login@test.dev', password: 'Nope12345' });
    const unknown = await request(app).post('/api/auth/login').send({ email: 'ghost@test.dev', password: 'Nope12345' });

    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body.message).toBe(unknown.body.message);
  });

  it('refuses a deactivated account', async () => {
    await createUser({ email: 'off@test.dev', isActive: false });
    const res = await request(app).post('/api/auth/login').send({ email: 'off@test.dev', password: 'Password123' });
    expect(res.status).toBe(403);
  });
});

describe('refresh token rotation', () => {
  async function loginCookie() {
    await createUser({ email: 'rot@test.dev' });
    const res = await request(app).post('/api/auth/login').send({ email: 'rot@test.dev', password: 'Password123' });
    return cookieValue(getRefreshCookie(res));
  }

  it('issues a new access token and a new refresh cookie', async () => {
    const first = await loginCookie();
    const res = await request(app).post('/api/auth/refresh').set('Cookie', first);

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toEqual(expect.any(String));
    expect(cookieValue(getRefreshCookie(res))).not.toBe(first);
  });

  it('treats reuse of an old refresh token as theft and revokes the session', async () => {
    const first = await loginCookie();
    const rotated = await request(app).post('/api/auth/refresh').set('Cookie', first);
    const second = cookieValue(getRefreshCookie(rotated));

    const reuse = await request(app).post('/api/auth/refresh').set('Cookie', first);
    expect(reuse.status).toBe(401);

    // The legitimate latest token is revoked too
    const afterReuse = await request(app).post('/api/auth/refresh').set('Cookie', second);
    expect(afterReuse.status).toBe(401);
  });

  it('returns 401 without a cookie', async () => {
    const res = await request(app).post('/api/auth/refresh');
    expect(res.status).toBe(401);
  });

  it('logout revokes the refresh token', async () => {
    const cookie = await loginCookie();
    const out = await request(app).post('/api/auth/logout').set('Cookie', cookie);
    expect(out.status).toBe(200);

    const res = await request(app).post('/api/auth/refresh').set('Cookie', cookie);
    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  it('returns the current user for a valid token', async () => {
    const reg = await request(app).post('/api/auth/register').send({ name: 'Me', email: 'me@test.dev', password: 'Password123' });
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${reg.body.data.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe('me@test.dev');
  });

  it('rejects a tampered token with 401', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer not.a.jwt');
    expect(res.status).toBe(401);
  });
});
