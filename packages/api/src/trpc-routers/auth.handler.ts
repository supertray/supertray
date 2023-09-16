import type { WorkspaceUser } from './workspace-users.schema';
import type { ReadableTime } from '../utils';
import type { IncomingMessage } from 'http';

import {
  authAuthenticateSchema,
  authLoginSchema,
  authRefreshSchema,
  authSendLoginSchema,
} from './auth.schema';
import { userCreateSchema } from './users.schema';
import { errors } from '../errors';
import { publicProcedure } from '../procedures';
import { router } from '../trpc';
import {
  createAccessToken,
  createUuid,
  futureUtcMilliseconds,
  readableTimeToMilliseconds,
  wait,
} from '../utils';

const otpRateLimiter = new Map<string, number>();

const createEmailToken = (expiresIn: ReadableTime) => {
  let now = Date.now().toString().slice(-3);
  if (now[0] === '0') {
    now = `1${now.slice(1)}`;
  }
  // a 8 digit number starting with a non-zero digit
  const emailToken = [Math.floor(Math.random() * 100000).toString(), now].join('');
  const expiration = futureUtcMilliseconds(expiresIn);
  return {
    emailToken,
    expiration,
  };
};

const getHeaders = (req?: IncomingMessage) => {
  return {
    ipAddress: (req?.headers['x-real-ip'] as string | undefined) || undefined,
    userAgent: req?.headers['user-agent'] || undefined,
    origin: req?.headers.origin || undefined,
  };
};

export const authRouter = router({
  signup: publicProcedure.input(userCreateSchema).mutation(async ({ input, ctx }) => {
    const user = await ctx.db.queries.users.getByEmail(input.email);
    await wait(2000);
    if (user) {
      throw errors.badRequest('Email not available');
    }
    try {
      const newUserData = await ctx.db.prisma.$transaction(async (trxClient) => {
        const newUser = await trxClient.user.create({
          data: {
            email: input.email,
            firstName: input.firstName,
            lastName: input.lastName,
          },
        });
        const workspaceUserInvites =
          await ctx.db.queries.workspaceUsers.getWorkspaceUserInvitesByEmail(
            input.email,
            trxClient,
          );
        if (workspaceUserInvites.length > 0) {
          await ctx.db.queries.workspaceUsers.insertWorkspaceUserByInvites(
            workspaceUserInvites.map((wi) => {
              return {
                ...wi,
                role: wi.role as WorkspaceUser['role'],
              };
            }),
            newUser.id,
            trxClient,
          );
          await ctx.db.queries.workspaceUsers.deleteWorkspaceUserInvitesByIds(
            workspaceUserInvites.map((i) => i.id),
            trxClient,
          );
        }
        return newUser;
      });
      return newUserData;
    } catch (e) {
      ctx.logger.error(e);
      throw errors.internalServerError();
    }
  }),
  sendOtp: publicProcedure.input(authSendLoginSchema).mutation(async ({ input, ctx }) => {
    const user = await ctx.db.queries.users.getByEmail(input.email);
    if (!user) {
      throw errors.unauthorized();
    }
    const lastSentOtp = otpRateLimiter.get(input.email);
    const diff = Date.now() - readableTimeToMilliseconds('30s');
    if (lastSentOtp && lastSentOtp > diff) {
      throw errors.tooManyRequests(`${Math.ceil((lastSentOtp - diff) / 1000)}s`);
    }
    const { emailToken, expiration } = createEmailToken(ctx.env.AUTH_OTP_EXPIRES_IN);
    await ctx.db.prisma.loginToken.create({
      data: {
        userId: user.id,
        token: emailToken,
        expiresAt: new Date(expiration),
      },
    });
    await ctx.mailer.send({
      to: input.email,
      subject: 'Your OTP',
      html: `Your OTP is <strong>${emailToken}</strong>.`,
    });
    otpRateLimiter.set(input.email, Date.now());
    return true;
  }),
  login: publicProcedure.input(authLoginSchema).mutation(async ({ input, ctx }) => {
    const loginToken = await ctx.db.queries.users.getValidOtpByEmail(input.email, input.otp);
    if (!loginToken) {
      throw errors.unauthorized();
    }
    const { id, accessToken, expiration, refreshToken, refreshTokenExpiration } = createAccessToken(
      loginToken.userId,
    );
    await ctx.db.prisma.$transaction([
      ctx.db.prisma.loginToken.delete({
        where: {
          id: loginToken.id,
        },
      }),
      ctx.db.prisma.session.create({
        data: {
          id,
          userId: loginToken.userId,
          token: refreshToken,
          expiresAt: new Date(refreshTokenExpiration),
          ...getHeaders(ctx.req),
        },
      }),
    ]);
    return {
      accessToken,
      refreshToken,
      expiresAt: expiration,
      refreshTokenExpiresAt: refreshTokenExpiration,
      user: loginToken.user,
    };
  }),
  authenticate: publicProcedure.input(authAuthenticateSchema).mutation(async ({ input, ctx }) => {
    const { session, jwt } = await ctx.db.queries.auth.getSessionByAccessToken(input.accessToken);
    if (!session || !jwt.exp) {
      throw errors.unauthorized();
    }
    await ctx.db.queries.auth.deleteExpiredSessionsByUserId(session.userId);
    if (ctx.ws) {
      // Set the access token on the websocket connection
      ctx.ws.accessToken = input.accessToken;
    }
    return {
      accessToken: input.accessToken,
      expiresAt: jwt.exp * 1000,
      user: session.user,
    };
  }),
  refresh: publicProcedure.input(authRefreshSchema).mutation(async ({ input, ctx }) => {
    const { session, jwt } = await ctx.db.queries.auth.getSessionByAccessToken(
      input.accessToken,
      true,
    );
    if (!session || !jwt.exp) {
      throw errors.unauthorized();
    }
    if (session.token !== input.refreshToken) {
      await ctx.db.queries.auth.deleteExpiredSessionsByUserId(session.userId);
      await ctx.db.prisma.session.delete({
        where: {
          id: session.id,
        },
      });
      throw errors.unauthorized();
    }
    const nextSessionId = createUuid();
    const { accessToken, expiration, refreshToken, refreshTokenExpiration } = createAccessToken(
      session.user.id,
      nextSessionId,
    );
    await ctx.db.prisma.session.update({
      where: {
        id: session.id,
      },
      data: {
        id: nextSessionId,
        token: refreshToken,
        expiresAt: new Date(refreshTokenExpiration),
        ...getHeaders(ctx.req),
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresAt: expiration,
      refreshTokenExpiresAt: refreshTokenExpiration,
      user: session.user,
    };
  }),
});
