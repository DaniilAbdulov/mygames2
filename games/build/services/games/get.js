"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.get = void 0;
const get = async (limit, ext) => {
    const { pg } = ext;
    const games = await pg('games')
        .select(['games.id', 'games.title', 'games.year', 'authors.name as author'])
        .leftJoin('authors', 'games.author_id', 'authors.id')
        .limit(limit);
    return games;
};
exports.get = get;
