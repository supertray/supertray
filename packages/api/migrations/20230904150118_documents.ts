import type { Knex } from 'knex';

const tableName = 'supertray_documents';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(tableName, (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('workspaceId').references('id').inTable('supertray_workspaces').onDelete('CASCADE');
    table.string('title', 255).notNullable();
    table.text('content', 'LONGTEXT').notNullable();
    table.string('file').notNullable();
    table.string('filePdf').notNullable();
    table.string('mimeType').notNullable();
    table.integer('size').unsigned().notNullable();
    table.uuid('createdBy').references('id').inTable('supertray_users').onDelete('CASCADE');
    table.timestamps(true, true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable(tableName);
}
