import type { Knex } from 'knex';

const tableName = 'supertray_workspace_users';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(tableName, (table) => {
    table.uuid('id').defaultTo(knex.raw('uuid_generate_v4()')).primary();
    table
      .uuid('workspaceId')
      .references('id')
      .inTable('supertray_workspaces')
      .onDelete('CASCADE')
      .notNullable();
    table.uuid('userId').references('id').inTable('supertray_users').onDelete('SET NULL');
    table.enum('role', ['owner', 'admin', 'user']).defaultTo('user').notNullable();
    table.boolean('suspended').defaultTo(false).notNullable();
    table.timestamps(true, true, true);

    table.unique(['workspaceId', 'userId']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable(tableName);
}
