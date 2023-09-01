import { userReadSchema, userUpdateSchema } from './users.schema';
import { errors } from '../errors';
import { authProcedure } from '../procedures';
import { router } from '../trpc';

export const userRouter = router({
  read: authProcedure.input(userReadSchema).query(async ({ input, ctx }) => {
    ctx.abilities.can('read', 'user', { id: input });
    const user = await ctx.db.queries.users.getById(input);
    if (!user) {
      throw errors.notFound();
    }
    return user;
  }),
  update: authProcedure.input(userUpdateSchema).mutation(async ({ input, ctx }) => {
    const { id, ...payload } = input;
    ctx.abilities.can('update', 'user', { id });
    const [user] = await ctx.db.client
      .table('supertray_users')
      .where('id', id)
      .update({
        ...payload,
        updatedAt: new Date(),
      })
      .returning('*');
    if (!user) {
      throw errors.notFound();
    }
    return user;
  }),
});
