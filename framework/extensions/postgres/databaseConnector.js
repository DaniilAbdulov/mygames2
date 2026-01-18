const knex = require('knex');
const {types} = require('pg');
const {getDate, isDate} = require('../../src/utils');

knex.QueryBuilder.extend('return', function (arg) {
  this.returning(arg);

  const originalThen = this.then;

  if (typeof arg === 'string') {
    this.then = (onfulfilled, onrejected) =>
      originalThen.call(
        this,
        (response) => {
          const rowLength = response?.length;

          if (rowLength) {
            for (let i = 0, l = rowLength; i < l; i++) {
              response[i] = response[i][arg];
            }
          }

          return Promise.resolve(response).then(onfulfilled).catch(onrejected);
        },
        onrejected,
      );
  }

  return this;
});

class DatabaseConnector {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.db = null;
  }

  open() {
    [1114, 1184, 12139, 1115, 1185].forEach((item) =>
      types.setTypeParser(item, (value) =>
        isDate(value) ? getDate(value) : value,
      ),
    );

    const {typeParsers} = this.config;

    if (typeParsers) {
      for (const type in typeParsers) {
        types.setTypeParser(type, typeParsers[type]);
      }
    }

    this.db = knex({
      client: 'pg',
      connection: {
        host: this.config.connection.host,
        port: Number(this.config.connection.port),
        user: this.config.connection.user,
        password: this.config.connection.password,
        database: this.config.connection.database,
      },
      log: {
        /* istanbul ignore next */
        warn(message) {
          this.logger.warn(message);
        },
        /* istanbul ignore next */
        error(message) {
          this.logger.error(message);
        },
        /* istanbul ignore next */
        deprecate(message) {
          this.logger.info(message);
        },
        /* istanbul ignore next */
        debug(message) {
          this.logger.debug(message);
        },
      },
      pool: {min: 0, max: 40},
      acquireConnectionTimeout: 10000,
    });

    this.initCloseTimeout();

    return this.db;
  }

  close() {
    if (this.db) {
      this.db.destroy();
      this.db = null;

      /* istanbul ignore else */
      if (this.closeTimeout) {
        clearTimeout(this.closeTimeout);
        this.closeTimeout = null;
      }

      return true;
    }

    return false;
  }

  initCloseTimeout() {
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
    }

    const seconds = Number(this.config.closeTimeout || 300) * 1000;

    /* istanbul ignore next */
    if (seconds > 10 * 60 * 1000) {
      this.logger.warn('Close timeout more than 10 mins, its ok?');
    }

    this.closeTimeout = setTimeout(() => {
      /* istanbul ignore next */
      this.close();
    }, seconds);
  }

  static get(dbModel) {
    if (!dbModel) {
      return null;
    }

    if (DatabaseConnector.isOpen(dbModel)) {
      dbModel.initCloseTimeout();

      return dbModel.db;
    }

    return dbModel.open();
  }

  static isOpen(dbModel) {
    return !!dbModel.db;
  }
}

module.exports = DatabaseConnector;
