const consts = require('./consts');

class BaseCache {
  constructor(channel, logger, metrics, maxSize, config, namespace = null) {
    this._namespace = namespace;
    this._channel = channel;
    this._logger = logger;
    this._metrics = metrics;
    this._MAX_SIZE = maxSize;
    this._config = config;
    this._metricLabels = {ns: namespace};
  }

  async set({key, val, ttl}) {
    this._baseCheck(key);
    this._valueCheck(val);

    try {
      const preparedKey = this._namespacedKey(key);
      const preparedVal = this._prepareValue(val);

      await this._channel.setStr(preparedVal, preparedKey);
      this._metrics.set(consts.METRICS.TOTAL_WRITES, 1, this._metricLabels);

      if (ttl > 0) {
        await this._channel.expire(preparedKey, ttl);
      }

      return true;
    } catch(err) /* istanbul ignore next */ {
      this._logger.error(`Cant set data to cache with key - ${key}, reason: ${err.stack}`);

      throw err;
    }
  }

  async get(key) {
    this._baseCheck(key);

    const preparedKey = this._namespacedKey(key);
    const hasData = await this._channel.has(preparedKey);

    if (!hasData) {
      this._metrics.set(consts.METRICS.TOTAL_MISSES, 1, this._metricLabels);

      return undefined;
    }

    const cacheData = await this._channel.getStr(preparedKey);

    this._metrics.set(consts.METRICS.TOTAL_HITS, 1, this._metricLabels);

    return JSON.parse(cacheData);
  }

  async getKeysByPrefix(prefix) {
    this._baseCheck(prefix);
    const preparedPrefix = this._namespacedKey(prefix);

    try {
      const keysData = [];

      await this._channel.scan(preparedPrefix, (keys) => {
        for (const key of keys) {
          keysData.push(key);
        }
      });

      return keysData;
    } catch(err) /* istanbul ignore next */ {
      this._logger.error(`Cant get keys by prefix - ${prefix}, reason: ${err.stack}`);

      throw err;
    }
  }

  async has(key) {
    this._baseCheck(key);

    const preparedKey = this._namespacedKey(key);

    try {
      const hasKey = await this._channel.has(preparedKey);

      return !!hasKey;
    } catch(err) /* istanbul ignore next */ {
      this._logger.error(`Cant check key to exists - ${key}, reason: ${err.stack}`);

      throw err;
    }
  }

  async remove(key) {
    this._baseCheck(key);

    const preparedKey = this._namespacedKey(key);

    try {
      await this._channel.remove(preparedKey);
    } catch(err) /* istanbul ignore next */ {
      this._logger.error(`Cant remove key - ${key}, reason: ${err.stack}`);

      throw err;
    }
  }

  async removeByPrefix(prefix) {
    this._baseCheck(prefix);

    const preparedPrefix = this._namespacedKey(prefix);

    try {
      await this._channel.transaction(async(transaction) => {
        await this._channel.scan(preparedPrefix, (keys) => {
          transaction.remove(keys);
        });
      });
    } catch(err) /* istanbul ignore next */ {
      this._logger.error(`Cant remove keys by prefix - ${prefix}, reason: ${err.stack}`);

      throw err;
    }
  }

  async ttl({key, ttl}) {
    this._baseCheck(key);

    if (!ttl || ttl <= 0) {
      throw new Error('Ttl is missed');
    }

    try {
      await this._channel.expire(key, ttl);
    } catch(err) /* istanbul ignore next */ {
      this._logger.error(`Cant set ttl to key - ${key}, reason: ${err.stack}`);

      throw err;
    }
  }

  async invalidate() {
    this._baseCheck('*');

    if (!this._namespace) {
      throw new Error('Full invalidation available only for namespaces');
    }

    try {
      await this._channel.transaction(async(transaction) => {
        await this._channel.scan(this._namespacedKey('*'), (keys) => {
          transaction.remove(keys);
        });
      });
    } catch(err) {
      this._logger.error(`Cant invalidate, reason: ${err.stack}`);

      throw err;
    }
  }

  _baseCheck(key) {
    if (!this._channel) {
      throw new Error('Redis client is missed');
    }
    if (!key) {
      throw new Error('Key is missed');
    }
  }

  _valueCheck(val) {
    if (val === undefined) {
      throw new Error('Val is missed');
    }
  }

  _prepareValue(val) {
    const dataToCache = JSON.stringify(val);

    if (dataToCache.length >= this._MAX_SIZE) {
      throw new Error(`Large value size! Max size '${this._MAX_SIZE}' chars`);
    }

    return dataToCache;
  }

  _namespacedKey(key) {
    return this._namespace ? `${this._namespace}:${key}` : key;
  }
}

module.exports = BaseCache;
