import type { AuthSessionWithUserAndWorkspaces } from '../schema';

import { AbilityBuilder, createMongoAbility } from '@casl/ability';

import { env } from '../env';
import { errors } from '../errors';
import { middleware } from '../trpc';
import { getPermissionsQuery } from '../utils';
import { checkPermission } from '../utils/permissions';

const defineAbilitiesFor = (session: AuthSessionWithUserAndWorkspaces) => {
  const { can, build } = new AbilityBuilder(createMongoAbility);

  const { user, workspaces } = session;

  can('read', 'user', { id: user.id });
  can('update', 'user', { id: user.id });

  if (env.WORKSPACE_ALLOW_PUBLIC_CREATION) {
    can('create', 'workspace');
  }

  const ownerWorkspaceIds = workspaces.filter((w) => w.role === 'owner').map((w) => w.id);
  const adminWorkspaceIds = workspaces
    .filter((w) => ['owner', 'admin'].includes(w.role))
    .map((w) => w.id);
  const allWorkspaceIds = workspaces.map((w) => w.id);

  can('read', 'workspace', { id: { $in: allWorkspaceIds } });
  can('update', 'workspace', { id: { $in: adminWorkspaceIds } });

  can('read', 'workspaceUser', { workspaceId: { $in: allWorkspaceIds } });
  can('update', 'workspaceUser', ['role', 'suspended'], {
    $or: [
      {
        workspaceId: { $in: adminWorkspaceIds },
        role: { $nin: ['owner'] },
      },
      {
        workspaceId: { $in: ownerWorkspaceIds },
        userId: { $ne: user.id },
      },
    ],
  });

  can('manage', 'workspaceUserInvite', { workspaceId: { $in: adminWorkspaceIds } });

  return build();
};

export const authenticate = middleware(async ({ ctx, next }) => {
  let bearerToken = ctx.req.headers.authorization;
  const webSocketAccessToken = ctx.ws?.accessToken;
  if (webSocketAccessToken) {
    bearerToken = `Bearer ${webSocketAccessToken}`;
  }
  if (!bearerToken || !(typeof bearerToken === 'string') || !bearerToken.startsWith('Bearer ')) {
    throw errors.unauthorized();
  }
  const token = bearerToken.split(' ')[1];
  if (!token) {
    throw errors.unauthorized();
  }
  try {
    const { session, jwt } = await ctx.db.queries.auth.getSessionByAccessToken(token);
    if (!session || !jwt.exp) {
      throw errors.unauthorized();
    }
    const casl = defineAbilitiesFor(session);
    return await next({
      ctx: {
        ...ctx,
        session,
        abilities: {
          casl,
          can: checkPermission(casl),
          getPermissionsQuery: getPermissionsQuery(casl),
        },
      },
    });
  } catch (e) {
    throw errors.unauthorized();
  }
});
