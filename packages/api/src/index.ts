import path from 'path';

import { LocalStrategy } from '@feathersjs/authentication-local';
import * as dotenv from 'dotenv';

dotenv.config({
  path: path.resolve(process.cwd(), '.env'),
});

/* eslint-disable import/first */
import { app } from './app';
import { logger } from './logger';

const port = app.get('port');
const host = app.get('host');

process.on('unhandledRejection', (reason) => logger.error('Unhandled Rejection %O', reason));

export function listen() {
  app
    .listen(port)
    .then(() => {
      logger.info(`Supertray api listening on http://${host}:${port}`);
    })
    .catch((e) => {
      logger.error(e);
      process.exit(1);
    });
  return app;
}

export function createLocalAuthStrategy() {
  return new LocalStrategy();
}

export function createServer(opts: { authStrategies?: LocalStrategy[] }) {
  if (opts.authStrategies) {
    opts.authStrategies.forEach((strategy) => {
      if (strategy instanceof LocalStrategy) {
        app.service('authentication').register('local', strategy);
      }
    });
  }

  return app;
}
