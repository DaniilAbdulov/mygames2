const RedisProvider = require('../../src/lib/database/redisProvider');
const consts = require('./consts');

const BaseCache = require('./baseCache');

class LruCache extends BaseCache {
  _lastExpirationRun = null;

  get _storageKey() {
    return this._namespacedKey('__storage');
  }

  get _sortingKey() {
    return this._namespacedKey('__sorting');
  }

  get _expirationKey() {
    return this._namespacedKey('__expiration');
  }

  get _size() {
    return this._config.size;
  }

  get _expirationMinInterval() {
    return this._config.expirationMinInterval;
  }

  async set({key, val, ttl}) {
    this._baseCheck(key);
    this._valueCheck(val);

    try {
      const preparedValue = this._prepareValue(val);

      await this._expire(true);
      const start = 0;
      const stop = -this._size;
      const pushedOutKeys = await this._channel.getSetMembersRange(this._sortingKey, start, stop);

      await this._channel.transaction((transaction) => {
        const now = Math.ceil(new Date().getTime() / 1000);

        transaction.setObj({[key]: preparedValue}, this._storageKey);
        transaction.addSetMember(this._sortingKey, key, now);

        if (ttl) {
          const expirationScore = now + ttl;

          transaction.addSetMember(this._expirationKey, key, expirationScore);
        }
        if (pushedOutKeys.length) {
          transaction.removeObjFields(this._storageKey, pushedOutKeys);
          transaction.removeSetMembersRange(this._sortingKey, start, stop);
          transaction.removeSetMembers(this._expirationKey, pushedOutKeys);
        }
      });

      this._metrics.set(consts.METRICS.TOTAL_WRITES, 1, this._metricLabels);

      if (pushedOutKeys.length) {
        this._metrics.set(consts.METRICS.TOTAL_EVICTED, pushedOutKeys.length, this._metricLabels);
      }

      return true;
    } catch(err) {
      this._logger.error(`Cant set key to buffer - ${key}, reason: ${err.stack}`);

      throw err;
    }
  }

  async get(key) {
    this._baseCheck(key);

    try {
      await this._expire();

      const hasValue = await this._channel.hasObjField(this._storageKey, key);

      if (!hasValue) {
        this._metrics.set(consts.METRICS.TOTAL_MISSES, 1, this._metricLabels);

        return undefined;
      }

      const rawValue = await this._channel.getObjField(this._storageKey, key);

      this._metrics.set(consts.METRICS.TOTAL_HITS, 1, this._metricLabels);

      this._channel.addSetMember(this._sortingKey, key, Math.ceil(new Date().getTime() / 1000));

      return JSON.parse(rawValue);
    } catch(err) {
      this._logger.error(`Cant get key from buffer - ${key}, reason: ${err.stack}`);

      throw err;
    }
  }

  async getKeysByPrefix(prefix) {
    this._baseCheck(prefix);

    try {
      await this._expire();

      const keysData = [];

      await this._channel.scanObjFields(this._storageKey, prefix, (fieldValues) => {
        for (const [key] of fieldValues) {
          keysData.push(key);
        }
      });

      return [...keysData];
    } catch(err) {
      this._logger.error(`Cant get keys by prefix - ${prefix}, reason: ${err.stack}`);

      throw err;
    }
  }

  async has(key) {
    this._baseCheck(key);

    try {
      await this._expire();

      const hasValue = await this._channel.hasObjField(this._storageKey, key);

      return !!hasValue;
    } catch(err) {
      this._logger.error(`Cant check key to exists in buffer - ${key}, reason: ${err.stack}`);

      throw err;
    }
  }

  async remove(key) {
    this._baseCheck(key);

    try {
      await this._channel.transaction((transaction) => {
        transaction.removeObjFields(this._storageKey, key);
        transaction.removeSetMembers(this._sortingKey, key);
        transaction.removeSetMembers(this._expirationKey, key);
      });

      this._expire();
    } catch(err) {
      this._logger.error(`Cant remove key from buffer - ${key}, reason: ${err.stack}`);

      throw err;
    }
  }

  async removeByPrefix(prefix) {
    try {
      const pickKeys = (arr) => arr.map(([key]) => key);

      await this._channel.transaction(async(transaction) => {
        await Promise.all([
          this._channel.scanSetMembers(this._sortingKey, prefix, (memberScores) => {
            transaction.removeSetMembers(this._sortingKey, pickKeys(memberScores));
          }),
          this._channel.scanSetMembers(this._expirationKey, prefix, (memberScores) => {
            transaction.removeSetMembers(this._expirationKey, pickKeys(memberScores));
          }),
          this._channel.scanObjFields(this._storageKey, prefix, (fieldValues) => {
            transaction.removeObjFields(this._storageKey, pickKeys(fieldValues));
          })
        ]);
      });

      this._expire();
    } catch(err) {
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
      await this._expire();

      const hasValue = await this._channel.hasObjField(this._storageKey, key);
      const expirationScore = new Date().getTime() / 1000 + ttl;

      if (hasValue) {
        await this._channel.addSetMember(this._expirationKey, key, expirationScore);
      }
    } catch(err) {
      this._logger.error(`Cant remove key from buffer - ${key}, reason: ${err.stack}`);

      throw err;
    }
  }

  async invalidate() {
    this._baseCheck('*');

    try {
      await this._channel.transaction((transaction) => {
        transaction.remove(this._storageKey);
        transaction.remove(this._sortingKey);
        transaction.remove(this._expirationKey);
      });
    } catch(err) {
      this._logger.error(`Cant invalidate, reason: ${err.stack}`);

      throw err;
    }
  }

  _baseCheck(key) {
    super._baseCheck(key);

    if (!this._namespace) {
      throw new Error('Namespace should be provided');
    }
    if (!this._config.size || this._config.size < 0) {
      throw new Error('Invalid size');
    }
  }

  async _expire(force = false) {
    const now = new Date();
    const interval = now - new Date(this._lastExpirationRun);

    if (!force && this._expirationMinInterval && interval < this._expirationMinInterval) {
      return;
    }

    this._lastExpirationRun = new Date().getTime();

    try {
      const expiredKeys = await this._channel.getSetMembersRange(
        this._expirationKey,
        0,
        Math.ceil(now.getTime() / 1000),
        RedisProvider.SetRangeTypes.BY_SCORE
      );

      if (!expiredKeys.length) {
        return;
      }

      await this._channel.transaction((transaction) => {
        transaction.removeSetMembers(this._sortingKey, expiredKeys);
        transaction.removeSetMembers(this._expirationKey, expiredKeys);
        transaction.removeObjFields(this._storageKey, expiredKeys);
      });
      this._metrics.set(consts.METRICS.TOTAL_EXPIRED, expiredKeys.length, this._metricLabels);
    } catch(err) {
      this._logger.error(`Cant expire keys from buffer, reason: ${err.stack}`);

      throw err;
    }
  }
}

module.exports = LruCache;
