import { z } from 'zod';
import { LEAVE_TYPES, LEAVE_STATUSES } from '../models/LeaveRequest.js';
import { pagination } from './common.js';

const MAX_LEAVE_DAYS = 60;
const DAY_MS = 24 * 60 * 60 * 1000;

// 'YYYY-MM-DD' → Date at UTC midnight, so day arithmetic never crosses a DST or timezone edge
const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
  .transform((v) => new Date(`${v}T00:00:00.000Z`))
  .refine((d) => !Number.isNaN(d.getTime()), 'Invalid date');

function todayUtc() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export const createLeaveSchema = z
  .object({
    type: z.enum(LEAVE_TYPES),
    startDate: dateOnly,
    endDate: dateOnly,
    reason: z.string().trim().max(500).optional().default(''),
  })
  .refine((v) => v.endDate >= v.startDate, {
    path: ['endDate'],
    message: 'End date must be on or after start date',
  })
  .refine((v) => v.startDate >= todayUtc(), {
    path: ['startDate'],
    message: 'Leave cannot start in the past',
  })
  .refine((v) => (v.endDate - v.startDate) / DAY_MS + 1 <= MAX_LEAVE_DAYS, {
    path: ['endDate'],
    message: `A single request cannot exceed ${MAX_LEAVE_DAYS} days`,
  });

export const reviewLeaveSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  comment: z.string().trim().max(500).optional().default(''),
});

export const listLeavesQuery = z.object({
  ...pagination,
  status: z.enum(LEAVE_STATUSES).optional(),
  type: z.enum(LEAVE_TYPES).optional(),
});
