// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import type { HookContext } from '../../declarations';
import type { Static } from '@feathersjs/typebox';

import { resolve } from '@feathersjs/schema';
import { Type, getValidator, querySyntax } from '@feathersjs/typebox';

import { dataValidator, queryValidator } from '../../validators';
import { timestamps } from '../defaultSchema';

// Main data model schema
export const sessionSchema = Type.Object(
  {
    id: Type.String({ format: 'uuid' }),
    token: Type.String({ maxLength: 96, minLength: 96 }),
    userId: Type.String({ format: 'uuid' }),
    expiresAt: Type.String({ format: 'date-time' }),
    ipAddress: Type.Optional(Type.String({ format: 'ipv4' })),
    userAgent: Type.Optional(Type.String()),
    origin: Type.Optional(Type.String()),
    ...timestamps,
  },
  { $id: 'Session', additionalProperties: false },
);
export type Session = Static<typeof sessionSchema>;
export const sessionValidator = getValidator(sessionSchema, dataValidator);
export const sessionResolver = resolve<Session, HookContext>({});

export const sessionExternalResolver = resolve<Session, HookContext>({});

// Schema for creating new entries
export const sessionDataSchema = Type.Intersect(
  [
    Type.Pick(sessionSchema, ['userId', 'ipAddress', 'userAgent', 'origin']),
    Type.Partial(Type.Pick(sessionSchema, ['expiresAt', 'token'])),
  ],
  {
    $id: 'SessionData',
  },
);
export type SessionData = Static<typeof sessionDataSchema>;
export const sessionDataValidator = getValidator(sessionDataSchema, dataValidator);
export const sessionDataResolver = resolve<Session, HookContext>({});

// Schema for updating existing entries
export const sessionPatchSchema = Type.Partial(
  Type.Pick(sessionSchema, ['id', 'token', 'expiresAt', 'ipAddress', 'userAgent', 'origin']),
  {
    $id: 'SessionPatch',
  },
);
export type SessionPatch = Static<typeof sessionPatchSchema>;
export const sessionPatchValidator = getValidator(sessionPatchSchema, dataValidator);
export const sessionPatchResolver = resolve<Session, HookContext>({});

export const sessionRefreshSchema = Type.Object({
  refreshToken: Type.String({ maxLength: 96, minLength: 96 }),
  accessToken: Type.String(),
});
export type SessionRefresh = Static<typeof sessionRefreshSchema>;
export const sessionRefreshValidator = getValidator(sessionRefreshSchema, dataValidator);
export const sessionRefreshResolver = resolve<Session, HookContext>({});

export const sessionLogoutSchema = Type.Object({
  id: Type.Optional(Type.String({ format: 'uuid' })),
});
export type SessionLogout = Static<typeof sessionLogoutSchema>;
export const sessionLogoutValidator = getValidator(sessionLogoutSchema, dataValidator);
export const sessionLogoutResolver = resolve<Session, HookContext>({});

// Schema for allowed query properties
export const sessionQueryProperties = Type.Pick(sessionSchema, [
  'id',
  'token',
  'userId',
  'expiresAt',
]);
export const sessionQuerySchema = Type.Intersect(
  [
    querySyntax(sessionQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false }),
  ],
  { additionalProperties: false },
);
export type SessionQuery = Static<typeof sessionQuerySchema>;
export const sessionQueryValidator = getValidator(sessionQuerySchema, queryValidator);
export const sessionQueryResolver = resolve<SessionQuery, HookContext>({});
