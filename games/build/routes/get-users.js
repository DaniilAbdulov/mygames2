"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
    handler: async ({ query }) => {
        console.log(query);
        return [
            {
                id: 1,
                title: 'Daniil',
                year: 2004,
                author: 'author',
            },
        ];
    },
};
