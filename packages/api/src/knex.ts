import type { Knex } from 'knex';

import { env } from './env';

// Load our database connection info from the app configuration
export const config: Knex.Config = {
  client: 'pg',
  connection: env.DB_URL,
  migrations: {
    directory: './migrations',
    extension: 'ts',
  },
};
