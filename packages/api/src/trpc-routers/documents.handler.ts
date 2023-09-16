import type { Document } from './documents.schema';

import { documentInternalCreateSchema, documentQuerySchema } from './documents.schema';
import { authProcedure, internalProcedure } from '../procedures';
import { router } from '../trpc';

export const documentRouter = router({
  internalCreate: internalProcedure
    .input(documentInternalCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const document = await ctx.db.prisma.document.create({
        data: input,
      });

      ctx.ee.emit.workspaceActivity({
        workspaceId: document.workspaceId,
        createdBy: document.createdBy,
        action: 'create',
        on: 'document',
        payload: document as Document,
      });

      return document;
    }),
  list: authProcedure.input(documentQuerySchema).query(async ({ ctx, input }) => {
    const { take, skip, orderBy, where } = input;
    const abilityQuery = ctx.abilities.getPrismaFilter('read', 'Document');
    const documents = await ctx.db.prisma.document.findMany({
      where: {
        AND: [abilityQuery, where],
      },
      take,
      skip,
      orderBy,
    });
    return documents;
  }),
});
