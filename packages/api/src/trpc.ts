import type { Context } from './context';
import type { IncomingMessage } from 'http';

import { initTRPC } from '@trpc/server';
/**
 * Initialization of tRPC backend
 * Should be done only once per backend!
 */
const t = initTRPC
  .context<
    Context & {
      req: IncomingMessage;
    }
  >()
  .create();

/**
 * Export reusable router and procedure helpers
 * that can be used throughout the router
 */
export const { router, middleware, procedure } = t;
