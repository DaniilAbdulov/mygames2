"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.development = void 0;
const development = {
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
exports.development = development;
