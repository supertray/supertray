import { z } from 'zod';

export const workspaceSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  createdAt: z.date().transform((date) => new Date(date)),
  updatedAt: z.date().transform((date) => new Date(date)),
});

export type Workspace = z.infer<typeof workspaceSchema>;

export const workspaceCreateSchema = z.object({
  name: z.string(),
});

export const workspaceUpdateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().optional(),
});
