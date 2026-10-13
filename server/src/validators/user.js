import { z } from 'zod';
import { ROLES } from '../models/User.js';
import { objectId, pagination } from './common.js';

export const listUsersQuery = z.object({
  ...pagination,
  role: z.enum(ROLES).optional(),
  search: z.string().trim().max(80).optional(),
});

export const updateUserSchema = z
  .object({
    role: z.enum(ROLES).optional(),
    manager: objectId.nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'Nothing to update' });
