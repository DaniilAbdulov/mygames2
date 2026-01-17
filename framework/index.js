const path = require('path');
const fs = require('fs');
const fastify = require('fastify');
const cors = require('@fastify/cors');
const {default: fastifySensible} = require('@fastify/sensible');
const {RedisCache} = require('./classes/RedisCache');

class Service {
  options;
  server;
  handlers = new Map();
  routes = [];
  cache = null;

  constructor(options) {
    this.options = {
      port: Number(process.env.PORT) || 3000,
      host: process.env.HOST || '0.0.0.0',
      schemasDir: path.join(process.cwd(), 'src', 'schemas'),
      controllersDir: path.join(process.cwd(), 'src', 'controllers'),
      prefix: process.env.API_PREFIX || '/api/v1',
      logger: process.env.NODE_ENV !== 'production',
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        db: Number(process.env.REDIS_DB) || 0,
        keyPrefix: process.env.REDIS_KEY_PREFIX || 'redis:',
        ttl: Number(process.env.REDIS_TTL) || 3600, // время жизни кэша в секундах
        enable: process.env.REDIS_ENABLE !== 'false', // возможность отключить кэш
      },
      ...options,
    };

    this.server = fastify({
      logger: this.options.logger,
      disableRequestLogging: process.env.NODE_ENV === 'production',
    });

