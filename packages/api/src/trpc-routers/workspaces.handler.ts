import { workspaceCreateSchema, workspaceUpdateSchema } from './workspaces.schema';
import { errors } from '../errors';
import { authProcedure } from '../procedures';
import { router } from '../trpc';

export const workspaceRouter = router({
  create: authProcedure.input(workspaceCreateSchema).mutation(async ({ ctx, input }) => {
    ctx.abilities.can('create', 'Workspace');
    const result = await ctx.db.prisma.$transaction(async (client) => {
      const workspace = await client.workspace.create({
        data: input,
      });
      await client.workspaceUser.create({
        data: {
          role: 'owner',
          userId: ctx.session.user.id,
          workspaceId: workspace.id,
        },
      });
      return workspace;
    });
    return result;
  }),
  list: authProcedure.query(async ({ ctx }) => {
    const where = ctx.abilities.getPrismaFilter('read', 'Workspace');
    const workspaces = await ctx.db.prisma.workspace.findMany({
      where,
      include: {
        workspaceUsers: {
          where: {
            userId: ctx.session.user.id,
          },
        },
      },
    });
    return workspaces;
  }),
  update: authProcedure.input(workspaceUpdateSchema).mutation(async ({ ctx, input }) => {
    const { id, ...payload } = input;
    ctx.abilities.can('update', 'Workspace', { id });
    const workspace = await ctx.db.prisma.workspace.update({
      where: {
        id,
      },
      data: payload,
    });
    if (!workspace) {
      throw errors.notFound();
    }
    return workspace;
  }),
});
