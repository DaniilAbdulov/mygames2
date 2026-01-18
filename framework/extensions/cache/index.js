const {Extension} = require('../../src/classes');
const Metrics = require('../../src/lib/metrics');
const consts = require('./consts');
const BaseCache = require('./baseCache');
const LfuCache = require('./lfuCache');
const LruCache = require('./lruCache');

class Cache extends Extension {
  constructor() {
    super(Extension.Types.STATIC, 'Cache');
  }

  load({config, redisConnect, metrics}) {
    const CHARS_IN_ONE_MB = 262144; // 4 bytes per char

    this._channel = redisConnect.getChannel(config.redis.cacheDb);
    this._metrics = metrics;
    this._MAX_SIZE = config.redis.maxKeySizeInMb * CHARS_IN_ONE_MB;
    this._config = config.cache;
    this._global = new BaseCache(
      this._channel,
      this.Logger,
      this._metrics,
      this._MAX_SIZE,
      this._config
    );
    this._namespaces = {};

    this._metrics.registerMetric(consts.METRICS.TOTAL_HITS, {
      type: Metrics.Types.COUNTER,
      name: consts.METRICS.TOTAL_HITS,
      description: 'Cache namespace hits count',
      labels: ['ns']
    });
    this._metrics.registerMetric(consts.METRICS.TOTAL_MISSES, {
      type: Metrics.Types.COUNTER,
      name: consts.METRICS.TOTAL_MISSES,
      description: 'Cache namespace misses count',
      labels: ['ns']
    });
    this._metrics.registerMetric(consts.METRICS.TOTAL_WRITES, {
      type: Metrics.Types.COUNTER,
      name: consts.METRICS.TOTAL_WRITES,
      description: 'Cache namespace writes count',
      labels: ['ns']
    });
    this._metrics.registerMetric(consts.METRICS.TOTAL_EVICTED, {
      type: Metrics.Types.COUNTER,
      name: consts.METRICS.TOTAL_EVICTED,
      description: 'Cache namespace evicted count',
      labels: ['ns']
    });
    this._metrics.registerMetric(consts.METRICS.TOTAL_EXPIRED, {
      type: Metrics.Types.COUNTER,
      name: consts.METRICS.TOTAL_EXPIRED,
      description: 'Cache namespace expired count',
      labels: ['ns']
    });
  }

  _getNamespace(namespace) {
    if (!this._channel) {
      throw new Error('Redis client is missed');
    }
    if (!namespace) {
      throw new Error('Namespace is missed');
    }

    if (this._namespaces[namespace]) {
      return this._namespaces[namespace];
    }

    const namespaceConfig = this._config.namespaces[namespace];

    if (!namespaceConfig) {
      throw new Error('Namespace not defined');
    }
    if (namespaceConfig.type === 'base') {
      this._namespaces[namespace] = new BaseCache(
        this._channel,
        this.Logger,
        this._metrics,
        this._MAX_SIZE,
        namespaceConfig,
        namespace
      );
    } else if (namespaceConfig.type === 'lfu') {
      this._namespaces[namespace] = new LfuCache(
        this._channel,
        this.Logger,
        this._metrics,
        this._MAX_SIZE,
        namespaceConfig,
        namespace
      );
    } else if (namespaceConfig.type === 'lru') {
      this._namespaces[namespace] = new LruCache(
        this._channel,
        this.Logger,
        this._metrics,
        this._MAX_SIZE,
        namespaceConfig,
        namespace
      );
    } else {
      throw new Error('Unsupported cache type');
    }

    return this._namespaces[namespace];
  }

  action() {
    return {
      set: ({key, val, ttl}) => this._global.set({key, val, ttl}),
      ttl: ({key, ttl}) => this._global.ttl({key, ttl}),
      get: (key) => this._global.get(key),
      getKeysByPrefix: (prefix) => this._global.getKeysByPrefix(prefix),
      has: (key) => this._global.has(key),
      remove: (key) => this._global.remove(key),
      removeByPrefix: (prefix) => this._global.removeByPrefix(prefix),
      namespace: (namespace) => {
        const namespaceCache = this._getNamespace(namespace);

        return {
          set: ({key, val, ttl}) => namespaceCache.set({key, val, ttl}),
          ttl: ({key, ttl}) => namespaceCache.ttl({key, ttl}),
          get: (key) => namespaceCache.get(key),
          getKeysByPrefix: (prefix) => namespaceCache.getKeysByPrefix(prefix),
          has: (key) => namespaceCache.has(key),
          remove: (key) => namespaceCache.remove(key),
          removeByPrefix: (prefix) => namespaceCache.removeByPrefix(prefix),
          invalidate: () => namespaceCache.invalidate()
        };
      }
    };
  }
}

module.exports = Cache;
