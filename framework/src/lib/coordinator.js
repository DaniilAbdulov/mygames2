const fs = require('fs/promises');
const path = require('path');
const EventEmitter = require('events');
const os = require('os');
const {states} = require('../utils');

class Coordinator extends EventEmitter {
  constructor(redis, logger, servicePort, schemaHash, labels) {
    super();

    this._redisPub = redis[0];
    this._redisSub = redis[1];
    this._port = servicePort;
    this._schemaHash = schemaHash;
    this._labels = labels;
  }

  async load() {
    try {
      await this._redisSub.subscribe(
        [global.serviceName, 'ping'],
        (channel, message) => {
          if (channel === global.serviceName) {
            const {type, value} = JSON.parse(message);

            if (type === 'debug') {
            } else if (type === 'ping') {
              this._onPing();
            } else {
              this.emit('action', type, value);
            }
          } else if (channel === 'ping') {
            this._onPing();
          }
        },
      );
    } catch (err) {
      console.log(err);
    }
  }

  async onTerminate() {
    try {
      console.info('Unregistering from dispatcher');

      await this._redisPub.publish(
        'services',
        JSON.stringify({
          type: 'unregister',
          service: global.serviceName,
          url: `http://${Coordinator.getMyIp()}:${this._port}`,
        }),
      );
    } catch (err) {
      console.error(`Unregister failed; ${err.message}}`);
    }
  }

  async onInit() {
    try {
      console.info('Registering in dispatcher');

      const isTypescript = await fs
        .access(path.resolve(process.cwd(), 'tsconfig.json'))
        .then(() => true)
        .catch(() => false);
      const defaultLabels = {
        runtime: `Node ${process.versions.node}`,
        language: isTypescript ? 'TS' : 'JS',
      };

      await this._redisPub.publish(
        'services',
        JSON.stringify({
          type: 'register',
          service: global.serviceName,
          labels: this._labels
            ? {...this._labels, ...defaultLabels}
            : defaultLabels,
          schemaHash: this._schemaHash,
          url: `http://${Coordinator.getMyIp()}:${this._port}`,
        }),
      );
    } catch (err) {
      console && console.error(`Register failed; ${err.message}}`);
    }
  }

  async _onPing() {
    if (!states.isReady) {
      console.info(
        'Dispatcher requesting register, but service is not ready, ignoring',
      );

      return;
    }

    try {
      console.info('Dispatcher requesting register');

      await this.onInit();
    } catch (err) {
      console.error(`Asking failed; ${err.message}`);
    }
  }

  static getMyIp() {
    const networkInterfaces = os.networkInterfaces();

    for (const iface in networkInterfaces) {
      for (const {address, internal, family} of networkInterfaces[iface]) {
        const familyV4Value = typeof family === 'string' ? 'IPv4' : 4;

        if (!internal && family === familyV4Value) {
          return address;
        }
      }
    }

    return null;
  }
}

module.exports = Coordinator;
