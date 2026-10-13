import request from 'supertest';
import { createApp } from '../src/app.js';
import { useTestDb, createUser, createTeam, bearer, daysFromNow } from './helpers.js';

const app = createApp();
useTestDb('leaves');

const apply = (user, body) => request(app).post('/api/leaves').set(bearer(user)).send(body);
const leave = (start, end, type = 'casual') => ({ type, startDate: daysFromNow(start), endDate: daysFromNow(end) });

describe('applying for leave', () => {
  it('creates a pending request routed to the employee’s manager', async () => {
    const { employee, manager } = await createTeam();
    const res = await apply(employee, { ...leave(3, 5), reason: 'Family trip' });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ status: 'pending', days: 3, approver: manager.id });
  });

  it('rejects an end date before the start date (400)', async () => {
    const { employee } = await createTeam();
    const res = await apply(employee, leave(5, 3));
    expect(res.status).toBe(400);
  });

  it('rejects a start date in the past (400)', async () => {
    const { employee } = await createTeam();
    const res = await apply(employee, leave(-2, 1));
    expect(res.status).toBe(400);
  });

  it('rejects an unknown leave type (400)', async () => {
    const { employee } = await createTeam();
    const res = await apply(employee, leave(1, 1, 'holiday'));
    expect(res.status).toBe(400);
  });

  it.each([
    ['same dates', 3, 5],
    ['starts inside', 4, 8],
    ['ends inside', 1, 3],
    ['wraps around', 2, 6],
  ])('rejects an overlapping request: %s (409)', async (_label, start, end) => {
    const { employee } = await createTeam();
    await apply(employee, leave(3, 5));
    const res = await apply(employee, leave(start, end));
    expect(res.status).toBe(409);
  });

  it('allows adjacent dates, and dates freed by a cancelled request', async () => {
    const { employee } = await createTeam();
    const first = await apply(employee, leave(3, 5));
    expect((await apply(employee, leave(6, 7))).status).toBe(201);

    await request(app).patch(`/api/leaves/${first.body.data._id}/cancel`).set(bearer(employee));
    expect((await apply(employee, leave(3, 5))).status).toBe(201);
  });

  it('requires a manager to be assigned', async () => {
    const loner = await createUser();
    const res = await apply(loner, leave(1, 1));
    expect(res.status).toBe(400);
  });
});

describe('approval flow', () => {
  it('manager approves a team member’s request, which then appears as approved', async () => {
    const { employee, manager } = await createTeam();
    const created = await apply(employee, leave(2, 3));
    const id = created.body.data._id;

    const queue = await request(app).get('/api/leaves/approvals?status=pending').set(bearer(manager));
    expect(queue.body.data.items.map((l) => l._id)).toContain(id);

    const res = await request(app)
      .patch(`/api/leaves/${id}/review`)
      .set(bearer(manager))
      .send({ status: 'approved', comment: 'Enjoy' });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ status: 'approved', reviewComment: 'Enjoy' });

    const mine = await request(app).get('/api/leaves/mine').set(bearer(employee));
    expect(mine.body.data.items[0].status).toBe('approved');
  });

  it('a manager from another team cannot review it (403)', async () => {
    const { employee } = await createTeam();
    const otherManager = await createUser({ role: 'manager' });
    const created = await apply(employee, leave(2, 3));

    const res = await request(app)
      .patch(`/api/leaves/${created.body.data._id}/review`)
      .set(bearer(otherManager))
      .send({ status: 'approved' });
    expect(res.status).toBe(403);
  });

  it('nobody can review their own request (403), not even an admin', async () => {
    const admin = await createUser({ role: 'admin' });
    const created = await apply(admin, leave(2, 3));

    const res = await request(app)
      .patch(`/api/leaves/${created.body.data._id}/review`)
      .set(bearer(admin))
      .send({ status: 'approved' });
    expect(res.status).toBe(403);
  });

  it('a decided request cannot be decided again (409)', async () => {
    const { employee, manager } = await createTeam();
    const created = await apply(employee, leave(2, 3));
    const url = `/api/leaves/${created.body.data._id}/review`;

    await request(app).patch(url).set(bearer(manager)).send({ status: 'approved' });
    const again = await request(app).patch(url).set(bearer(manager)).send({ status: 'rejected' });
    expect(again.status).toBe(409);
  });

  it('an approved request cannot be cancelled (409)', async () => {
    const { employee, manager } = await createTeam();
    const created = await apply(employee, leave(2, 3));
    const id = created.body.data._id;

    await request(app).patch(`/api/leaves/${id}/review`).set(bearer(manager)).send({ status: 'approved' });
    const res = await request(app).patch(`/api/leaves/${id}/cancel`).set(bearer(employee));
    expect(res.status).toBe(409);
  });

  it('only the owner can cancel (403)', async () => {
    const { employee, manager } = await createTeam();
    const created = await apply(employee, leave(2, 3));
    const res = await request(app).patch(`/api/leaves/${created.body.data._id}/cancel`).set(bearer(manager));
    expect(res.status).toBe(403);
  });

  it('an invalid id returns 400, an unknown one 404', async () => {
    const { manager } = await createTeam();
    const bad = await request(app).patch('/api/leaves/not-an-id/review').set(bearer(manager)).send({ status: 'approved' });
    const missing = await request(app)
      .patch('/api/leaves/507f1f77bcf86cd799439011/review')
      .set(bearer(manager))
      .send({ status: 'approved' });
    expect(bad.status).toBe(400);
    expect(missing.status).toBe(404);
  });
});

describe('listing', () => {
  it('paginates and filters my leaves', async () => {
    const { employee } = await createTeam();
    for (let i = 0; i < 3; i += 1) await apply(employee, leave(i * 3 + 1, i * 3 + 2, i === 0 ? 'sick' : 'casual'));

    const page = await request(app).get('/api/leaves/mine?limit=2&page=1').set(bearer(employee));
    expect(page.body.data).toMatchObject({ total: 3, totalPages: 2, page: 1 });
    expect(page.body.data.items).toHaveLength(2);

    const sick = await request(app).get('/api/leaves/mine?type=sick').set(bearer(employee));
    expect(sick.body.data.total).toBe(1);
  });

  it('employees only ever see their own leaves', async () => {
    const { employee, manager } = await createTeam();
    const colleague = await createUser({ manager: manager._id });
    await apply(colleague, leave(1, 2));

    const res = await request(app).get('/api/leaves/mine').set(bearer(employee));
    expect(res.body.data.total).toBe(0);
  });

  it('rejects an invalid filter value (400)', async () => {
    const { employee } = await createTeam();
    const res = await request(app).get('/api/leaves/mine?status=bogus').set(bearer(employee));
    expect(res.status).toBe(400);
  });
});
