import type { AuthSessionWithUserAndWorkspaces, Session, User, WorkspaceUser } from '../../schema';
import type { Knex } from 'knex';

import { listWorkspacesByUserId } from './workspaces';
import { database } from '..';
import { verifyAccessToken } from '../../utils';

const emptyResponse = {
  session: undefined,
  jwt: undefined,
};

export const getSessionByAccessToken = async (
  accessToken: string,
  ignoreExpiration?: boolean,
  trx?: Knex.Transaction,
) => {
  const jwt = verifyAccessToken(accessToken, ignoreExpiration);
  if (!jwt.jti) {
    return emptyResponse;
  }
  const session: AuthSessionWithUserAndWorkspaces | undefined = await (trx || database)
    .table('supertray_sessions')
    .select(['supertray_sessions.*', (trx || database).raw('to_json(supertray_users.*) as user')])
    .where('supertray_sessions.id', jwt.jti)
    .join('supertray_users', 'supertray_sessions.userId', 'supertray_users.id')
    .first();
  if (!session) return emptyResponse;
  session.workspaces = await listWorkspacesByUserId(session.userId, trx);
  if (new Date(session.expiresAt).getTime() < Date.now()) {
    await (trx || database).table('supertray_sessions').where('id', session.id).delete();
    return emptyResponse;
  }
  return {
    session,
    jwt,
  };
};

export const deleteExpiredSessionsByUserId = async (userId: string, trx?: Knex.Transaction) => {
  await (trx || database)
    .table('supertray_sessions')
    .where('userId', userId)
    .andWhere('expiresAt', '<', new Date())
    .delete();
};
