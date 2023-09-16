import { prisma } from '..';

export const getById = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id,
    },
  });
  return user;
};

export const getByEmail = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });
  return user;
};

export const getValidOtpByEmail = async (email: string, otp: string) => {
  const loginToken = await prisma.loginToken.findFirst({
    where: {
      token: otp,
      user: {
        email,
      },
    },
    include: {
      user: true,
    },
  });
  if (!loginToken) {
    return undefined;
  }
  if (loginToken.expiresAt.getTime() < new Date().getTime()) {
    await prisma.loginToken.delete({
      where: {
        id: loginToken.id,
      },
    });
    return undefined;
  }
  return loginToken;
};
