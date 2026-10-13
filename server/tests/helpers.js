import mongoose from 'mongoose';
import { User } from '../src/models/User.js';
import { signAccessToken } from '../src/utils/tokens.js';

// Each test file gets its own database on the shared in-memory server
export function useTestDb(name) {
  beforeAll(async () => {
    const uri = new URL(process.env.MONGO_URI);
    uri.pathname = `/${name}`;
    await mongoose.connect(uri.toString());
    await User.syncIndexes();
  });

  afterEach(async () => {
    await Promise.all(Object.values(mongoose.connection.collections).map((c) => c.deleteMany({})));
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });
}

let counter = 0;
export async function createUser(fields = {}) {
  counter += 1;
  return User.create({
    name: `User ${counter}`,
    email: `user${counter}@test.dev`,
    password: 'Password123',
    ...fields,
  });
}

export const bearer = (user) => ({ Authorization: `Bearer ${signAccessToken(user)}` });

// YYYY-MM-DD, n days from today (UTC)
export function daysFromNow(n) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// A manager with one employee reporting to them, the shape most leave tests need
export async function createTeam() {
  const admin = await createUser({ role: 'admin' });
  const manager = await createUser({ role: 'manager', manager: admin._id });
  const employee = await createUser({ role: 'employee', manager: manager._id });
  return { admin, manager, employee };
}
