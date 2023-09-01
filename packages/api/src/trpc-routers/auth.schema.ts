import type { User } from './users.schema';
import type { WorkspaceUser } from './workspace-users.schema';
import type { AbilityTuple, MongoAbility, MongoQuery } from '@casl/ability';

import { z } from 'zod';

import { userSchema } from './users.schema';

export const authSendLoginSchema = z.object({
  email: z.string().email(),
});

export const authLoginSchema = z.object({
  email: z.string().email(),
  otp: z.string(),
});

export const authAuthenticateSchema = z.object({
  accessToken: z.string(),
});

export const loginTokenSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  token: z.string(),
  expiresAt: z.string().transform((date) => new Date(date)),
  createdAt: z.string().transform((date) => new Date(date)),
  updatedAt: z.string().transform((date) => new Date(date)),
});

export type LoginToken = z.infer<typeof loginTokenSchema>;

export const sessionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  token: z.string(),
  expiresAt: z.string().transform((date) => new Date(date)),
  createdAt: z.string().transform((date) => new Date(date)),
  updatedAt: z.string().transform((date) => new Date(date)),
});

export type Session = z.infer<typeof sessionSchema>;

export const authLoginResponseSchema = z.object({
  accessToken: z.string(),
  expiresIn: z.number(),
  refreshToken: z.string(),
  refreshTokenExpiresIn: z.number(),
  user: userSchema,
});

export const authRefreshSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export type AuthSessionWithUserAndWorkspaces = Session & {
  user: User;
  workspaces: { id: string; role: WorkspaceUser['role'] }[];
};

export type CaslAbilities = MongoAbility<AbilityTuple, MongoQuery>;
