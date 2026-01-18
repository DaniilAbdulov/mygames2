class Lock {
  static async acquire({key, value, ttl}, {timeout, maxAttempts}, {redis, logger}) {
    let attempts = 0;

    while (attempts <= maxAttempts || maxAttempts === -1) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await redis.setStr(value, key, {notExists: true, ttl});

        return new Lock(
          {key, value, ttl, acquiredAt: Date.now()},
          {redis, logger}
        );
      } catch(err) {
        if (err.message !== 'Key not set') {
          logger.error(`Error acquiring lock ${key}, reason - ${err.stack}`);

          throw err;
        }

        attempts++;
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => {
          setTimeout(resolve, timeout);
        });
      }
    }

    throw new Error('Unable to acquire lock');
  }

  #key;

  #value;

  #ttl;

  #acquiredAt;

  #redis;

  #logger;

  constructor({key, value, acquiredAt, ttl}, {redis, logger}) {
    this.#key = key;
    this.#value = value;
    this.#acquiredAt = acquiredAt;
    this.#ttl = ttl;
    this.#redis = redis;
    this.#logger = logger;
  }

  async release() {
    if (this.#acquiredAt + this.#ttl < Date.now()) {
      this.#logger.debug(`Lock ${this.#key} already expired, skipping release`);

      return;
    }

    try {
      await this.#redis.compareAndRemove(this.#key, this.#value);
    } catch(err) {
      this.#logger.error(`Error releasing lock ${this.#key}, reason - ${err.stack}`);

      throw err;
    }
  }
}

module.exports = Lock;
