import type { inferAsyncReturnType } from '@trpc/server';
import type { NodeHTTPCreateContextFnOptions } from '@trpc/server/adapters/node-http';

import { WebSocket as ws } from 'ws';

import { database } from './database';
import * as queries from './database/queries';
import * as ee from './emitter';
import { env } from './env';
import { errors } from './errors';
import { logger } from './logger';
import { mailer } from './mailer';

export const ctx = {
  env,
  logger,
  db: {
    client: database,
    queries,
  },
  mailer,
  errors,
  ee,
  external: false,
};

export type Context = inferAsyncReturnType<() => typeof ctx>;

export const createContext = <TRequest, TResponse>(
  opts: NodeHTTPCreateContextFnOptions<TRequest, TResponse>,
) => {
  return {
    ...ctx,
    req: opts.req,
    ws: opts.res instanceof ws ? opts.res : undefined,
  };
};
