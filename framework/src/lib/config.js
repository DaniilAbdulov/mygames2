const fs = require('fs');
const merge = require('lodash.merge');
const pathModule = require('path');

class Config {
  constructor() {
    this._conf = {};
    this._env = process.env.NODE_ENV || 'development';

    const {
      CONTROLLERS,
      BUILD_PATH,
      WEB_HOST,
      CLOSE_TIMEOUT,
      SERVICE_NAME,
      ENABLE_API,
      API_POOL_SOCKETS_PER_HOSTS,
      API_POOL_SOCKET_TIMEOUT,
      EVENTS_HOST,
      EVENTS_PORT,
      EVENTS_PATH,
      EVENTS_TIMEOUT,
      EVENTS_SOCKETS,
      EVENTS_SOCKET_TIMEOUT,
      EVENTS_RETRY_INTERVAL,
      EVENTS_RETRY_ITEMS_SIZE,
      EVENTS_RETRY_SLEEP_BETWEEN_ITEMS,
      REDIS_HOST,
      REDIS_PORT,
      REDIS_PASSWORD,
      SERVICE_CONTROLLER_TYPE,
      SPEC_FOLDER,
      DELAY_BEFORE_DIE,
      EVENTS_CANCEL_PATH,
      REDIS_CACHE_DB,
      REDIS_PUB_DB,
      REDIS_SUB_DB,
      REDIS_FEATURE_FLAGS_DB,
      REDIS_MAX_KEY_SIZE,
      API_HOST,
      API_PORT,
      API_TIMEOUT,
      LOCKS_TIMEOUT,
      LOCKS_MAX_ATTEMPTS,
      LOCKS_TOKEN_LENGTH,
      ACCESS_CONTROL_BUFFER_SIZE,
      ACCESS_CONTROL_TTL,
    } = process.env;

    this.DEFAULT_CONFIG = {
      specDoc: SERVICE_NAME || null,
      controllers: CONTROLLERS || './controllers',
      buildPath: this._getBuildPath(BUILD_PATH),
      db: {
        closeTimeout: Number(CLOSE_TIMEOUT) || 300, // in seconds
      },
      replica: null,
      archive: null,
      api: {
        isEnabled: this._safeJsonParse(ENABLE_API) || false,
        socketsPerHosts: this._safeJsonParse(API_POOL_SOCKETS_PER_HOSTS) || 5,
        socketTimeout: this._safeJsonParse(API_POOL_SOCKET_TIMEOUT) || 4000,
        host: this._safeJsonParse(API_HOST) || 'io',
        port: this._safeJsonParse(API_PORT) || 10109,
        timeout: this._safeJsonParse(API_TIMEOUT) || 20000,
      },
      events: {
        host: EVENTS_HOST || 'moon',
        port: this._safeJsonParse(EVENTS_PORT) || 10106,
        path: EVENTS_PATH || '/event',
        cancelPath: EVENTS_CANCEL_PATH || '/cancel',
        timeout: this._safeJsonParse(EVENTS_TIMEOUT) || 5000,
        sockets: this._safeJsonParse(EVENTS_SOCKETS) || 5,
        socketTimeout: this._safeJsonParse(EVENTS_SOCKET_TIMEOUT) || 4000,
        retryInterval: this._safeJsonParse(EVENTS_RETRY_INTERVAL) || 5000,
        retryItemsSize: this._safeJsonParse(EVENTS_RETRY_ITEMS_SIZE) || 5000,
        retrySleepBetweenItems:
          this._safeJsonParse(EVENTS_RETRY_SLEEP_BETWEEN_ITEMS) || 200,
      },
      host: WEB_HOST || 'mygames.abudlovdb.team',
      redis: {
        host: REDIS_HOST || 'localhost',
        port: this._safeJsonParse(REDIS_PORT) || 6379,
        password: REDIS_PASSWORD || undefined,
        cacheDb: this._safeJsonParse(REDIS_CACHE_DB) || 5,
        pubDb: this._safeJsonParse(REDIS_PUB_DB) || 2,
        subDb: this._safeJsonParse(REDIS_SUB_DB) || 1,
        featureFlagDb: this._safeJsonParse(REDIS_FEATURE_FLAGS_DB) || 8,
        maxKeySizeInMb: this._safeJsonParse(REDIS_MAX_KEY_SIZE) || 1,
      },
      cache: {
        namespaces: {},
      },
      serviceControllerType: SERVICE_CONTROLLER_TYPE || 'cloud',
      specFolder: SPEC_FOLDER || 'spec',
      delayBeforeDie: this._safeJsonParse(DELAY_BEFORE_DIE) || 100,
      locks: {
        timeout: this._safeJsonParse(LOCKS_TIMEOUT) || 200,
        maxAttempts: this._safeJsonParse(LOCKS_MAX_ATTEMPTS) || 5,
        tokenLength: this._safeJsonParse(LOCKS_TOKEN_LENGTH) || 32,
      },
      accessControl: {
        bufferSize: this._safeJsonParse(ACCESS_CONTROL_BUFFER_SIZE) || 100,
        ttl: this._safeJsonParse(ACCESS_CONTROL_TTL) || 60 * 60,
      },
    };
  }

  _safeJsonParse(toParse) {
    if (toParse === undefined) {
      return null;
    }

    try {
      return JSON.parse(toParse);
    } catch (_) {
      return null;
    }
  }

  _isTsService() {
    // eslint-disable-next-line
    return fs.existsSync(pathModule.resolve(process.cwd(), 'tsconfig.json'));
  }

  _getBuildPath(buildPath) {
    return this._isTsService()
      ? buildPath || this._getDefaultTsBuildPath()
      : '.';
  }

  _getDefaultTsBuildPath() {
    const defaultPath = './build';

    // eslint-disable-next-line
    return fs.existsSync(defaultPath) ? defaultPath : '.';
  }

  add(env, conf = {}) {
    if (!env || !conf || typeof conf !== 'object') {
      throw new Error('env or conf is bad');
    }

    if (
      !conf.specDoc &&
      this._conf.development &&
      this._conf.development.specDoc
    ) {
      conf.specDoc = this._conf.development.specDoc;
    }

    this._conf[env] = merge({}, this.DEFAULT_CONFIG, conf);

    return this;
  }

  get() {
    if (!this._conf[this._env]) {
      return this.DEFAULT_CONFIG;
    }

    return this._conf[this._env];
  }
}

module.exports = Config;
