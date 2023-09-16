import type { CaslAbilities } from '../schema';
import type { Models } from '../types';
import type { PureAbility } from '@casl/ability';
import type { PrismaQuery, Subjects, WhereInput } from '@casl/prisma';
import type {
  Prisma,
  Document,
  User,
  Workspace,
  WorkspaceUser,
  WorkspaceUserInvite,
} from '@prisma/client';

import { subject as caslSubject } from '@casl/ability';
// import { rulesToQuery } from '@casl/ability/extra';
import { accessibleBy } from '@casl/prisma';

import { errors } from '../errors';

export type AppAbility = PureAbility<
  [
    string,
    Subjects<{
      User: User;
      Workspace: Workspace;
      WorkspaceUser: WorkspaceUser;
      Document: Document;
      WorkspaceUserInvite: WorkspaceUserInvite;
      Events_OnWorkspaceActivity: {
        workspaceId: string;
      };
    }>,
  ],
  PrismaQuery
>;

export function checkPermission(abilities: CaslAbilities | null) {
  return <T extends Record<string, unknown>>(action: string, subject: string, value?: T) => {
    const allowed = abilities?.can(action, caslSubject(subject, value || {}));
    if (!allowed) {
      throw errors.forbidden();
    }
  };
}

export const abilityToPrismaFilter = (
  ability: AppAbility,
  action: string,
  modelName: Prisma.ModelName,
) => {
  return accessibleBy(ability, action)[modelName];
};

export const getPrismaFilter = (ability: AppAbility) => {
  return <Model extends Models>(action: string, modelName: Model) =>
    abilityToPrismaFilter(ability, action, modelName) as WhereInput<Model>;
};
