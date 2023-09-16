import { z } from 'zod';

import { documentSchema } from './documents.schema';
import { workspaceUserInviteSchema, workspaceUserSchema } from './workspace-users.schema';
import { workspaceSchema } from './workspaces.schema';

const baseActivitySchema = z.object({
  workspaceId: z.string(),
  action: z.enum(['create', 'update', 'delete']),
  createdBy: z.string(),
});

export const workspaceActivitySchema = z.union([
  baseActivitySchema.extend({
    on: z.literal('workspace'),
    payload: workspaceSchema,
  }),
  baseActivitySchema.extend({
    on: z.literal('workspace-user'),
    payload: workspaceUserSchema.extend({
      user: z.object({
        firstName: z.string(),
        lastName: z.string(),
        email: z.string().email(),
      }),
    }),
  }),
  baseActivitySchema.extend({
    on: z.literal('workspace-user-invite'),
    payload: workspaceUserInviteSchema,
  }),
  baseActivitySchema.extend({
    on: z.literal('document'),
    payload: documentSchema,
  }),
]);

export type WorkspaceActivity = z.infer<typeof workspaceActivitySchema>;
