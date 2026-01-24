export const get = async ({limit}: {limit: number}, ext: any) => {
  const {pg} = ext;

  const games = await pg
    .query('games')
    .select(['games.id', 'games.title', 'games.year', 'authors.name as author'])
    .leftJoin('authors', 'games.author_id', 'authors.id')
    .limit(limit);

  return games;
};
