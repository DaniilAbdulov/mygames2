"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const games_1 = require("../services/games");
exports.default = {
    method: 'GET',
    path: '/games',
    schema: {
        query: {
            type: 'object',
            additionalProperties: false,
            properties: {
                limit: { type: 'number', default: 20 },
            },
        },
        response: {
            200: {
                type: 'array',
                items: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                        id: { type: 'number' },
                        title: { type: 'string' },
                        year: { type: 'number' },
                        author: { type: 'string' },
                    },
                },
            },
        },
    },
    handler: ({ query }, ext) => {
        const { limit } = query;
        return (0, games_1.get)(limit, ext);
    },
};
