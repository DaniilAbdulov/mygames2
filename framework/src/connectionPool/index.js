const http = require('http');
const https = require('https');

class ConnectionPool {
  /**
   * @param {number} maxSocketsPerHost - максимальное количество открытых сокетов для одного хоста
   * @param {number} socketTimeout - таймаут в миллисекундах
   * @param {boolean} isHttp - инициализировать http версию агента
   */
  constructor(maxSocketsPerHost = 10, socketTimeout, isHttp = false) {
    const Agent = isHttp ? http.Agent : https.Agent;

    this._pool = new Agent({
      keepAlive: true,
      maxFreeSockets: maxSocketsPerHost,
      keepAliveMsecs: 2000,
      maxSockets: maxSocketsPerHost,
      scheduling: 'lifo',
      timeout: socketTimeout
    });
    this.isHttp = isHttp;
  }

  /**
   * @param {string} hostname
   * @return {Socket[]}
   * @private
   */
  _getHostSockets(hostname) {
    const {sockets} = this._pool;
    const entries = Object.entries(sockets);

    return entries
      .filter(([host]) => host.indexOf(hostname) > -1)
      .flatMap(([, hostSockets]) => hostSockets);
  }

  /**
   * @param {string} hostname
   * @return {boolean}
   * @private
   */
  _isPoolHasFreeConnections(hostname) {
    const {maxSockets} = this._pool;
    const hostSockets = this._getHostSockets(hostname);

    return hostSockets.length < maxSockets;
  }

  /**
   * @param {string} hostname
   * @return {Agent|Agent}
   */
  getPool(hostname) {
    return this._isPoolHasFreeConnections(hostname) ?
      this._pool :
      this.defaultPool;
  }

  getSocketsCount() {
    const result = {};

    for (const host in this._pool.sockets) {
      result[host] = this._pool.sockets[host].length;
    }

    for (const host in this._pool.freeSockets) {
      const freeSocketsCount = this._pool.freeSockets[host].length;

      if (host in result) {
        result[host] += freeSocketsCount;
      } else {
        result[host] = freeSocketsCount;
      }
    }

    return result;
  }

  close() {
    this._pool.destroy();
  }

  get defaultPool() {
    return this.isHttp ? http.globalAgent : https.globalAgent;
  }
}

module.exports = ConnectionPool;
