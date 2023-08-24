// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import type { HookContext } from '../../declarations';
import type { Static } from '@feathersjs/typebox';

import { resolve } from '@feathersjs/schema';
import { Type, getValidator, querySyntax } from '@feathersjs/typebox';

import { dataValidator, queryValidator } from '../../validators';
import { timestamps } from '../defaultSchema';

// Main data model schema
export const workspacesSchema = Type.Object(
  {
    id: Type.String({ format: 'uuid' }),
    name: Type.String({ maxLength: 100 }),
    slug: Type.String({ maxLength: 32, format: 'regex', pattern: '^[a-z0-9-]+$' }),
    ...timestamps,
  },
  { $id: 'Workspaces', additionalProperties: false },
);
export type Workspaces = Static<typeof workspacesSchema>;
export const workspacesValidator = getValidator(workspacesSchema, dataValidator);
export const workspacesResolver = resolve<Workspaces, HookContext>({});

export const workspacesExternalResolver = resolve<Workspaces, HookContext>({});

// Schema for creating new entries
export const workspacesDataSchema = Type.Pick(workspacesSchema, ['name', 'slug'], {
  $id: 'WorkspacesData',
});
export type WorkspacesData = Static<typeof workspacesDataSchema>;
export const workspacesDataValidator = getValidator(workspacesDataSchema, dataValidator);
export const workspacesDataResolver = resolve<Workspaces, HookContext>({});

// Schema for updating existing entries
export const workspacesPatchSchema = Type.Partial(Type.Pick(workspacesSchema, ['name']), {
  $id: 'WorkspacesPatch',
});
export type WorkspacesPatch = Static<typeof workspacesPatchSchema>;
export const workspacesPatchValidator = getValidator(workspacesPatchSchema, dataValidator);
export const workspacesPatchResolver = resolve<Workspaces, HookContext>({});

// Schema for allowed query properties
export const workspacesQueryProperties = Type.Pick(workspacesSchema, ['id', 'name', 'slug']);
export const workspacesQuerySchema = Type.Intersect(
  [
    querySyntax(workspacesQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false }),
  ],
  { additionalProperties: false },
);
export type WorkspacesQuery = Static<typeof workspacesQuerySchema>;
export const workspacesQueryValidator = getValidator(workspacesQuerySchema, queryValidator);
export const workspacesQueryResolver = resolve<WorkspacesQuery, HookContext>({});
