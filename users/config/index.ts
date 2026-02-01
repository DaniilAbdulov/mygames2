import type {Knex} from 'knex';
import dotenv from 'dotenv';

dotenv.config();

interface Config {
  connect: Knex.Config;
}

type DevConfig = Config;

const development: DevConfig = {
  connect: {
    client: 'pg',
    connection: {
      host: process.env.PG_HOST || 'localhost',
      port: 5432,
      user: 'postgres',
      password: process.env.PG_PASSWORD,
      database: 'users',
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: './migrations',
    },
  },
};

export {development};
