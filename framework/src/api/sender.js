/* eslint-disable prefer-promise-reject-errors */

const http = require('http');
const ConnectionPool = require('../connectionPool');
const {consts} = require('../utils');
const {Metrics} = require('../lib');

class Sender {
  constructor(logger, metrics, config) {
    const {
      api: {socketsPerHosts, socketTimeout, host, port, timeout},
    } = config;

    this._host = host;
    this._port = port;
    this._timeout = timeout;
    this._pooler = new ConnectionPool(socketsPerHosts, socketTimeout, true);

    metrics.registerMetric(consts.METRICS.API_CONNECTION_POOL_SOCKETS_COUNT, {
      type: Metrics.Types.GAUGE,
      name: consts.METRICS.API_CONNECTION_POOL_SOCKETS_COUNT,
      description: 'Api connection pool keep-alive sockets count',
      labels: ['s', 'h'],
      collect: (context) => {
        const sockets = this._pooler.getSocketsCount();

        context.reset();

        for (const socketHost in sockets) {
          context.set({h: socketHost, s: 'balancer'}, sockets[socketHost]);
        }
      },
    });
  }

  close() {
    this._pooler.close();
  }

  _genMeta(headers) {
    if ('x-user' in headers) {
      const userInfo = headers['x-user'];
      const offices = headers['x-offices'];
      const cities = headers['x-cities'];

      const [userId, , sessionId, lang, timezone] = userInfo.split(';');
      const [mainOfficeId, rawOfficesIds] = offices.split(';');
      const [mainCityId, rawCitiesIds] = cities.split(';');

      return {
        sessionId,
        userId,
        lang,
        officesIds: rawOfficesIds ? rawOfficesIds.split(',') : undefined,
        mainOfficeId,
        citiesIds: rawCitiesIds ? rawCitiesIds.split(',') : undefined,
        mainCityId,
        timezone,
      };
    }

    return {};
  }

  _parseContent(content, type) {
    if (type.indexOf('application/json') !== -1) {
      try {
        return JSON.parse(content);
      } catch (err) {
        return content;
      }
    }

    return content;
  }

  ask(askInfo) {
    const {
      service,
      method,
      body,
      params,
      disableRights,
      timeout,
      type,
      span,
      reqHeaders,
      from,
    } = askInfo;

    let traceInfo;

    if (span) {
      const {traceId, spanId, traceFlags} = span.spanContext();

      traceInfo = [traceId, spanId, traceFlags];
    }

    return new Promise((resolve, reject) => {
      const balancerBody = {
        method,
        service,
        body,
        params,
        sessionInfo: this._genMeta(reqHeaders),
        trace: traceInfo,
        disableRights,
        debug: reqHeaders['x-debug'] === '1',
        timeout,
        app: reqHeaders['x-app'],
        type,
      };
      const options = {
        hostname: this._host,
        port: this._port,
        method: 'POST',
        timeout: this._timeout,
        path: '/proxy/method',
        headers: {
          'Content-Type': 'application/json',
          'X-FROM': from,
        },
        agent: this._pooler.getPool(`${this._host}:${this._port}`),
      };

      this._logger.debug(`Http headers: ${JSON.stringify(options.headers)}`);

      const req = http.request(options, (res) => {
        res.setEncoding('utf8');
        const response = [];

        res.on('data', (chunk) => response.push(chunk));

        res.on('end', () => {
          if (res.statusCode >= 400) {
            let reason;

            try {
              reason = JSON.parse(response.join(''));
            } catch (err) {
              reason = response.join('');
            }

            const errCode = res.headers['x-ecode'];
            const result = {
              status: res.statusCode,
              response: reason,
            };

            if (errCode) {
              result.code = Number(errCode);
            }

            return reject(result);
          }

          resolve(
            this._parseContent(response.join(''), res.headers['content-type']),
          );
        });
      });

      req.on('error', (error) => {
        if (req.destroyed) {
          return;
        }

        const response = {reason: error.message, meta: {stack: error.stack}};

        reject({
          status: 502,
          response,
        });
      });

      req.on('timeout', () => {
        reject({
          status: 504,
        });
        req.destroy();
      });

      req.write(JSON.stringify(balancerBody));
      req.end();
    });
  }
}

module.exports = Sender;
