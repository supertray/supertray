import type { Workspace, WorkspaceUser } from '../../schema';
import type { Knex } from 'knex';

import { database } from '..';

export const listWorkspacesByUserId = async (userId: string, trx?: Knex.Transaction) => {
  const workspaces: (Workspace & { role: WorkspaceUser['role'] })[] = await (trx || database)
    .table('supertray_workspaces')
    .select('supertray_workspaces.*', 'supertray_workspace_users.role as role')
    .join(
      'supertray_workspace_users',
      'supertray_workspaces.id',
      'supertray_workspace_users.workspaceId',
    )
    .where('supertray_workspace_users.userId', userId)
    .where('supertray_workspace_users.suspended', false);
  return workspaces;
};

export const getWorkspaceById = async (id: string, trx?: Knex.Transaction) => {
  const workspace = await (trx || database)
    .table('supertray_workspaces')
    .select('*')
    .where('id', id)
    .first();
  return workspace;
};