    this.cache = new RedisCache(this.options.redis).cache;
  }

  async loadControllers() {
    const controllersDir = this.options.controllersDir;

    if (!fs.existsSync(controllersDir)) {
      console.log('⚠️  No controllers directory found');
      return;
    }

    try {
      const findFiles = (dir) => {
        let results = [];
        const items = fs.readdirSync(dir);

        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory()) {
            results = results.concat(findFiles(fullPath));
          } else if (item.endsWith('.ts')) {
            results.push(fullPath);
          }
        }
        return results;
      };

      const controllerFiles = findFiles(controllersDir);
      console.log(`Found ${controllerFiles.length} controller files to load`);

      for (const filePath of controllerFiles) {
        try {
          console.log(
            `Loading controller: ${path.relative(process.cwd(), filePath)}`,
          );

          delete require.cache[filePath];
          const controllerModule = require(filePath);

          Object.entries(controllerModule).forEach(([name, handler]) => {
            if (typeof handler === 'function') {
              // Внедряем кэш в каждый handler
              const wrappedHandler = async (data) => {
                const result = await handler(data);
                return result;
              };

              // Добавляем кэш в контекст handler'а
              wrappedHandler.cache = this.cache;

              this.handlers.set(name, wrappedHandler);
              console.log(`  ✅ Loaded controller: ${name}`);
            }
          });
        } catch (error) {
          console.error(
            `  ❌ Failed to load controller ${filePath}:`,
            error.message,
          );
        }
      }
    } catch (error) {
      console.error('❌ Error loading controllers:', error);
    }
  }

  async loadSchemasWithRoutes() {
    const schemasDir = this.options.schemasDir;

    if (!fs.existsSync(schemasDir)) {
      console.log('⚠️  No schemas directory found');
      return;
    }

    try {
      const findFiles = (dir) => {
        let results = [];
        const items = fs.readdirSync(dir);

        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory()) {
            results = results.concat(findFiles(fullPath));
          } else if (item.endsWith('.ts')) {
            results.push(fullPath);
          }
        }
        return results;
      };

      const schemaFiles = findFiles(schemasDir);

      for (const filePath of schemaFiles) {
        try {
          const normalizedPath = filePath.replace(/\\/g, '/');
          const modulePath = `file:///${normalizedPath}`;

          const schemaModule = await import(modulePath);
          console.log(`Successfully imported: ${filePath}`);

          Object.entries(schemaModule).forEach(([name, item]) => {
            if (name.endsWith('Routes') && Array.isArray(item)) {
              this.routes.push(...item);
            } else if (
              item &&
              typeof item === 'object' &&
              'method' in item &&
              'path' in item
            ) {
              this.routes.push(item);
            }
          });
        } catch (error) {
          console.error(`❌ Failed to load schema ${filePath}:`, error.message);
          console.error('Stack:', error.stack);
        }
      }
    } catch (error) {
      console.error('❌ Error loading schemas:', error);
    }
  }

  createRequestHandler(handlerName) {
    return async (request, reply) => {
      try {
        const handler = this.handlers.get(handlerName);

        if (!handler) {
          return reply.code(404).send({
            success: false,
            error: 'Handler not found',
            code: 'HANDLER_NOT_FOUND',
            timestamp: new Date().toISOString(),
          });
        }

        const handlerData = {
          ...request.body,
          ...request.params,
          ...request.query,
          headers: request.headers,
          user: request.user,
          ext: {
            cache: this.cache,
          },
        };

        console.log(`request.body`, request.body);
        console.log(`request.params`, request.params);
        console.log(`request.query`, request.query);

        const result = await handler(handlerData);

        return result;
      } catch (error) {
        console.log(`error`, error);
        if (error.statusCode && error.code) {
          return reply.code(error.statusCode).send({
            success: false,
            error: error.message,
            code: error.code,
            details: error.details,
            timestamp: new Date().toISOString(),
          });
        }

        if (error.validation) {
          return reply.code(400).send({
            success: false,
            error: 'Validation error',
            code: 'VALIDATION_ERROR',
            details: error.validation.map((v) => ({
              field: v.instancePath,
              message: v.message,
            })),
            timestamp: new Date().toISOString(),
          });
        }

        console.error('Handler error:', error);
        this.server.log.error(error);

        return reply.code(500).send({
          success: false,
          error: 'Internal server error',
          code: 'INTERNAL_ERROR',
          timestamp: new Date().toISOString(),
        });
      }
    };
  }

  validateResponse = () => true;

  async registerRoutes() {
    for (const route of this.routes) {
      const fullPath = `${this.options.prefix}${route.path}`;
      const handler = this.createRequestHandler(route.handler);

      const {method, path, handler: _, description, tags, ...schema} = route;

      this.server.route({
        method,
        url: fullPath,
        schema,
        handler,
      });
    }
  }

  async initialize() {
    try {
      await this.server.register(cors, {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
      });

      await this.server.register(fastifySensible);

      console.log('📦 Loading controllers and schemas...');

      await this.loadControllers();
      await this.loadSchemasWithRoutes();

      console.log(
        `📊 Loaded ${this.handlers.size} controllers and ${this.routes.length} routes`,
      );

      // Добавляем endpoint для управления кэшем
      this.server.get('/cache/stats', async (request, reply) => {
        if (!this.cache) {
          return reply.code(503).send({
            success: false,
            error: 'Cache is not available',
            code: 'CACHE_UNAVAILABLE',
            timestamp: new Date().toISOString(),
          });
        }

        const stats = await this.cache.stats();
        return {
          success: true,
          data: stats,
          timestamp: new Date().toISOString(),
        };
      });

      this.server.delete('/cache/clear', async (request, reply) => {
        if (!this.cache) {
          return reply.code(503).send({
            success: false,
            error: 'Cache is not available',
            code: 'CACHE_UNAVAILABLE',
            timestamp: new Date().toISOString(),
          });
        }

        // добавь проверку авторизации!

        const cleared = await this.cache.clear();
        return {
          success: cleared,
          message: cleared
            ? 'Cache cleared successfully'
            : 'Failed to clear cache',
          timestamp: new Date().toISOString(),
        };
      });

      await this.registerRoutes();

      await this.server.listen({
        port: this.options.port,
        host: this.options.host,
      });

      console.log(`
🚀 Server started
📡 URL: http://${this.options.host}:${this.options.port}${this.options.prefix}
📊 Routes registered: ${this.routes.length}
📋 Controllers loaded: ${this.handlers.size}
🧠 Redis cache: ${this.cache ? 'Enabled ✅' : 'Disabled ❌'}
${
  this.cache
    ? `🔗 Redis: ${this.options.redis.host}:${this.options.redis.port}`
    : ''
}
      `);
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  async close() {
    if (this.redisClient) {
      await this.redisClient.quit();
      console.log('Redis connection closed');
    }

    if (this.server) {
      await this.server.close();
    }
  }
}

module.exports = {Service};
