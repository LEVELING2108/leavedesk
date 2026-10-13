import { z } from 'zod';

const email = z.string().trim().toLowerCase().email('Invalid email');

// No role field: everyone registers as an employee, admins promote users later.
// zod strips unknown keys, so a `role` sent by the client is simply dropped.
export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email,
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be at most 72 characters') // bcrypt ignores bytes past 72
    .regex(/[A-Za-z]/, 'Password must contain a letter')
    .regex(/[0-9]/, 'Password must contain a number'),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
});
