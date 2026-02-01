"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.development = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const development = {
    connect: {
        client: 'pg',
        connection: {
            host: process.env.PG_HOST,
            port: 5432,
            user: process.env.PG_USER,
            password: process.env.PG_PASSWORD,
            database: 'games',
        },
        migrations: {
            tableName: 'knex_migrations',
            directory: './migrations',
        },
    },
};
exports.development = development;
