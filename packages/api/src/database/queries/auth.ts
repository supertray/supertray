import type { AuthSessionWithUserAndWorkspaces, WorkspaceUser } from '../../schema';
import type { JwtPayload } from 'jsonwebtoken';

import { prisma } from '..';
import { verifyAccessToken } from '../../utils';

const emptyResponse = {
  session: undefined,
  jwt: undefined,
};

type SessionByAccessTokenResponse =
  | {
      session: undefined;
      jwt: undefined;
    }
  | {
      session: AuthSessionWithUserAndWorkspaces;
      jwt: JwtPayload;
    };

export const getSessionByAccessToken = async (
  accessToken: string,
  ignoreExpiration?: boolean,
): Promise<SessionByAccessTokenResponse> => {
  const jwt = verifyAccessToken(accessToken, ignoreExpiration);
  if (!jwt.jti) {
    return emptyResponse;
  }
  const session = await prisma.session.findUnique({
    where: {
      id: jwt.jti,
    },
    include: {
      user: {
        include: {
          workspaceUsers: {
            include: {
              workspace: true,
            },
          },
        },
      },
    },
  });
  if (!session) return emptyResponse;
  const workspaces = session.user.workspaceUsers.map((wu) => ({
    ...wu.workspace,
    role: wu.role as WorkspaceUser['role'],
  }));
  const user = {
    ...session.user,
    workspaceUsers: undefined,
  };
  if (!session.expiresAt || session.expiresAt.getTime() < Date.now()) {
    await prisma.session.delete({
      where: {
        id: session.id,
      },
    });
    return emptyResponse;
  }
  return {
    session: {
      ...session,
      user,
      workspaces,
    },
    jwt,
  };
};

export const deleteExpiredSessionsByUserId = async (userId: string) => {
  await prisma.session.deleteMany({
    where: {
      userId,
      expiresAt: {
        lt: new Date(),
      },
    },
  });
};
