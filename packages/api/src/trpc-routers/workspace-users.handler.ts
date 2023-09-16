import type { WorkspaceUser } from './workspace-users.schema';

import {
  workspaceUserInviteCreateSchema,
  workspaceUserInviteReadSchema,
  workspaceUserQuerySchema,
  workspaceUserUpdateSchema,
} from './workspace-users.schema';
import { authProcedure, publicProcedure } from '../procedures';
import { router } from '../trpc';
import {
  createUuid,
  decryptString,
  encryptString,
  futureUtcMilliseconds,
  readableTimeToMilliseconds,
} from '../utils';

const sendMassMailRateLimiter = new Map<string, number>();

const encryptInviteData = (id: string, expiresAt: number) => {
  return encryptString(`${id}--${expiresAt}`);
};

const decryptInviteData = (encrypted: string) => {
  const decrypted = decryptString(encrypted);
  if (!decrypted) {
    return undefined;
  }
  const [id, expiresAt] = decrypted.split('--');
  return {
    id,
    expiresAt: parseInt(expiresAt, 10),
  };
};

export const workspaceUserRouter = router({
  list: authProcedure.input(workspaceUserQuerySchema).query(async ({ ctx, input }) => {
    const { workspaceId, ...query } = input;
    ctx.abilities.can('read', 'WorkspaceUser', { workspaceId, ...query });
    const workspaceUsers = await ctx.db.queries.workspaceUsers.list({
      AND: [query, { workspaceId }],
    });
    return workspaceUsers;
  }),
  update: authProcedure.input(workspaceUserUpdateSchema).mutation(async ({ ctx, input }) => {
    const { id, ...payload } = input;
    const workspaceUser = await ctx.db.queries.workspaceUsers.getWorkspaceUserById(id);
    if (!workspaceUser || !workspaceUser.user) {
      throw ctx.errors.forbidden();
    }
    ctx.abilities.can('update', 'WorkspaceUser', {
      workspaceId: workspaceUser.workspaceId,
      role: workspaceUser.role,
    });
    const updatedWorkspaceUser = await ctx.db.prisma.workspaceUser.update({
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
      data: {
        role: payload.role || workspaceUser.role,
        suspended: payload.suspended ?? workspaceUser.suspended,
      },
    });
    const { user } = updatedWorkspaceUser;
    if (!user) {
      throw ctx.errors.forbidden();
    }
    ctx.ee.emit.workspaceActivity({
      workspaceId: workspaceUser.workspaceId,
      createdBy: ctx.session.user.id,
      action: 'update',
      on: 'workspace-user',
      payload: {
        ...updatedWorkspaceUser,
        user,
        role: updatedWorkspaceUser.role as WorkspaceUser['role'],
      },
    });
    return updatedWorkspaceUser;
  }),
  invite: authProcedure.input(workspaceUserInviteCreateSchema).mutation(async ({ ctx, input }) => {
    const { workspaceId, ...payload } = input;
    ctx.abilities.can('manage', 'WorkspaceUserInvite', { workspaceId });
    const existingUsers = await ctx.db.prisma.user.findMany({
      where: {
        email: {
          in: input.emails,
        },
      },
      select: {
        id: true,
        email: true,
      },
    });
    const newInvites = input.emails
      .filter((email) => !existingUsers.some((u) => u.email === email))
      .map((email) => ({
        id: createUuid(),
        workspaceId,
        email,
        role: payload.role,
      }));
    const newWorkspaceUsers = existingUsers.map((u) => ({
      workspaceId,
      userId: u.id,
      role: payload.role,
    }));
    const lastSentMassMail = sendMassMailRateLimiter.get(workspaceId);
    const rateLimitDiff = Date.now() - readableTimeToMilliseconds('1m');
    if (lastSentMassMail && lastSentMassMail < rateLimitDiff) {
      throw ctx.errors.tooManyRequests(`${Math.ceil((lastSentMassMail - rateLimitDiff) / 1000)}s`);
    }
    if (newInvites.length > 5) {
      sendMassMailRateLimiter.set(workspaceId, Date.now());
    }
    const workspace = await ctx.db.queries.workspaces.getWorkspaceById(workspaceId);
    if (!workspace) {
      throw ctx.errors.forbidden();
    }
    try {
      await ctx.db.prisma.$transaction([
        ctx.db.prisma.workspaceUserInvite.createMany({
          data: newInvites,
        }),
        ctx.db.prisma.workspaceUser.createMany({
          data: newWorkspaceUsers,
        }),
      ]);
    } catch (e) {
      sendMassMailRateLimiter.delete(workspaceId);
      ctx.logger.error(e);
      throw e;
    }
    const invitesExpiresAt = futureUtcMilliseconds(ctx.env.AUTH_INVITES_EXPIRES_IN) / 1000;
    ctx.mailer.sendMultipleInBackground(
      newInvites
        .map((invite) => ({
          to: invite.email,
          subject: 'You have been invited to Supertray',
          html: `You have been invited by ${ctx.session.user.firstName} ${
            ctx.session.user.lastName
          } to Workspace ${workspace.name} on Supertray. <a href="${
            ctx.env.WEB_APP_URL
          }/accept-invite?code=${encryptInviteData(
            invite.id,
            invitesExpiresAt,
          )}">Click here to accept the invite</a>.`.trim(),
        }))
        .concat(
          existingUsers.map((user) => ({
            to: user.email,
            subject: 'You have been added to a Workspace on Supertray',
            html: `You have been added to Workspace ${workspace.name} on Supertray by ${ctx.session.user.firstName} ${ctx.session.user.lastName}. <a href="${ctx.env.WEB_APP_URL}">Click here to login</a>.`.trim(),
          })),
        ),
    );
  }),
  readInvite: publicProcedure.input(workspaceUserInviteReadSchema).query(async ({ ctx, input }) => {
    const { code } = input;
    try {
      const decrypted = decryptInviteData(code);
      if (!decrypted || decrypted.expiresAt < Date.now() / 1000) {
        throw ctx.errors.forbidden();
      }
      const invite = await ctx.db.queries.workspaceUsers.getWorkspaceUserInviteById(decrypted.id);
      if (!invite) {
        throw ctx.errors.notFound();
      }
      return invite;
    } catch (e) {
      ctx.logger.error(e);
      throw e;
    }
  }),
});
