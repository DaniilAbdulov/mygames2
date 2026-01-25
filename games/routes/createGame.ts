import {HTTPMethods} from '@daniilabdulov/fastify-auto';
import {create} from '../services/games';
import {ServiceExtensions} from '@daniilabdulov/fastify-auto/dist/types/extensions';

export default {
  method: 'POST' as HTTPMethods,
  path: '/games',
  schema: {
    body: {
      type: 'object',
      additionalProperties: false,
      required: ['title', 'year', 'author'],
      properties: {
        title: {type: 'string'},
        year: {type: 'number'},
        author: {type: 'string'},
      },
    },
    response: {},
  },
  handler: ({body}: any, ext: ServiceExtensions) => create(body, ext),
};
