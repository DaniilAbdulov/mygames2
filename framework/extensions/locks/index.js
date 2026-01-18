const {Extension} = require('../../src/classes');
const Lock = require('./lock');

class Locks extends Extension {
  static #characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  constructor() {
    super(Extension.Types.STATIC, 'Locks');
  }

  load({config, redisConnect}) {
    this._channel = redisConnect.getChannel(config.redis.cacheDb);
    this._config = config.locks;
  }

  action() {
    return {
      acquire: (key, ttl, options) => {
        const value = this.#randomValue();
        const timeout = Number(options?.timeout) || this._config.timeout;
        const maxAttempts = Number(options?.maxAttempts) || this._config.maxAttempts;

        return Lock.acquire(
          {key, value, ttl},
          {timeout, maxAttempts},
          {redis: this._channel, logger: this.Logger}
        );
      },
      using: async(key, ttl, fn, options) => {
        const value = this.#randomValue();
        const timeout = Number(options?.timeout) || this._config.timeout;
        const maxAttempts = Number(options?.maxAttempts) || this._config.maxAttempts;
        const lock = await Lock.acquire(
          {key, value, ttl},
          {timeout, maxAttempts},
          {redis: this._channel, logger: this.Logger}
        );

        try {
          return await fn();
        } finally {
          try {
            await lock.release();
          } catch(_) {
            // Да, ничего не делаем, так как иначе
            // перезатрем ошибк, которую могла выбросить fn,
            // а логировать тоже не нужно, потому что логируется внутри
          }
        }
      }
    };
  }

  #randomValue() {
    let result = '';

    for (let i = 0; i < this._config.tokenLength; i++) {
      const randomIdx = Math.floor(Math.random() * Locks.#characters.length);

      result += Locks.#characters.charAt(randomIdx);
    }

    return result;
  }
}

module.exports = Locks;
