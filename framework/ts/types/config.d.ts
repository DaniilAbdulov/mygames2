declare class Config {
  DEFAULT_CONFIG: {
    specDoc?: string | object;
    controllers: string;
    buildPath: string;
    db: {
      closeTimeout: number;
      host?: string;
      port?: number;
      user?: string;
      password?: string;
      database?: string;
    };
    api: {
      isEnabled: boolean;
      socketsPerHosts: number;
      socketTimeout: number;
      host: string;
      port: number;
      timeout: number
    };
    events: {
      host: string;
      port: number;
      path: string;
      cancelPath: string;
      timeout: number;
      sockets: number;
      socketTimeout: number;
      retryInterval: number;
      retryItemsSize: number;
      retrySleepBetweenItems: number;
    };
    plugins: {
      isEnabled: boolean;
      etcd: string[],
      logs: {
        host: string;
        port: number;
        database: string;
        maxRowsToRead: number;
        password: string;
        requestTimeout: number;
        user: string;
        maxSockets: number;
        socketTimeout: number;
        flushInterval: number;
      };
    };
    jaeger: {
      enable: boolean;
      isTcp: boolean;
      agent: {
        host: string;
        port: number;
      };
      collector: {
        host: string;
        port: number;
      };
    };
    host: string;
    redis: {
      host: string;
      port: number;
      password: string;
      cacheDb: number;
      pubDb: number;
      subDb: number;
      maxKeySizeInMb: number;
    };
    serviceControllerType: string;
    specFolder: string;
    delayBeforeDie: number;
    catalogs: {
      sizeToCache: number;
      cacheTime: number;
      maxCacheTime: number;
      ratePeriod: number;
      rateToCache: number;
    };
    alwaysFullDebugInfo: boolean;
    clickhouse: {
      maxSockets: number;
      socketTimeout: number;
      flushInterval: number;
    }
  };
  add(env: string, conf?: object): Config;
  get(): object;
}

export = Config;
