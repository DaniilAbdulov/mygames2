import http = require('http');
import https = require('https');

declare class ConnectionPool {
    constructor(maxSocketsPerHost: number, socketTimeout: number, isHttp?: boolean);
    getPool(hostname: string): http.Agent | https.Agent;
    get defaultPool(): http.Agent | https.Agent;
}

export = ConnectionPool;
