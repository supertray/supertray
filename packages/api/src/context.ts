import type { inferAsyncReturnType } from '@trpc/server';

import { database } from './database';
import * as queries from './database/queries';
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
};

export type Context = inferAsyncReturnType<() => typeof ctx>;
