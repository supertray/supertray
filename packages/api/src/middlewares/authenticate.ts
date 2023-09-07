import type { AuthSessionWithUserAndWorkspaces } from '../schema';

import { AbilityBuilder, createMongoAbility } from '@casl/ability';

import { ctx as context } from '../context';
import { env } from '../env';
import { errors } from '../errors';
import { middleware } from '../trpc';
import { getPermissionsQuery } from '../utils';
import { applyPermissionQueryToKnex, checkPermission } from '../utils/permissions';

const defineAbilitiesFor = (session: AuthSessionWithUserAndWorkspaces) => {
  const { can, build } = new AbilityBuilder(createMongoAbility);

  const { user, workspaces } = session;

  can('read', 'user', { id: user.id });
  can('update', 'user', { id: user.id });

  if (env.WORKSPACE_ALLOW_PUBLIC_CREATION) {
    can('create', 'workspace');
  }

  // const ownerWorkspaceIds = workspaces.filter((w) => w.role === 'owner').map((w) => w.id);
  const adminWorkspaceIds = workspaces
    .filter((w) => ['owner', 'admin'].includes(w.role))
    .map((w) => w.id);
  const allWorkspaceIds = workspaces.map((w) => w.id);

  can('read', 'workspace', { id: { $in: allWorkspaceIds } });
  can('update', 'workspace', { id: { $in: adminWorkspaceIds } });

  can('read', 'workspaceUser', { workspaceId: { $in: allWorkspaceIds } });
  can('update', 'workspaceUser', ['role', 'suspended'], {
    workspaceId: { $in: adminWorkspaceIds },
    userId: { $ne: user.id },
    role: { $nin: ['owner'] },
  });

  can('manage', 'workspaceUserInvite', { workspaceId: { $in: adminWorkspaceIds } });

  can('listen', 'events.onWorkspaceActivity', { workspaceId: { $in: allWorkspaceIds } });

  can('read', 'documents', { workspaceId: { $in: allWorkspaceIds } });
  can('create', 'documents', { workspaceId: { $in: allWorkspaceIds } });
  can('update', 'documents', { workspaceId: { $in: allWorkspaceIds } });

  return build();
};

export const authenticateToken = async (headerToken?: string, wsToken?: string) => {
  let bearerToken = headerToken;
  if (wsToken) {
    bearerToken = `Bearer ${wsToken}`;
  }
  if (!bearerToken || !(typeof bearerToken === 'string') || !bearerToken.startsWith('Bearer ')) {
    throw errors.unauthorized();
  }
  const token = bearerToken.split(' ')[1];
  if (!token) {
    throw errors.unauthorized();
  }
  try {
    const { session, jwt } = await context.db.queries.auth.getSessionByAccessToken(token);
    if (!session || !jwt.exp) {
      throw errors.unauthorized();
    }
    const casl = defineAbilitiesFor(session);
    return {
      casl,
      session,
    };
  } catch (e) {
    throw errors.unauthorized();
  }
};

export const authenticate = middleware(async ({ ctx, next }) => {
  try {
    const { casl, session } = await authenticateToken(
      ctx.req?.headers.authorization,
      ctx.ws?.accessToken,
    );
    return await next({
      ctx: {
        ...ctx,
        session,
        abilities: {
          casl,
          can: checkPermission(casl),
          getPermissionsQuery: getPermissionsQuery(casl),
          applyPermissionQuery: applyPermissionQueryToKnex,
        },
      },
    });
  } catch (e) {
    throw errors.unauthorized();
  }
});
