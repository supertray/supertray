import { middleware } from '../trpc';

export const internal = middleware(({ ctx, next }) => {
  if (ctx.req) {
    throw ctx.errors.forbidden();
  }
  return next({
    ctx: {
      ...ctx,
      internal: true,
    },
  });
});
