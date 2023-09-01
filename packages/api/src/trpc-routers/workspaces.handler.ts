import { workspaceCreateSchema, workspaceUpdateSchema } from './workspaces.schema';
import { errors } from '../errors';
import { authProcedure } from '../procedures';
import { router } from '../trpc';
import { applyPermissionQueryToKnex } from '../utils';

export const workspaceRouter = router({
  create: authProcedure.input(workspaceCreateSchema).mutation(async ({ ctx, input }) => {
    ctx.abilities.can('create', 'workspace');
    const trx = await ctx.db.client.transaction();
    try {
      const [workspace] = await ctx.db.client
        .table('supertray_workspaces')
        .insert(input)
        .transacting(trx)
        .returning('*');
      await ctx.db.client
        .table('supertray_workspace_users')
        .insert({
          workspaceId: workspace.id,
          userId: ctx.session.user.id,
          role: 'owner',
        })
        .transacting(trx)
        .returning('*');
      await trx.commit();
      return workspace;
    } catch (e) {
      await trx.rollback();
      ctx.logger.error(e);
      throw errors.internalServerError();
    }
  }),
  list: authProcedure.query(async ({ ctx }) => {
    const query = ctx.abilities.getPermissionsQuery('read', 'workspace');
    const workspaces = await ctx.db.client
      .table('supertray_workspaces')
      .select('supertray_workspaces.*', 'supertray_workspace_users.role as role')
      .join(
        'supertray_workspace_users',
        'supertray_workspaces.id',
        'supertray_workspace_users.workspaceId',
      )
      .where('supertray_workspace_users.userId', ctx.session.user.id)
      .where((qb) => applyPermissionQueryToKnex(qb, query, 'supertray_workspaces'));
    return workspaces;
  }),
  update: authProcedure.input(workspaceUpdateSchema).mutation(async ({ ctx, input }) => {
    const { id, ...payload } = input;
    ctx.abilities.can('update', 'workspace', { id });
    const [workspace] = await ctx.db.client
      .table('supertray_workspaces')
      .where('id', id)
      .update({
        ...payload,
        updatedAt: new Date(),
      })
      .returning('*');
    if (!workspace) {
      throw errors.notFound();
    }
    return workspace;
  }),
});
