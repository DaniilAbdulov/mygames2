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
const get = async ({ userId }, ext) => {
    const { pg } = ext;
    const [user] = await pg.query('users').select(fields).where({ id: userId });
    return user ?? null;
};
exports.get = get;
