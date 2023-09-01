import { z } from 'zod';

export const userSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  createdAt: z.date().transform((date) => new Date(date)),
  updatedAt: z.date().transform((date) => new Date(date)),
});

export type User = z.infer<typeof userSchema>;

export const userCreateSchema = z.object({
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
});

export const userUpdateSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export const userReadSchema = z.string().uuid();
