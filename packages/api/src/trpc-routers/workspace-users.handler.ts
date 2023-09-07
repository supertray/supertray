import type { WorkspaceUser, WorkspaceUserWithName } from './workspace-users.schema';

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
  mongoToKnexQuery,
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
    ctx.abilities.can('read', 'workspaceUser', { workspaceId, ...query });
    const workspaceUsers: (WorkspaceUser & {
      firstName: string;
      lastName: string;
      email: string;
    })[] = await ctx.db.queries.workspaceUsers
      .list()
      .where('workspaceId', workspaceId)
      .andWhere((qb) => mongoToKnexQuery(qb, query, 'supertray_workspace_users'));
    return workspaceUsers;
  }),
  update: authProcedure.input(workspaceUserUpdateSchema).mutation(async ({ ctx, input }) => {
    const { id, ...payload } = input;
    const workspaceUser = await ctx.db.queries.workspaceUsers.getWorkspaceUserById(id);
    if (!workspaceUser) {
      throw ctx.errors.forbidden();
    }
    ctx.abilities.can('update', 'workspaceUser', {
      workspaceId: workspaceUser.workspaceId,
      role: workspaceUser.role,
    });
    const [updatedWorkspaceUser] = await ctx.db.client
      .table('supertray_workspace_users')
      .where('id', id)
      .update({
        role: payload.role || workspaceUser.role,
        suspended: payload.suspended ?? workspaceUser.suspended,
        updatedAt: new Date(),
      })
      .returning('*');
    const result: WorkspaceUserWithName = {
      ...updatedWorkspaceUser,
      firstName: workspaceUser.firstName,
      lastName: workspaceUser.lastName,
      email: workspaceUser.email,
    };
    ctx.ee.emit.workspaceActivity({
      workspaceId: workspaceUser.workspaceId,
      createdBy: ctx.session.user.id,
      action: 'update',
      on: 'workspace-user',
      payload: result,
    });
    return result;
  }),
  invite: authProcedure.input(workspaceUserInviteCreateSchema).mutation(async ({ ctx, input }) => {
    const { workspaceId, ...payload } = input;
    ctx.abilities.can('manage', 'workspaceUserInvite', { workspaceId });
    const existingUsers = await ctx.db.client
      .table('supertray_users')
      .select('id', 'email')
      .whereIn('email', input.emails);
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
    const trx = await ctx.db.client.transaction();
    try {
      if (newInvites.length > 0) {
        await ctx.db.client
          .table('supertray_workspace_user_invites')
          .insert(newInvites)
          .transacting(trx);
      }
      if (newWorkspaceUsers.length > 0) {
        await ctx.db.client
          .table('supertray_workspace_users')
          .insert(newWorkspaceUsers)
          .transacting(trx);
      }
      await trx.commit();
    } catch (e) {
      await trx.rollback();
      sendMassMailRateLimiter.delete(workspaceId);
      ctx.logger.error(e);
      throw ctx.errors.badRequest();
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
      return {
        id: invite.id,
        workspaceName: invite.workspaceName,
        email: invite.email,
      };
    } catch (e) {
      ctx.logger.error(e);
      throw e;
    }
  }),
});
