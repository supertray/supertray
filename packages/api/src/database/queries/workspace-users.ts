import type { WorkspaceUserInvite } from '../../schema';
import type { Knex } from 'knex';

import { database } from '..';

export const getWorkspaceUserById = async (id: string, trx?: Knex.Transaction) => {
  const workspaceUser = await (trx || database)
    .table('supertray_workspace_users')
    .select('*')
    .where('id', id)
    .first();
  return workspaceUser;
};

export const getWorkspaceUserInviteById = async (id: string, trx?: Knex.Transaction) => {
  const workspaceUserInvite: (WorkspaceUserInvite & { workspaceName: string }) | undefined = await (
    trx || database
  )
    .table('supertray_workspace_user_invites')
    .select('supertray_workspace_user_invites.*', 'supertray_workspaces.name as workspaceName')
    .where('supertray_workspace_user_invites.id', id)
    .join(
      'supertray_workspaces',
      'supertray_workspace_user_invites.workspaceId',
      'supertray_workspaces.id',
    )
    .first();
  return workspaceUserInvite;
};

export const getWorkspaceUserInvitesByEmail = (email: string, trx?: Knex.Transaction) => {
  return (trx || database)
    .table('supertray_workspace_user_invites')
    .select('*')
    .where('supertray_workspace_user_invites.email', email);
};

export const insertWorkspaceUserByInvites = async (
  invites: WorkspaceUserInvite[],
  userId: string,
  trx?: Knex.Transaction,
) => {
  const workspaceUsers = await (trx || database)
    .table('supertray_workspace_users')
    .insert(
      invites.map((invite) => ({
        id: invite.id,
        workspaceId: invite.workspaceId,
        userId,
        role: invite.role,
        suspended: false,
      })),
    )
    .returning('*');
  await (trx || database)
    .table('supertray_workspace_user_invites')
    .whereIn(
      'id',
      invites.map((invite) => invite.id),
    )
    .delete();
  return workspaceUsers;
};

export const deleteWorkspaceUserInvitesByIds = async (ids: string[], trx?: Knex.Transaction) => {
  await (trx || database).table('supertray_workspace_user_invites').whereIn('id', ids).delete();
};
