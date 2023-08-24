// For more information about this file see https://dove.feathersjs.com/guides/cli/knexfile.html
import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('supertray_workspace_users', (table) => {
    table.uuid('id').defaultTo(knex.raw('uuid_generate_v4()')).primary();
    table.uuid('userId').references('id').inTable('supertray_users').onDelete('SET NULL');
    table.uuid('workspaceId').references('id').inTable('supertray_workspaces').onDelete('SET NULL');
    table.boolean('isAdmin').defaultTo(false);
    table.boolean('isOwner').defaultTo(false);
    table.boolean('isActive').defaultTo(true);
    table.timestamps(true, true, true);

    table.unique(['userId', 'workspaceId']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('supertray_workspace_users');
}
