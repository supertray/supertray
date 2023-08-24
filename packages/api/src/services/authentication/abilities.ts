// src/services/authentication/authentication.abilities.ts
import type { Application } from '../../declarations';
import type { User } from '../users/users.schema';
import type { WorkspaceUsers } from '../workspace-users/workspace-users.schema';

import { createMongoAbility, AbilityBuilder, createAliasResolver } from '@casl/ability';

// don't forget this, as `read` is used internally
const resolveAction = createAliasResolver({
  update: 'patch', // define the same rules for update & patch
  read: ['get', 'find'], // use 'read' as a equivalent for 'get' & 'find'
  delete: 'remove', // use 'delete' or 'remove'
});

type AuthenticatedUser = User & {
  workspaces?: WorkspaceUsers[];
};

export const defineRulesFor = (user: AuthenticatedUser, app: Application) => {
  // also see https://casl.js.org/v6/en/guide/define-rules
  const { can, rules } = new AbilityBuilder(createMongoAbility);

  if (!user.isVerified) return rules;

  can('read', 'users', { id: user.id });
  can('update', 'users', { id: user.id });
  can('read', 'sessions', { userId: user.id });
  can('update', 'sessions', { userId: user.id });
  can('remove', 'sessions', { userId: user.id });

  if (!user.workspaces) {
    return rules;
  }

  const workspaceIds = user.workspaces
    .filter((w) => w.isActive)
    .map((workspace) => workspace.workspaceId);
  const workspaceIdsAsAdmin = user.workspaces
    .filter((workspace) => workspace.isActive && !workspace.isOwner && workspace.isAdmin)
    .map((workspace) => workspace.workspaceId);
  const workspaceIdsAsOwner = user.workspaces
    .filter((workspace) => workspace.isOwner && workspace.isActive)
    .map((workspace) => workspace.workspaceId);

  can('read', 'workspaces', { id: { $in: workspaceIds } });
  can('update', 'workspaces', { id: { $in: workspaceIdsAsAdmin.concat(workspaceIdsAsOwner) } });
  can('read', 'workspace-users', { workspaceId: { $in: workspaceIds } });
  can('update', 'workspace-users', ['isActive'], { workspaceId: { $in: workspaceIdsAsAdmin } });
  can('update', 'workspace-users', ['isActive', 'isAdmin', 'isOwner'], {
    workspaceId: { $in: workspaceIdsAsOwner },
  });

  return rules;
};

export const defineAbilitiesFor = (user: AuthenticatedUser, app: Application) => {
  const rules = defineRulesFor(user, app);

  return createMongoAbility(rules, { resolveAction });
};
