import type {Knex} from 'knex';

interface Config {
  connect: Knex.Config;
}

type DevConfig = Config;

const development: DevConfig = {
  connect: {
    client: 'pg',
    connection: {
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: '0896',
      database: 'games',
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: './migrations',
    },
  },
};

export {development};
