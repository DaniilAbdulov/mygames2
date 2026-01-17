import Redis from 'ioredis';

export class RedisCache {
  client;
  isConnected;
  redisClient;
  cache;

  constructor(connection) {
    this.client = null;
    this.isConnected = false;

    this._initCache(connection);
  }

  _initCache = async (connection) => {
    try {
      this.redisClient = new Redis({
        host: connection.host,
        port: connection.port,
        password: connection.password,
        db: connection.db,
        keyPrefix: connection.keyPrefix,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          console.log(`Retrying Redis connection in ${delay}ms...`);
          return delay;
        },
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
      });

      this.redisClient.on('connect', () => {
        console.log('✅ Redis connected successfully');
      });

      this.redisClient.on('error', (error) => {
        console.log(error);
        console.error('❌ Redis connection error:', error.message);
      });

      this.redisClient.on('ready', () => {
        console.log('✅ Redis client is ready');
      });

      this.redisClient.on('reconnecting', () => {
        console.log('🔄 Redis reconnecting...');
      });

      this.cache = {
        add: async (key, value, ttl = null) => {
          try {
            const ttlToUse = ttl !== null ? ttl : connection.ttl;
            const serializedValue = JSON.stringify(value);

            if (ttlToUse > 0) {
              await this.redisClient.setex(key, ttlToUse, serializedValue);
            } else {
              await this.redisClient.set(key, serializedValue);
            }

            return true;
          } catch (error) {
            console.error('Cache add error:', error);
            return false;
          }
        },

        /**
         * Получить значение из кэша
         * @param {string} key - Ключ
         * @returns {Promise<any>}
         */
        get: async (key) => {
          try {
            const value = await this.redisClient.get(key);
            if (!value) return null;

            return JSON.parse(value);
          } catch (error) {
            console.error('Cache get error:', error);
            return null;
          }
        },

        has: async (key) => {
          try {
            const exists = await this.redisClient.exists(key);
            return exists === 1;
          } catch (error) {
            console.error('Cache has error:', error);
            return false;
          }
        },

        delete: async (key) => {
          try {
            const deleted = await this.redisClient.del(key);
            return deleted > 0;
          } catch (error) {
            console.error('Cache delete error:', error);
            return false;
          }
        },

        deleteByPattern: async (pattern) => {
          try {
            const keys = await this.redisClient.keys(pattern);
            if (keys.length === 0) return 0;

            const deleted = await this.redisClient.del(...keys);
            return deleted;
          } catch (error) {
            console.error('Cache deleteByPattern error:', error);
            return 0;
          }
        },

        ttl: async (key) => {
          try {
            return await this.redisClient.ttl(key);
          } catch (error) {
            console.error('Cache ttl error:', error);
            return -2; // -2 означает, что ключ не существует
          }
        },

        expire: async (key, seconds) => {
          try {
            const result = await this.redisClient.expire(key, seconds);
            return result === 1;
          } catch (error) {
            console.error('Cache expire error:', error);
            return false;
          }
        },

        getClient: () => this.redisClient,

        ping: async () => {
          try {
            const result = await this.redisClient.ping();
            return result === 'PONG';
          } catch (error) {
            console.error('Cache ping error:', error);
            return false;
          }
        },

        clear: async () => {
          try {
            await this.redisClient.flushdb();
            return true;
          } catch (error) {
            console.error('Cache clear error:', error);
            return false;
          }
        },

        stats: async () => {
          try {
            const info = await this.redisClient.info();
            const lines = info.split('\r\n');
            const stats = {};

            lines.forEach((line) => {
              const [key, value] = line.split(':');
              if (key && value) {
                stats[key] = value;
              }
            });

            return stats;
          } catch (error) {
            console.error('Cache stats error:', error);
            return {};
          }
        },

        keys: async (pattern = '*') => {
          try {
            return await this.redisClient.keys(pattern);
          } catch (error) {
            console.error('Cache keys error:', error);
            return [];
          }
        },
      };
    } catch (error) {
      console.error('Failed to initialize Redis cache:', error);
      this.cache = null;
    }
  };
}
