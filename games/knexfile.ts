import type {Knex} from 'knex';
import {development} from './config';

const config: {[key: string]: Knex.Config} = {
  development: development.connect,
};

module.exports = config;
