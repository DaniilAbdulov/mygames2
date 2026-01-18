const {Extension} = require('../../src/classes');
const LruCache = require('../cache/lruCache');
const AttributesAccessControl = require('./AttributesAccessControl');

class AccessControl extends Extension {
  constructor() {
    super(Extension.Types.DYNAMIC, 'AccessControl', {
      autoExecute: true,
      traceMode: Extension.TraceModeTypes.MANUAL
    });

    this.Key = 'accessControl';
  }

  load({config, redisConnect, metrics}) {
    const CHARS_IN_ONE_MB = 262144; // 4 bytes per char
    const MAX_SIZE = config.redis.maxKeySizeInMb * CHARS_IN_ONE_MB;
    const channel = redisConnect.getChannel(config.redis.cacheDb);

    this._config = config.accessControl;
    this._cache = new LruCache(
      channel,
      this.Logger,
      metrics,
      MAX_SIZE,
      {size: config.accessControl.bufferSize},
      '__access-control:__internal'
    );
  }

  action(ctx) {
    return {
      byAttributes: () => new AttributesAccessControl({
        ...ctx,
        config: this._config,
        cache: this._cache,
        logger: this.Logger
      })
    };
  }
}

module.exports = AccessControl;
