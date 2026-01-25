import {HTTPMethods} from '@daniilabdulov/fastify-auto';
import {ServiceExtensions} from '@daniilabdulov/fastify-auto/dist/types/extensions';
import {get} from '../services/users';

export default {
  method: 'GET' as HTTPMethods,
  path: '/users/:userId',
  schema: {
    params: {
      userId: {type: 'number'},
    },
    response: {
      200: {
        type: 'object',
        additionalProperties: false,
        properties: {
          id: {type: 'number'},
          firstName: {type: 'string'},
          middleName: {type: 'string', nullable: true},
          lastName: {
            type: 'string',
          },
          phone: {type: 'string'},
          created_at: {type: 'string', format: 'date-time'},
        },
      },
    },
  },
  handler: ({params}: any, ext: ServiceExtensions) => {
    const {userId} = params;

    return get(userId, ext);
  },
};
