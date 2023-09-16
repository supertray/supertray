import { prisma } from '..';

export const listWorkspacesByUserId = async (userId: string) => {
  const workspaces = await prisma.workspace.findMany({
    where: {
      workspaceUsers: {
        some: {
          userId,
          suspended: false,
        },
      },
    },
    include: {
      workspaceUsers: {
        where: {
          userId,
          suspended: false,
        },
        select: {
          role: true,
        },
      },
    },
  });
  return workspaces;
};

export const getWorkspaceById = async (id: string) => {
  const workspace = await prisma.workspace.findUnique({
    where: {
      id,
    },
  });
  return workspace;
};
