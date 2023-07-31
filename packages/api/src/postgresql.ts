// For more information about this file see https://dove.feathersjs.com/guides/cli/databases.html
import type { Application } from './declarations';
import type { Knex } from 'knex';

import knex from 'knex';

declare module './declarations' {
  interface Configuration {
    postgresqlClient: Knex;
  }
}

export const postgresql = (app: Application) => {
  const config = app.get('postgresql');
  const db = knex(config!);

  app.set('postgresqlClient', db);
};
