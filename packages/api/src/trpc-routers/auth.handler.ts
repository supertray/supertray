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

const getHeaders = (req: IncomingMessage) => {
  return {
    ipAddress: req.headers['x-real-ip'] || undefined,
    userAgent: req.headers['user-agent'] || undefined,
    origin: req.headers.origin || undefined,
  };
};

export const authRouter = router({
  signup: publicProcedure.input(userCreateSchema).mutation(async ({ input, ctx }) => {
    const user = await ctx.db.queries.users.getByEmail(input.email);
    await wait(2000);
    if (user) {
      throw errors.badRequest('Email not available');
    }
    const trx = await ctx.db.client.transaction();
    try {
      const [newUser] = await ctx.db.client
        .table('supertray_users')
        .insert({
          email: input.email,
          firstName: input.firstName,
          lastName: input.lastName,
        })
        .transacting(trx)
        .returning('*');
      const workspaceUserInvites =
        await ctx.db.queries.workspaceUsers.getWorkspaceUserInvitesByEmail(input.email, trx);
      if (workspaceUserInvites.length > 0) {
        await ctx.db.queries.workspaceUsers.insertWorkspaceUserByInvites(
          workspaceUserInvites,
          newUser.id,
          trx,
        );
        await ctx.db.queries.workspaceUsers.deleteWorkspaceUserInvitesByIds(
          workspaceUserInvites.map((i) => i.id),
          trx,
        );
      }
      await trx.commit();
      return newUser;
    } catch (e) {
      await trx.rollback();
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
    await ctx.db.client.table('supertray_login_tokens').insert({
      userId: user.id,
      token: emailToken,
      expiresAt: new Date(expiration),
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
    await ctx.db.client.transaction(async (trx) => {
      try {
        await trx.table('supertray_login_tokens').where('id', loginToken.id).delete();
        await trx.table('supertray_sessions').insert({
          id,
          userId: loginToken.userId,
          token: refreshToken,
          expiresAt: new Date(refreshTokenExpiration),
          ...getHeaders(ctx.req),
        });
        await trx.commit();
      } catch (e) {
        await trx.rollback();
        throw e;
      }
    });
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
      await ctx.db.client.table('supertray_sessions').where('id', session.id).delete();
      throw errors.unauthorized();
    }
    const { accessToken, expiration, refreshToken, refreshTokenExpiration } = createAccessToken(
      session.user.id,
      session.id,
    );
    await ctx.db.client
      .table('supertray_sessions')
      .where('id', session.id)
      .update({
        token: refreshToken,
        expiresAt: new Date(refreshTokenExpiration),
        ...getHeaders(ctx.req),
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
