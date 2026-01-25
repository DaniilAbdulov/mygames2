"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const users_1 = require("../services/users");
exports.default = {
    method: 'GET',
    path: '/users/:userId',
    schema: {
        params: {
            userId: { type: 'number' },
        },
        response: {
            200: {
                type: 'object',
                additionalProperties: false,
                properties: {
                    id: { type: 'number' },
                    firstName: { type: 'string' },
                    middleName: { type: 'string', nullable: true },
                    lastName: {
                        type: 'string',
                    },
                    phone: { type: 'string' },
                    created_at: { type: 'string', format: 'date-time' },
                },
            },
        },
    },
    handler: ({ params }, ext) => {
        const { userId } = params;
        return (0, users_1.get)(userId, ext);
    },
};
