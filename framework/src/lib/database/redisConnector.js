const {createClient} = require('redis');

const RedisProvider = require('./redisProvider');

class RedisConnector extends RedisProvider {
  constructor(options, db) {
    super();

    this._setClient(options, db);
  }

  close() {
    if (this.client) {
      this.client.end(true);
      this.client = null;
    }
  }

  _setClient(options, db) {
    /* istanbul ignore if */
    if (this.client) {
      this.client.removeAllListeners('error');
      this.client.removeAllListeners('warning');
      this.client = null;
      this.original = null;
    }

    const client = createClient({
      host: options.host,
      port: options.port,
      password: options.password,
      db,
      // eslint-disable-next-line camelcase
      socket_initial_delay: 3000,
      retry_strategy: () => 10000,
    });

    /* istanbul ignore next */
    client.on('error', (error) => {
      console.error(`Error: ${error}`);
    });

    /* istanbul ignore next */
    client.on('end', () => {
      console.error('Connection gone away');
    });

    /* istanbul ignore next */
    client.on('reconnecting', () => {
      console.error('Reconnecting...');
    });

    /* istanbul ignore next */
    client.on('warning', (warning) => {
      console.warn(`Warning: ${warning}`);
    });

    this.client = client;
    this.original = this.client;
  }
}

module.exports = RedisConnector;
