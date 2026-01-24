const Service = require('@mygames/framework-service');
import {development} from './config';

const config = Service.Config.add('development', {
  db: {connection: development.connect.connection},
});

async function start() {
  try {
    const service = new Service(config);
    await service.initialize();

    // Сервер теперь запущен
    console.log('Service initialized and server is running');
  } catch (error) {
    console.error('Failed to start service:', error);
    process.exit(1);
  }
}

start();
