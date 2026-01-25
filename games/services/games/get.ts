import {ServiceExtensions} from '@daniilabdulov/fastify-auto/dist/types/extensions';

export const get = async (limit: number, ext: ServiceExtensions) => {
  const {pg} = ext;

  const games = await pg('games')
    .select(['games.id', 'games.title', 'games.year', 'authors.name as author'])
    .leftJoin('authors', 'games.author_id', 'authors.id')
    .limit(limit);

  return games;
};
