"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = void 0;
const create = async ({ body }, ext) => {
    const { title, author, year } = body;
    const { pg } = ext;
    let author_id;
    const existedAuthor = await pg
        .query('authors')
        .select('id')
        .where({ name: author })
        .first();
    if (!existedAuthor) {
        const createdAuthor = await pg
            .query('authors')
            .insert({ name: author })
            .returning('id');
        author_id = createdAuthor.id;
    }
    else {
        author_id = existedAuthor.id;
    }
    if (!author_id) {
        throw new Error('Не удалось получить или добавить нового издателя');
    }
    await pg.query('games').insert({
        title,
        year,
        author_id,
    });
};
exports.create = create;
