import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('firstName', 255).notNullable();
    table.string('middleName', 255);
    table.string('lastName', 255).notNullable();
    table.string('phone', 20).notNullable();
    table.string('password', 256).notNullable();
    table.dateTime('created_at', {useTz: false}).notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('users');
}
