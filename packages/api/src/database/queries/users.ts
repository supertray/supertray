import type { User, LoginToken } from '../../schema';
import type { Knex } from 'knex';

import { database } from '..';

export const getById = async (id: string, trx?: Knex.Transaction) => {
  const user = await (trx || database).table('supertray_users').select('*').where('id', id).first();
  return user;
};

export const getByEmail = async (email: string, trx?: Knex.Transaction) => {
  const user = await (trx || database)
    .table('supertray_users')
    .select('*')
    .where('email', email)
    .first();
  return user;
};

export const getValidOtpByEmail = async (email: string, otp: string, trx?: Knex.Transaction) => {
  const loginToken: (LoginToken & { user: User }) | undefined = await (trx || database)
    .table('supertray_login_tokens')
    .select([database.raw('to_json(supertray_users.*) as user'), 'supertray_login_tokens.*'])
    .where('token', otp)
    .andWhere('supertray_users.email', email)
    .first()
    .join('supertray_users', 'supertray_login_tokens.userId', 'supertray_users.id');
  if (!loginToken) {
    return undefined;
  }
  if (loginToken.expiresAt < new Date()) {
    await (trx || database).table('supertray_login_tokens').where('id', loginToken.id).delete();
    return undefined;
  }
  return loginToken;
};
