import { documentInternalCreateSchema, documentQuerySchema } from './documents.schema';
import { authProcedure, internalProcedure } from '../procedures';
import { router } from '../trpc';
import { mongoToKnexOrder, mongoToKnexQuery } from '../utils';

export const documentRouter = router({
  internalCreate: internalProcedure
    .input(documentInternalCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const [document] = await ctx.db.client
        .table('supertray_documents')
        .insert(input)
        .returning('*');

      ctx.ee.emit.workspaceActivity({
        workspaceId: document.workspaceId,
        createdBy: document.createdBy,
        action: 'create',
        on: 'document',
        payload: document,
      });

      return document;
    }),
  list: authProcedure.input(documentQuerySchema).query(async ({ ctx, input }) => {
    const { $limit, $skip, $order, query } = input;
    const abilityQuery = ctx.abilities.getPermissionsQuery('read', 'documents');
    const knexQuery = ctx.db.client
      .table('supertray_documents')
      .where((qb) => ctx.abilities.applyPermissionQuery(qb, abilityQuery))
      .andWhere((qb) => mongoToKnexQuery(qb, query))
      .limit($limit)
      .offset($skip)
      .orderBy(mongoToKnexOrder($order));
    const documents = await knexQuery;
    return documents;
  }),
});
