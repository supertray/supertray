import type {
  Document,
  LoginToken,
  User,
  Workspace,
  WorkspaceUser,
  WorkspaceUserInvite,
} from '../schema';

import knex from 'knex';

import { config } from '../knex';

export const database = knex(config);

declare module 'knex/types/tables' {
  interface Tables {
    supertray_users: User;
    supertray_login_tokens: LoginToken;
    supertray_workspaces: Workspace;
    supertray_workspace_users: WorkspaceUser;
    supertray_workspace_user_invites: WorkspaceUserInvite;
    supertray_documents: Document;
  }
}
