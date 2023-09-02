import type { Context } from './context';
import type { IncomingMessage } from 'http';
import type ws from 'ws';

import { initTRPC } from '@trpc/server';

export type ContextWebSocket = ws & { accessToken?: string };

/**
 * Initialization of tRPC backend
 * Should be done only once per backend!
 */
const t = initTRPC
  .context<
    Context & {
      req: IncomingMessage;
      ws?: ContextWebSocket;
    }
  >()
  .create();

/**
 * Export reusable router and procedure helpers
 * that can be used throughout the router
 */
export const { router, middleware, procedure } = t;
