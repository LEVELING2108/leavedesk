import request from 'supertest';
import { createApp } from '../src/app.js';
import { useTestDb, createUser, createTeam, bearer } from './helpers.js';

const app = createApp();
useTestDb('rbac');

describe('authentication required', () => {
  it.each([
    ['get', '/api/leaves/mine'],
    ['post', '/api/leaves'],
    ['get', '/api/leaves/approvals'],
    ['get', '/api/users'],
  ])('%s %s without a token → 401', async (method, path) => {
    const res = await request(app)[method](path);
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

describe('role checks', () => {
  it('employee cannot list approvals (403)', async () => {
    const { employee } = await createTeam();
    const res = await request(app).get('/api/leaves/approvals').set(bearer(employee));
    expect(res.status).toBe(403);
  });

  it('employee cannot review a leave (403)', async () => {
    const { employee } = await createTeam();
    const res = await request(app)
      .patch('/api/leaves/507f1f77bcf86cd799439011/review')
      .set(bearer(employee))
      .send({ status: 'approved' });
    expect(res.status).toBe(403);
  });

  it.each(['employee', 'manager'])('%s cannot use admin user endpoints (403)', async (role) => {
    const user = await createUser({ role });
    const list = await request(app).get('/api/users').set(bearer(user));
    const patch = await request(app).patch(`/api/users/${user.id}`).set(bearer(user)).send({ role: 'admin' });
    expect(list.status).toBe(403);
    expect(patch.status).toBe(403);
  });

  it('manager can see their team', async () => {
    const { manager, employee } = await createTeam();
    const res = await request(app).get('/api/users/team').set(bearer(manager));
    expect(res.status).toBe(200);
    expect(res.body.data.map((u) => u._id)).toEqual([employee.id]);
  });

  it('a deactivated user is locked out even with an unexpired token', async () => {
    const user = await createUser({ isActive: false });
    const res = await request(app).get('/api/leaves/mine').set(bearer(user));
    expect(res.status).toBe(401);
  });
});

describe('admin user management', () => {
  it('admin can promote a user and assign a manager', async () => {
    const { admin, manager } = await createTeam();
    const user = await createUser();
    const res = await request(app)
      .patch(`/api/users/${user.id}`)
      .set(bearer(admin))
      .send({ manager: manager.id });
    expect(res.status).toBe(200);
    expect(res.body.data.manager._id).toBe(manager.id);
  });

  it('admin cannot demote or deactivate themselves', async () => {
    const admin = await createUser({ role: 'admin' });
    const demote = await request(app).patch(`/api/users/${admin.id}`).set(bearer(admin)).send({ role: 'employee' });
    const deactivate = await request(app).patch(`/api/users/${admin.id}`).set(bearer(admin)).send({ isActive: false });
    expect(demote.status).toBe(400);
    expect(deactivate.status).toBe(400);
  });

  it('rejects an employee as someone’s manager', async () => {
    const admin = await createUser({ role: 'admin' });
    const a = await createUser();
    const b = await createUser();
    const res = await request(app).patch(`/api/users/${a.id}`).set(bearer(admin)).send({ manager: b.id });
    expect(res.status).toBe(400);
  });

  it('will not demote a manager who still has reports (409)', async () => {
    const { admin, manager } = await createTeam();
    const res = await request(app).patch(`/api/users/${manager.id}`).set(bearer(admin)).send({ role: 'employee' });
    expect(res.status).toBe(409);
  });
});
