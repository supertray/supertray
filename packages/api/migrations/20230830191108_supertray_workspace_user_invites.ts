import type { Knex } from 'knex';

const tableName = 'supertray_workspace_user_invites';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(tableName, (table) => {
    table.uuid('id').defaultTo(knex.raw('uuid_generate_v4()')).primary();
    table.uuid('workspaceId').notNullable();
    table.string('email').notNullable();
    table.string('role').notNullable();
    table.timestamps(true, true, true);

    table.unique(['workspaceId', 'email']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable(tableName);
}
