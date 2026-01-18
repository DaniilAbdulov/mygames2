'use strict';

const fs = require('fs');
const pathModule = require('path');
const {URL} = require('url');

const {Router, RequestValidator, ErrorMiddleware} = require('./middleware');
const fastify = require('./utils/server');
const StreamConverter = require('./utils/stream');
const {getHash, states} = require('./utils');
const Sender = require('./api/sender');
const {
  ConfigConstructor,
  ExtLoader,
  PlatformEvents,
  RedisConnect,
  Coordinator,
} = require('./lib');
const {NoAccessError, RuntimeError} = require('./exceptions');
const SpecLoader = require('./specLoader');
const ConnectionPool = require('./connectionPool');
const {Plugin, Hook, Extension} = require('./classes');
const Processes = require('./processes');

class Service {
  constructor(config) {
    const settings = config
      ? config.get()
      : new ConfigConstructor().add('production').get();

    this._config = settings;
    this._port = 8181;
    this._server = {url: 'http://localhost:8181'};
    this._app = fastify();
    this._redisConnect = new RedisConnect(this._config.redis);
    this._controllers = {};
    this._pluginSystem = null;
    this._extensions = new ExtLoader(this._sender);
    this._hash = null;
    this._labels = null;

    process.on('warning', (warn) =>
      console.log(`Found warning: ${warn.stack}`),
    );
    process.on('SIGTERM', (signal) => this._handleExit(signal));
    process.on('SIGINT', (signal) => this._handleExit(signal));
    process.on('uncaughtExceptionMonitor', (err, origin) => {
      console.log(`Core uncaught exception (${origin}): ${err.stack}`);

      Processes.syncUnregister(global.serviceName, this._port);
    });
  }

  _handleExit(signal) {
    console.log(`App has stopped with a signal: ${signal}`);

    this._terminateService();
  }

  terminate() {
    this._terminateService();
  }

  async _terminateService() {
    const {delayBeforeDie} = this._config;

    states.setTermination();

    if (this._coordinator) {
      await this._coordinator.onTerminate();
    }

    if (delayBeforeDie >= 1000) {
      console.log(
        `Wait ${delayBeforeDie / 1000} seconds until all work is done`,
      );

      setTimeout(async () => {
        await this._closeAll();
      }, delayBeforeDie);
    } else {
      await this._closeAll();
    }
  }

  async _closeAll() {
    await this._app.close();
    this._redisConnect?.close();
    this._extensions?.close();
    this._pluginSystem?.close();
    this._sender?.close();
    this._platformEvents?.close();
    this._clickhouseConnect?.close();

    process.exit(0);
  }

  async _loadSchema() {
    const loader = new SpecLoader(
      this._config.specDoc,
      this._config.specFolder,
    );

    this._fullSchema = await loader.resolve();
    this._hash = getHash(JSON.stringify(this._fullSchema));

    global.serviceName = this._fullSchema.info.title.toLowerCase();
  }

  _transformPath(specPath) {
    specPath = specPath.replace(/{/g, ':').replace(/}/g, '');

    const {url: server} = this._server;
    const {pathname} = new URL(server);

    return `${pathname}/${specPath}`.replace(/\/{2,}/g, '/');
  }

  async _initCoreComponents() {
    process.title = global.serviceName;

    const redisChannelPub = this._redisConnect.getChannel(
      this._config.redis.pubDb,
    );
    const redisChannelSub = this._redisConnect.getChannel(
      this._config.redis.subDb,
    );

    this._coordinator = new Coordinator(
      [redisChannelPub, redisChannelSub],
      this._port,
      this._hash,
      this._labels,
    );

    await this._coordinator.load();

    this._coordinator.on('action', (type, value) => {
      this._events.emit(
        'action',
        type,
        value,
        this._extensions.getExtWithContext(type, 'customAction'),
      );
    });
  }

  _registerControllers() {
    const {controllers: controllersPath, buildPath} = this._config;

    // lint disabled, cos sync operation doing only on init

    const files = fs.readdirSync(
      pathModule.resolve(process.cwd(), buildPath, controllersPath),
    ); // eslint-disable-line

    for (const file of files) {
      const filePath = pathModule.resolve(
        process.cwd(),
        buildPath,
        controllersPath,
        file,
      );
      const stats = fs.statSync(filePath); // eslint-disable-line

      if (!stats.isFile()) {
        continue;
      }

      const {name, ext} = pathModule.parse(filePath);

      if (ext !== '.js') {
        continue;
      }

      console.log(`Loading controller ${name}`);

      try {
        this._controllers[name] = require(filePath); // eslint-disable-line
      } catch (err) {
        console.log(
          `Error while loading handler ${name}${ext}: ${err.message}`,
        );
      }
    }
  }

