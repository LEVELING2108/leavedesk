// Creates demo accounts for local development. Safe to re-run: existing emails are left untouched.
import { env } from '../src/config/env.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';

const PASSWORD = 'Password123';

async function upsert({ email, ...fields }) {
  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`  exists   ${email}`);
    return existing;
  }
  const user = await User.create({ email, password: PASSWORD, ...fields });
  console.log(`  created  ${email} (${user.role})`);
  return user;
}

async function seed() {
  await connectDB(env.mongoUri);

  const admin = await upsert({ name: 'Asha Admin', email: 'admin@leavedesk.dev', role: 'admin' });
  const manager = await upsert({ name: 'Manoj Manager', email: 'manager@leavedesk.dev', role: 'manager', manager: admin._id });
  await upsert({ name: 'Esha Employee', email: 'employee1@leavedesk.dev', role: 'employee', manager: manager._id });
  await upsert({ name: 'Ravi Employee', email: 'employee2@leavedesk.dev', role: 'employee', manager: manager._id });

  console.log(`\nAll seeded accounts use the password: ${PASSWORD}`);
}

seed()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  })
  .finally(disconnectDB);
