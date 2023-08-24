// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import type { HookContext } from '../../declarations';
import type { User } from '../users/users.schema';
import type { Workspaces } from '../workspaces/workspaces.schema';
import type { Static } from '@feathersjs/typebox';

import { resolve } from '@feathersjs/schema';
import { Type, getValidator, querySyntax } from '@feathersjs/typebox';

import { $joinSchema } from '../../hooks/joinRelated';
import { dataValidator, queryValidator } from '../../validators';
import { timestamps } from '../defaultSchema';

// Main data model schema
export const workspaceUsersSchema = Type.Object(
  {
    id: Type.String({ format: 'uuid' }),
    userId: Type.String({ format: 'uuid' }),
    workspaceId: Type.String({ format: 'uuid' }),
    isAdmin: Type.Boolean(),
    isOwner: Type.Boolean(),
    isActive: Type.Boolean(),
    ...timestamps,
  },
  { $id: 'WorkspaceUsers', additionalProperties: false },
);
export type WorkspaceUsers = Static<typeof workspaceUsersSchema> & {
  user?: User;
};
export const workspaceUsersValidator = getValidator(workspaceUsersSchema, dataValidator);
export const workspaceUsersResolver = resolve<WorkspaceUsers, HookContext>({});

export const workspaceUsersExternalResolver = resolve<WorkspaceUsers, HookContext>({});

// Schema for creating new entries
export const workspaceUsersDataSchema = Type.Pick(
  workspaceUsersSchema,
  ['userId', 'workspaceId', 'isAdmin', 'isOwner', 'isActive'],
  {
    $id: 'WorkspaceUsersData',
  },
);
export type WorkspaceUsersData = Static<typeof workspaceUsersDataSchema>;
export const workspaceUsersDataValidator = getValidator(workspaceUsersDataSchema, dataValidator);
export const workspaceUsersDataResolver = resolve<WorkspaceUsers, HookContext>({});

// Schema for updating existing entries
export const workspaceUsersPatchSchema = Type.Partial(
  Type.Pick(workspaceUsersSchema, ['isAdmin', 'isOwner', 'isActive']),
  {
    $id: 'WorkspaceUsersPatch',
  },
);
export type WorkspaceUsersPatch = Static<typeof workspaceUsersPatchSchema>;
export const workspaceUsersPatchValidator = getValidator(workspaceUsersPatchSchema, dataValidator);
export const workspaceUsersPatchResolver = resolve<WorkspaceUsers, HookContext>({});

// Schema for allowed query properties
export const workspaceUsersQueryProperties = Type.Pick(workspaceUsersSchema, [
  'id',
  'userId',
  'workspaceId',
  'isActive',
]);
export const workspaceUsersQuerySchema = Type.Intersect(
  [
    querySyntax(workspaceUsersQueryProperties),
    // Add additional query properties here
    $joinSchema,
  ],
  { additionalProperties: false },
);
export type WorkspaceUsersQuery = Static<typeof workspaceUsersQuerySchema>;
export const workspaceUsersQueryValidator = getValidator(workspaceUsersQuerySchema, queryValidator);
export const workspaceUsersQueryResolver = resolve<WorkspaceUsersQuery, HookContext>({});