  _registerPaths() {
    const allowedMethods = [
      'get',
      'post',
      'put',
      'patch',
      'delete',
      'head',
      'options',
    ];

    const {paths} = this._fullSchema;
    const errorBuilder = new ErrorMiddleware();
    const errorHandler = errorBuilder.middleware();

    for (const path in paths) {
      for (const method in paths[path]) {
        if (!allowedMethods.includes(method)) {
          continue;
        }

        const serverPath = this._transformPath(path);

        console.log(`Register: ${method.toUpperCase()} - ${serverPath}`);

        const requestedSchema = this._fullSchema.paths[path];
        const operationName = Router.getHandler(requestedSchema, method);
        const controllerName = Router.getControllerName(
          requestedSchema,
          method,
        );

        const {parameters: methodParameters = []} = paths[path][method];
        const {parameters: pathParameters = []} = paths[path];
        const parameters = RequestValidator.filterParams(
          methodParameters,
          pathParameters,
        );

        const operation =
          this._controllers[controllerName] &&
          this._controllers[controllerName][operationName];

        const opt = {
          onRequest(request, reply, done) {
            request.operationName = operationName;
            request.vars = {};
            request.span = null;
            request.traceContext = {};

            if (states.isTerminating) {
              reply.header('connection', 'close');
            } else if (request.headers.connection === 'keep-alive') {
              reply.header('connection', 'keep-alive');
            }

            done();
          },
          errorHandler,
        };

        this._app[method](serverPath, opt, async (request, reply) => {
          new RequestValidator(
            request,
            this._fullSchema,
            path,
            parameters,
          ).start();

          const router = new Router(
            request,
            reply,
            controllerName,
            requestedSchema[method],
            operation,
            this._extensions,
            this._pluginSystem,
          );

          await router.start();
        });
      }
    }
  }

  _registerUi() {
    console.log('Register schema path');

    const binary = new StreamConverter(JSON.stringify(this._fullSchema));

    this._app.get('/docs/schema', (_, reply) => {
      reply.header('Content-Type', 'application/json');
      reply.header('X-SCHEMA-HASH', this._hash);
      reply.send(binary.getStream());
    });
  }

  _registerDatabase() {
    if (this._config.db && this._config.db.connection) {
      this.useCustomExtension('postgres');
    }
  }

  _registerApi() {
    if (this._config.api.isEnabled) {
      this.useCustomExtension('api');
    }
  }

  _registerBasic() {
    console.log('Register basic');

    this.useCustomExtension('config');
    this.useCustomExtension('events');
  }

  _registerHealth() {
    console.log('Register health path');

    this._app.get('/activation', (_, reply) => {
      states.setReady();

      reply.code(200).send();

      setTimeout(() => {
        this._emitEvent('activation');
      }, 2000);
    });

    this._app.get('/health', (_, reply) => {
      reply
        .header('x-name', global.serviceName || '')
        .code(states.isPreparing ? 503 : 200)
        .send();
    });
  }

  _registerEvents() {
    console.log('Register events path');

    this._platformEvents = new PlatformEvents(
      this._config.events,
      this._pluginSystem,
      this._extensions,
    );

    this._app.post('/onevent', (request, reply) => {
      this._platformEvents.receive(request, reply);
    });
  }

  async _initExts() {
    await this._extensions.load(
      this._platformEvents,
      this._redisConnect,
      this._config,
      this._coordinator,
    );
  }

  _parseServer() {
    if (!this._fullSchema.servers || !this._fullSchema.servers.length) {
      console.log('No servers found in spec file, added http://localhost:8181');
    } else {
      this._fullSchema.servers.forEach((server) => {
        let {url} = server;
        const {variables} = server;

        /* istanbul ignore else */
        if (variables) {
          Object.keys(variables).forEach((key) => {
            const {default: defaultVal} = variables[key];

            url = url.replace(`{${key}}`, defaultVal);
          });
        }

        /* istanbul ignore else */
        if (server['x-env'] === (process.env.NODE_ENV || 'development')) {
          const {origin, port} = new URL(url);

          this._server = {url: origin};
          this._port = port;
        }
      });
    }
  }

  use(Ext) {
    this._extensions.add(Ext);
  }

  // todo delete in new major version
  set Dependencies(value) {
    // do nothing 4 now
  }

  useCustomExtension(extName) {
    if (!extName) {
      return;
    }

    console.log(`Register ${extName} ext`);

    try {
      const Extension = require(`../extensions/${extName}`); // eslint-disable-line

      this._extensions.add(Extension, true);
    } catch (err) {
      if (err.message.indexOf('Cannot find module') !== -1) {
        throw new ReferenceError(
          `Custom extension '${extName}' was not found!`,
        );
      }

      throw err;
    }
  }

  setLabel(key, val) {
    if (!this._labels) {
      this._labels = {};
    }

    this._labels[key] = val;
  }

  get Events() {
    return this._events;
  }

  get SyncEvents() {
    return this._syncEvents;
  }

  static get EventModes() {
    return PlatformEvents.Types;
  }

  get Address() {
    return this._server.url;
  }

  static get Config() {
    return new ConfigConstructor();
  }

  static get Exceptions() {
    return {NoAccessError, RuntimeError};
  }

  static get Extension() {
    return Extension;
  }

  static get Plugin() {
    return Plugin;
  }

  static get Hook() {
    return Hook;
  }

  static get ConnectionPool() {
    return ConnectionPool;
  }

  static get SpecLoader() {
    return SpecLoader;
  }

  static get ClickHouseQueryBuilder() {
    return ClickHouseQueryBuilder;
  }

  async initialize() {
    await this._loadSchema();
    this._parseServer();
    await this._initCoreComponents();

    this._registerControllers();
    this._registerHealth();
    this._registerUi();
    this._registerDatabase();
    this._registerApi();
    this._registerBasic();
    this._registerEvents();
    await this._initExts();
    this._registerPaths();

    const socket = await this._app.listen({port: this._port, host: '0.0.0.0'});

    await this._coordinator.onInit();

    console.log(socket);

    return socket;
  }
}

module.exports = Service;
