import type { WorkspaceUserWithUser } from './workspace-users.schema';

import { userReadSchema, userUpdateSchema } from './users.schema';
import { errors } from '../errors';
import { authProcedure } from '../procedures';
import { router } from '../trpc';

export const userRouter = router({
  read: authProcedure.input(userReadSchema).query(async ({ input, ctx }) => {
    ctx.abilities.can('read', 'User', { id: input });
    const user = await ctx.db.queries.users.getById(input);
    if (!user) {
      throw errors.notFound();
    }
    return user;
  }),
  update: authProcedure.input(userUpdateSchema).mutation(async ({ input, ctx }) => {
    const { id, ...payload } = input;
    ctx.abilities.can('update', 'User', { id });
    const user = await ctx.db.prisma.user.update({
      where: {
        id,
      },
      data: payload,
    });
    if (!user) {
      throw errors.notFound();
    }
    process.nextTick(async () => {
      try {
        const workspaceUsers = await ctx.db.queries.workspaceUsers.list({
          userId: id,
        });
        workspaceUsers.forEach((wu) => {
          const { user: theUser, ...wUser } = wu;
          if (!theUser) return;
          ctx.ee.emit.workspaceActivity({
            workspaceId: wu.workspaceId,
            createdBy: id,
            action: 'update',
            on: 'workspace-user',
            payload: {
              ...wUser,
              role: wUser.role as WorkspaceUserWithUser['role'],
              user: theUser,
            },
          });
        });
        // eslint-disable-next-line no-empty
      } catch (e) {}
    });
    return user;
  }),
});
