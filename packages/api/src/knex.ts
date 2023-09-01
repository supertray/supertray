import type { Knex } from 'knex';

import { env } from './env';

// Load our database connection info from the app configuration
export const config: Knex.Config = {
  client: env.DB_CLIENT,
  connection: {
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASS,
    database: env.DB_NAME,
  },
  migrations: {
    directory: './migrations',
    extension: 'ts',
  },
};
