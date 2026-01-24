"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Service = require('@mygames/framework-service');
const config_1 = require("./config");
const config = Service.Config.add('development', {
    db: { connection: config_1.development.connect.connection },
});
async function start() {
    try {
        const service = new Service(config);
        await service.initialize();
        console.log('Service initialized and server is running');
    }
    catch (error) {
        console.error('Failed to start service:', error);
        process.exit(1);
    }
}
start();
