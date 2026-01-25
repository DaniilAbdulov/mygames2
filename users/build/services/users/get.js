"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.get = void 0;
const fields = [
    'id',
    'firstName',
    'middleName',
    'lastName',
    'phone',
    'created_at',
];
const get = async (userId, ext) => {
    const { pg } = ext;
    const [user] = await pg('users').select(fields).where({ id: userId });
    if (user) {
        return {
            ...user,
            created_at: new Date(user.created_at).toISOString(),
        };
    }
    return null;
};
exports.get = get;
