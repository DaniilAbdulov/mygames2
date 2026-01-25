import {ServiceExtensions} from '@daniilabdulov/fastify-auto/dist/types/extensions';

type CreateBody = {
  title: string;
  author: string;
  year: number;
};

export const create = async (body: CreateBody, ext: ServiceExtensions) => {
  const {title, author, year} = body;
  const {pg} = ext;

  let author_id;

  const existedAuthor = await pg('authors')
    .select('id')
    .where({name: author})
    .first();

  if (!existedAuthor) {
    const [createdAuthor] = await pg('authors')
      .insert({name: author})
      .returning('id');

    author_id = createdAuthor.id;
  } else {
    author_id = existedAuthor.id;
  }

  if (!author_id) {
    throw new Error('Не удалось получить или добавить нового издателя');
  }

  await pg('games')
    .insert({
      title,
      year,
      author_id,
    })
    .returning('id')
    .onConflict('title')
    .ignore();
};
