import type { PrismaTransactionClient } from '..';
import type { WorkspaceUserInvite } from '../../schema';
import type { Prisma } from '@prisma/client';

import { prisma } from '..';

export const getWorkspaceUserById = async (id: string) => {
  const workspaceUser = await prisma.workspaceUser.findUnique({
    where: {
      id,
    },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });
  return workspaceUser;
};

export const getWorkspaceUserInviteById = async (id: string, trx?: PrismaTransactionClient) => {
  const workspaceUserInvite = await (trx || prisma).workspaceUserInvite.findUnique({
    where: {
      id,
    },
    include: {
      workspace: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
  return workspaceUserInvite;
};

export const getWorkspaceUserInvitesByEmail = async (
  email: string,
  trx?: PrismaTransactionClient,
) => {
  const workspaceUserInvites = await (trx || prisma).workspaceUserInvite.findMany({
    where: {
      email,
    },
    include: {
      workspace: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
  return workspaceUserInvites;
};

export const insertWorkspaceUserByInvites = async (
  invites: WorkspaceUserInvite[],
  userId: string,
  trx?: PrismaTransactionClient,
) => {
  const prismaClient = trx || prisma;
  await prismaClient.workspaceUser.createMany({
    data: invites.map((invite) => ({
      id: invite.id,
      workspaceId: invite.workspaceId,
      userId,
      role: invite.role,
      suspended: false,
    })),
  });
  await prismaClient.workspaceUserInvite.deleteMany({
    where: {
      id: {
        in: invites.map((invite) => invite.id),
      },
    },
  });
  const workspaceUsers = await prismaClient.workspaceUser.findMany({
    where: {
      id: {
        in: invites.map((invite) => invite.id),
      },
    },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });
  return workspaceUsers;
};

export const deleteWorkspaceUserInvitesByIds = async (
  ids: string[],
  trx?: PrismaTransactionClient,
) => {
  await (trx || prisma).workspaceUserInvite.deleteMany({
    where: {
      id: {
        in: ids,
      },
    },
  });
};

export const list = (where?: Prisma.WorkspaceUserFindManyArgs['where']) => {
  return prisma.workspaceUser.findMany({
    where,
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });
};
