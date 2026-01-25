"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const games_1 = require("../services/games");
exports.default = {
    method: 'POST',
    path: '/games',
    schema: {
        body: {
            type: 'object',
            additionalProperties: false,
            required: ['title', 'year', 'author'],
            properties: {
                title: { type: 'string' },
                year: { type: 'number' },
                author: { type: 'string' },
            },
        },
        response: {},
    },
    handler: ({ body }, ext) => (0, games_1.create)(body, ext),
};
