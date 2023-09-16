import type { User } from './users.schema';

import { z } from 'zod';

import { createZodPrismaFilterValueSchema } from '../utils';

const workspaceUserRole = z.enum(['owner', 'admin', 'user']);

export const workspaceUserSchema = z.object({
  id: z.string().uuid(),
  workspaceId: z.string().uuid(),
  userId: z.string().uuid().nullable(),
  role: workspaceUserRole,
  suspended: z.boolean(),
  createdAt: z.date().transform((date) => new Date(date)),
  updatedAt: z.date().transform((date) => new Date(date)),
});

export type WorkspaceUser = z.infer<typeof workspaceUserSchema>;

export type WorkspaceUserWithUser = WorkspaceUser & {
  user: Pick<User, 'firstName' | 'lastName' | 'email'>;
};

export const workspaceUserCreateSchema = z.object({
  workspaceId: z.string().uuid(),
  userId: z.string().uuid(),
  role: workspaceUserRole.default('user').optional(),
  suspended: z.boolean().default(false).optional(),
});

export const workspaceUserUpdateSchema = z.object({
  id: z.string().uuid(),
  role: workspaceUserRole.optional(),
  suspended: z.boolean().optional(),
});

export const workspaceUserQuerySchema = z.object({
  workspaceId: z.string().uuid(),
  suspended: createZodPrismaFilterValueSchema(z.boolean()),
  role: createZodPrismaFilterValueSchema(workspaceUserRole),
});

export const workspaceUserInviteSchema = z.object({
  id: z.string().uuid(),
  workspaceId: z.string().uuid(),
  email: z.string().email(),
  role: workspaceUserRole.optional().default('user'),
  createdAt: z.date().transform((date) => new Date(date)),
  updatedAt: z.date().transform((date) => new Date(date)),
});

export type WorkspaceUserInvite = z.infer<typeof workspaceUserInviteSchema>;

export const workspaceUserInviteCreateSchema = z.object({
  workspaceId: z.string().uuid(),
  emails: z.array(z.string().email()).max(20),
  role: workspaceUserRole.optional().default('user'),
});

export const workspaceUserInviteAcceptSchema = z.object({
  code: z.string(),
  firstName: z.string(),
  lastName: z.string(),
});

export const workspaceUserInviteReadSchema = z.object({
  code: z.string(),
});
