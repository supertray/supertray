import type { Knex } from 'knex';

const tableName = 'supertray_sessions';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(tableName, (table) => {
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
  await knex.schema.dropTable(tableName);
}
