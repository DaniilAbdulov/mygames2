const http = require('http');
const {SemanticAttributes} = require('@opentelemetry/semantic-conventions');
const ConnectionPool = require('../connectionPool');
const {consts} = require('../utils');
const {WrongEventError} = require('../exceptions');

class PlatformEvents {
  constructor(config, serviceEvents, pluginSystem, extensions) {
    this.config = config;
    this.serviceEvents = serviceEvents;
    this._extensions = extensions;
    this._pluginSystem = pluginSystem;
    this._retryItems = [];
    this._failedEventsIntervalHandler = null;
    this._isRetryInProgress = false;

    const {sockets, socketTimeout} = config;

    this._pooler = new ConnectionPool(sockets, socketTimeout, true);
  }

  static get Types() {
    return {
      UNSAFE: 1,
      SAFE: 2,
      QUEUE: 3,
    };
  }

  static get Targets() {
    return {
      SERVICES: 1,
      FRONTEND: 2,
    };
  }

  close() {
    this._pooler.close();
  }

  async receive(request, reply) {
    const serviceEvent = request.body;

    if (!serviceEvent || !serviceEvent.type) {
      return reply.code(500).send();
    }

    let context, pluginFormattedEvent;

    if (this._pluginSystem) {
      context = this._pluginSystem.createContext();
      pluginFormattedEvent = serviceEvent.type
        .split(/\.|\-/)
        .map((part) => part[0].toUpperCase() + part.slice(1))
        .join('');
    }

    try {
      const extensions = await this._extensions.getExtWithContext(
        serviceEvent.type,
        'event',
        null,
        context,
      );

      this.serviceEvents.emit(
        serviceEvent.type,
        serviceEvent,
        extensions,
        context,
      );
      this.serviceEvents.emit('event', serviceEvent, extensions, context);

      reply.code(200).send();
    } catch (err) {
      console.error(
        `Error in processing event '${serviceEvent.type}', error: ${err.message}`,
      );

      span.setAttributes({error: true});

      reply.code(500).send();
    }
  }

  ext() {
    // mode:
    // 1 - unsafe, 2 - safe, 3 - queued (default)
    // target:
    // 1 - service, 2 - frontend
    return {
      sendToServices: async (event, mode = PlatformEvents.Types.QUEUE) => {
        if (!event || !event.type) {
          throw new WrongEventError('Event or type is missing!');
        }

        await this._send(
          {...event, target: PlatformEvents.Targets.SERVICES},
          'path',
          mode,
        );
      },

      sendToFrontend: async (event, mode = PlatformEvents.Types.QUEUE) => {
        if (!event || !event.type) {
          throw new WrongEventError('Event or type is missing!');
        }

        const bothPresent = 'broadcast' in event && 'users' in event;
        const noOnePreset = !('broadcast' in event) && !('users' in event);

        if (bothPresent || noOnePreset) {
          throw new WrongEventError(
            'U should give me targets! (broadcast or array of users)',
          );
        }

        await this._send(
          {...event, target: PlatformEvents.Targets.FRONTEND},
          'path',
          mode,
        );
      },

      cancelDefered: async (event, mode = PlatformEvents.Types.QUEUE) => {
        if (!event || !event.type || !event.entity || !event.entityId) {
          throw new WrongEventError(
            'U should give me correct type, entity and entityId!',
          );
        }

        await this._send(event, 'cancelPath', mode);
      },
    };
  }

  async _send(event, path, mode) {
    try {
      await this._sendToMoon(event, path);
    } catch (err) {
      if (err instanceof WrongEventError) {
        throw err;
      }

      if (mode === PlatformEvents.Types.UNSAFE) {
        throw err;
      } else if (mode === PlatformEvents.Types.QUEUE) {
        this._insertToQueue(event, path);
      }
    }
  }

  _insertToQueue(event, path) {
    const MAX_SIZE = this.config.retryItemsSize;

    if (this._retryItems.length < MAX_SIZE) {
      this._retryItems.push({event, path});
    } else {
      this._logger.error(
        `Failed to add event to retry queue (size already too big > ${MAX_SIZE}), ` +
          `event: ${JSON.stringify(event)}, path: ${path}`,
      );
    }

    this._runRetryInterval();
  }

  // резервный механизм на случай смерти луны: храним в памяти и пытаемся отправить
  _runRetryInterval() {
    /* istanbul ignore next */
    if (this._failedEventsIntervalHandler) {
      return;
    }

    this._failedEventsIntervalHandler = setInterval(async () => {
      /* istanbul ignore next */
      if (this._isRetryInProgress) {
        return;
      }

      this._isRetryInProgress = true;

      for (let i = 0; i < this._retryItems.length; i++) {
        const {event: _event, path: _path} = this._retryItems[i];

        try {
          if (this._retryItems[i]) {
            // так и должно быть, это механизм восстановления
            // eslint-disable-next-line no-await-in-loop
            await this._sendToMoon(_event, _path);
          } else {
            /* istanbul ignore next */
            continue;
          }

          this._retryItems[i] = null;
        } catch (err) {
          // ok, lets try later
        } finally {
          // eslint-disable-next-line no-await-in-loop
          await this._sleep(this.config.retrySleepBetweenItems);
        }
      }

      this._retryItems = this._retryItems.filter(Boolean);

      if (!this._retryItems.length) {
        clearInterval(this._failedEventsIntervalHandler);
        this._failedEventsIntervalHandler = null;
      }
      this._isRetryInProgress = false;
    }, this.config.retryInterval);
  }

  /* istanbul ignore next */
  _sleep(timeToSleep) {
    return new Promise((resolve) => {
      setTimeout(() => resolve(), timeToSleep);
    });
  }

  _sendToMoon(event, pathKey) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.config.host,
        port: this.config.port,
        method: 'POST',
        timeout: this.config.timeout,
        path: this.config[pathKey],
        headers: {
          'Content-Type': 'application/json',
        },
        agent: this._pooler.getPool(`${this.config.host}:${this.config.port}`),
      };

      const req = http.request(options, (res) => {
        res.setEncoding('utf8');

        res.on('data', () => {
          // i dont need this data, but w/o it doesnt work
        });

        res.on('end', () => {
          if (res.statusCode === 400) {
            reject(new WrongEventError('Rejected by core'));

            return;
          }
          if (res.statusCode >= 500) {
            reject(new Error(`Status code: ${res.statusCode}`));

            return;
          }

          resolve();
        });
      });

      req.on('error', (err) => reject(new Error(err.message)));

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Connection Timeout'));
      });

      event && req.write(Buffer.from(JSON.stringify(event)));
      req.end();
    });
  }
}

module.exports = PlatformEvents;
