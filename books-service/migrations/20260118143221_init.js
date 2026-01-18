exports.up = async function (knex) {
  await knex.schema.createTable('authors', (table) => {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
  });

  await knex.schema.createTable('games', (table) => {
    table.increments('id').primary();
    table.string('title', 50).unique().notNullable();
    table.integer('author_id').notNullable();
    table.smallint('year').notNullable();

    table
      .foreign('author_id')
      .references('id')
      .inTable('authors')
      .onDelete('CASCADE');
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('games');
  await knex.schema.dropTableIfExists('authors');
};
