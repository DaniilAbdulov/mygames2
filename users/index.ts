import {createService} from '@daniilabdulov/fastify-auto';
import {getUser} from './routes';
import {development} from './config';

const service = createService({
  name: 'users-service',
  port: 3000,
  prefix: '/api/v1',
  routes: [getUser],
  autoDocs: true,
  dbConnection: development.connect,
});

service.initialize().catch(console.error);
