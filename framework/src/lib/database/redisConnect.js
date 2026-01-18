const RedisConnector = require('./redisConnector');

class RedisConnect {
  constructor(config) {
    this._storages = {};
    this._config = config;
  }

  close() {
    for (const db in this._storages) {
      this._storages[db].close();
    }
  }

  getChannel(db) {
    if (!this._storages[db]) {
      this._storages[db] = new RedisConnector(this._config, db);
    }

    return this._storages[db];
  }
}

module.exports = RedisConnect;
