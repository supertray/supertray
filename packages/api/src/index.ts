import * as dotenv from 'dotenv';

dotenv.config();

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
