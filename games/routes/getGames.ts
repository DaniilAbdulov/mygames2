import {HTTPMethods} from '@daniilabdulov/fastify-auto';
import {ServiceExtensions} from '@daniilabdulov/fastify-auto/dist/types/extensions';
import {get} from '../services/games';

export default {
  method: 'GET' as HTTPMethods,
  path: '/games',
  schema: {
    query: {
      type: 'object',
      additionalProperties: false,
      properties: {
        limit: {type: 'number', default: 20},
      },
    },
    response: {
      200: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            id: {type: 'number'},
            title: {type: 'string'},
            year: {type: 'number'},
            author: {type: 'string'},
          },
        },
      },
    },
  },
  handler: ({query}: any, ext: ServiceExtensions) => {
    const {limit} = query;

    return get(limit, ext);
  },
};
