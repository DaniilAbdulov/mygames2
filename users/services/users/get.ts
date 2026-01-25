import {ServiceExtensions} from '@daniilabdulov/fastify-auto/dist/types/extensions';

const fields = [
  'id',
  'firstName',
  'middleName',
  'lastName',
  'phone',
  'created_at',
];

export const get = async (userId: number, ext: ServiceExtensions) => {
  const {pg} = ext;

  const [user] = await pg('users').select(fields).where({id: userId});

  if (user) {
    return {
      ...user,
      created_at: new Date(user.created_at).toISOString(),
    };
  }

  return null;
};
