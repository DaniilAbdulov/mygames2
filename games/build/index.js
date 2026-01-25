"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_auto_1 = require("@daniilabdulov/fastify-auto");
const routes_1 = require("./routes");
const config_1 = require("./config");
const service = (0, fastify_auto_1.createService)({
    name: 'games-service',
    port: 3001,
    prefix: '/api/v1',
    routes: [routes_1.getGames, routes_1.createGame],
    autoDocs: true,
    dbConnection: config_1.development.connect,
});
service.initialize().catch(console.error);
