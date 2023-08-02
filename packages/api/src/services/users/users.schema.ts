// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import type { HookContext } from '../../declarations';
import type { Static } from '@feathersjs/typebox';

import { passwordHash } from '@feathersjs/authentication-local';
import { resolve } from '@feathersjs/schema';
import { Type, getValidator, querySyntax } from '@feathersjs/typebox';

import { dataValidator, queryValidator } from '../../validators';

// Main data model schema
export const userSchema = Type.Object(
  {
    id: Type.String({ format: 'uuid' }),
    email: Type.String({ format: 'email' }),
    firstName: Type.Optional(Type.String()),
    lastName: Type.Optional(Type.String()),
    password: Type.Optional(Type.String({ minLength: 8 })),
    isVerified: Type.Boolean(),
    createdAt: Type.Optional(Type.String({ format: 'date-time' })),
    updatedAt: Type.Optional(Type.String({ format: 'date-time' })),
  },
  { $id: 'User', additionalProperties: false },
);
export type User = Static<typeof userSchema>;
export const userValidator = getValidator(userSchema, dataValidator);
export const userResolver = resolve<User, HookContext>({});

export const userExternalResolver = resolve<User, HookContext>({
  // The password should never be visible externally
  password: async () => undefined,
  createdAt: async () => undefined,
  updatedAt: async () => undefined,
});

// Schema for creating new entries
export const userDataSchema = Type.Pick(
  userSchema,
  ['firstName', 'lastName', 'email', 'password'],
  {
    $id: 'UserData',
  },
);
export type UserData = Static<typeof userDataSchema>;
export const userDataValidator = getValidator(userDataSchema, dataValidator);
export const userDataResolver = resolve<User, HookContext>({
  password: passwordHash({ strategy: 'local' }),
});

// Schema for updating existing entries
export const userPatchSchema = Type.Omit(
  Type.Partial(userSchema, {
    $id: 'UserPatch',
  }),
  ['id', 'createdAt', 'updatedAt'],
);
export type UserPatch = Static<typeof userPatchSchema>;
export const userPatchValidator = getValidator(userPatchSchema, dataValidator);
export const userPatchResolver = resolve<User, HookContext>({
  password: passwordHash({ strategy: 'local' }),
});
export const userPatchExternalDiscardedFields = ['email', 'password', 'isVerified'] as const;

export const userActionSchema = Type.Union([
  Type.Object({
    action: Type.Literal('verifySignup'),
    payload: Type.Object({
      verifyToken: Type.String({ minLength: 1 }),
    }),
  }),
  Type.Object({
    action: Type.Literal('resendVerifySignup'),
    payload: Type.Object({
      email: Type.String({ format: 'email' }),
    }),
  }),
  Type.Object({
    action: Type.Literal('sendResetPwd'),
    payload: Type.Object({
      email: Type.String({ format: 'email' }),
    }),
  }),
  Type.Object({
    action: Type.Literal('resetPwd'),
    payload: Type.Object({
      token: Type.String({ minLength: 1 }),
      password: Type.String({ minLength: 8 }),
    }),
  }),
  Type.Object({
    action: Type.Literal('pwdChange'),
    payload: Type.Object({
      password: Type.String({ minLength: 8 }),
      newPassword: Type.String({ minLength: 8 }),
    }),
  }),
  Type.Object({
    action: Type.Literal('emailChange'),
    payload: Type.Object({
      password: Type.String({ minLength: 8 }),
      email: Type.String({ format: 'email' }),
    }),
  }),
]);
export type UserAction = Static<typeof userActionSchema>;
export const userActionValidator = getValidator(userActionSchema, dataValidator);
export const userActionResolver = resolve<UserAction, HookContext>({});

// Schema for allowed query properties
export const userQueryProperties = Type.Pick(userSchema, ['id', 'email']);
export const userQuerySchema = Type.Intersect(
  [
    querySyntax(userQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false }),
  ],
  { additionalProperties: false },
);
export type UserQuery = Static<typeof userQuerySchema>;
export const userQueryValidator = getValidator(userQuerySchema, queryValidator);
export const userQueryResolver = resolve<UserQuery, HookContext>({
  // If there is a user (e.g. with authentication), they are only allowed to see their own data
  id: (value, user, context) => {
    if (context.params.user) {
      return context.params.user.id;
    }

    return value;
  },
});
