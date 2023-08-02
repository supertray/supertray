// For more information about this file see https://dove.feathersjs.com/guides/cli/knexfile.html
import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

  await knex.schema.createTable('supertray_users', (table) => {
    table.uuid('id').defaultTo(knex.raw('uuid_generate_v4()')).primary();
    table.string('firstName', 100);
    table.string('lastName', 100);
    table.string('email', 255).unique();
    table.string('password', 767);
    table.boolean('isVerified').defaultTo(false);
    table.timestamps(true, true, true);
  });

  await knex.schema.createTable('supertray_sessions', (table) => {
    table.uuid('id').defaultTo(knex.raw('uuid_generate_v4()')).primary();
    table.string('token', 96).index();
    table.uuid('userId').references('id').inTable('supertray_users').onDelete('CASCADE');
    table.timestamp('expiresAt');
    table.string('ipAddress', 45).defaultTo(null);
    table.string('userAgent', 255).defaultTo(null);
    table.string('origin', 255).defaultTo(null);
    table.timestamps(true, true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('supertray_sessions');
  await knex.schema.dropTable('supertray_users');
}
