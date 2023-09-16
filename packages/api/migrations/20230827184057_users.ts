import type { Knex } from 'knex';

const tableName = 'supertray_users';

export async function up(knex: Knex): Promise<void> {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

  await knex.schema.createTable(tableName, (table) => {
    table.uuid('id').defaultTo(knex.raw('uuid_generate_v4()')).primary();
    table.string('email').notNullable().unique();
    table.string('firstName').notNullable();
    table.string('lastName').notNullable();
    table.timestamps(true, true, true);
  });

  await knex.schema.createTable('supertray_login_tokens', (table) => {
    table.uuid('id').defaultTo(knex.raw('uuid_generate_v4()')).primary();
    table
      .uuid('userId')
      .references('id')
      .inTable('supertray_users')
      .onDelete('CASCADE')
      .notNullable();
    table.string('token', 8).index().notNullable();
    table.timestamp('expiresAt').notNullable();
    table.timestamps(true, true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable(tableName);
  await knex.schema.dropTable('supertray_login_tokens');
}
