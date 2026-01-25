import {createService} from '@daniilabdulov/fastify-auto';
import {getGames, createGame} from './routes';
import {development} from './config';

const service = createService({
  name: 'games-service',
  port: 3001,
  prefix: '/api/v1',
  routes: [getGames, createGame],
  autoDocs: true,
  dbConnection: development.connect,
});

service.initialize().catch(console.error);
