const fields = [
  'id',
  'firstName',
  'middleName',
  'lastName',
  'phone',
  'created_at',
];

export const get = async ({userId}: {userId: number}, ext: any) => {
  const {pg} = ext;

  const [user] = await pg.query('users').select(fields).where({id: userId});

  return user ?? null;
};
