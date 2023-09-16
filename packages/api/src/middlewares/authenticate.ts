import type { AuthSessionWithUserAndWorkspaces } from '../schema';
import type { AppAbility } from '../utils/permissions';

import { AbilityBuilder } from '@casl/ability';
import { createPrismaAbility } from '@casl/prisma';

import { ctx as context } from '../context';
import { env } from '../env';
import { errors } from '../errors';
import { middleware } from '../trpc';
import { checkPermission, getPrismaFilter } from '../utils/permissions';

const defineAbilitiesFor = (session: AuthSessionWithUserAndWorkspaces) => {
  const { can, build } = new AbilityBuilder<AppAbility>(createPrismaAbility);

  const { user, workspaces } = session;

  can('read', 'User', { id: user.id });
  can('update', 'User', { id: user.id });

  if (env.WORKSPACE_ALLOW_PUBLIC_CREATION) {
    can('create', 'Workspace');
  }

  // const ownerWorkspaceIds = workspaces.filter((w) => w.role === 'owner').map((w) => w.id);
  const adminWorkspaceIds = workspaces
    .filter((w) => ['owner', 'admin'].includes(w.role))
    .map((w) => w.id);
  const allWorkspaceIds = workspaces.map((w) => w.id);

  can('read', 'Workspace', { id: { in: allWorkspaceIds } });
  can('update', 'Workspace', { id: { in: adminWorkspaceIds } });

  can('read', 'WorkspaceUser', { workspaceId: { in: allWorkspaceIds } });
  can('update', 'WorkspaceUser', ['role', 'suspended'], {
    workspaceId: { in: adminWorkspaceIds },
    userId: { not: user.id },
    role: { notIn: ['owner'] },
  });

  can('manage', 'WorkspaceUserInvite', { workspaceId: { in: adminWorkspaceIds } });

  can('listen', 'Events_OnWorkspaceActivity', { workspaceId: { in: allWorkspaceIds } });

  can('read', 'Document', { workspaceId: { in: allWorkspaceIds } });
  can('create', 'Document', { workspaceId: { in: allWorkspaceIds } });
  can('update', 'Document', { workspaceId: { in: allWorkspaceIds } });

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
          getPrismaFilter: getPrismaFilter(casl),
        },
      },
    });
  } catch (e) {
    throw errors.unauthorized();
  }
});
