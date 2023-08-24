// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { User, UserAction, UserData, UserPatch, UserQuery } from './users.schema';
import type { Application } from '../../declarations';
import type { Params } from '@feathersjs/feathers';
import type { KnexAdapterParams, KnexAdapterOptions } from '@feathersjs/knex';
import type { Knex } from 'knex';

import {
  BadRequest,
  Conflict,
  GeneralError,
  NotAuthenticated,
  NotImplemented,
} from '@feathersjs/errors';
import { KnexService } from '@feathersjs/knex';
import jsonwebtoken from 'jsonwebtoken';

import { comparePasswords } from './helpers/comparePasswords';
import { notifier } from './notifier';

export type * from './users.schema';

export interface UserParams extends KnexAdapterParams<UserQuery> {}

// By default calls the standard Knex adapter service methods but can be customized with your own functionality.
export class UserService<ServiceParams extends Params = UserParams> extends KnexService<
  User,
  UserData,
  UserParams,
  UserPatch
> {
  app: Application;

  notifier: ReturnType<typeof notifier>;

  constructor(options: KnexAdapterOptions, app: Application) {
    super(options);
    this.app = app;
    this.notifier = notifier(app);
  }

  async create(data: UserData, params?: UserParams | undefined): Promise<User>;

  async create(data: UserData[], params?: UserParams | undefined): Promise<User[]>;

  async create(
    data: UserData | UserData[],
    params?: UserParams | undefined,
  ): Promise<User | User[]> {
    if (Array.isArray(data)) {
      throw new NotImplemented('Not implemented');
    }
    const result = await super.create(data, params);
    await this.notifier('resendVerifySignup', result);
    return result;
  }

  async action(actionData: UserAction, params?: ServiceParams) {
    const { action, payload } = actionData;

    if (action === 'verifySignup') {
      const { secret } = this.app.get('authentication');
      const jwtPayload = jsonwebtoken.verify(payload.verifyToken, secret);
      if (typeof jwtPayload === 'string' || jwtPayload.act !== 'verifySignup' || !jwtPayload.sub) {
        throw new BadRequest('Invalid token');
      }
      const user = await this._get(jwtPayload.sub);
      if (!user || user.isVerified) {
        throw new BadRequest('User is already verified');
      }
      await this.patch(jwtPayload.sub, { isVerified: true });
    }

    if (action === 'resendVerifySignup') {
      const { total, data } = await this.find({
        query: { email: payload.email, $limit: 1 },
      });
      if (total === 0) throw new BadRequest();
      const user = data[0];
      if (user.isVerified) throw new BadRequest('User is already verified');
      await this.notifier('resendVerifySignup', user);
    }

    if (action === 'resetPwd') {
      const { secret } = this.app.get('authentication');
      const jwtPayload = jsonwebtoken.verify(payload.token, secret);
      if (typeof jwtPayload === 'string' || jwtPayload.act !== 'resetPwd' || !jwtPayload.sub) {
        throw new BadRequest('Invalid token');
      }
      const user = await this.get(jwtPayload.sub);
      if (!user) throw new BadRequest();
      await this.patch(jwtPayload.sub, { password: payload.password });
    }

    if (action === 'sendResetPwd') {
      const { total, data } = await this.find({
        query: { email: payload.email, $limit: 1 },
      });
      if (total === 0) throw new BadRequest();
      const user = data[0];
      await this.notifier('sendResetPwd', user);
    }

    if (action === 'pwdChange') {
      if (!params?.authenticated) {
        throw new NotAuthenticated('Not authenticated');
      }
      const { user } = params;
      if (!user) throw new NotAuthenticated('Not authenticated');
      const { password: oldPassword, newPassword } = payload;
      if (!user.password) throw new GeneralError();
      const passwordIsCorrect = await comparePasswords(oldPassword, user.password);
      if (!passwordIsCorrect) throw new NotAuthenticated('Not authenticated');
      const passwordIsSame = await comparePasswords(newPassword, user.password);
      if (passwordIsSame) throw new Conflict('Password is the same');
      await this.patch(user.id, { password: newPassword });
    }

    if (action === 'emailChange') {
      const { allowEmailChange } = this.app.get('authExtension');
      if (!allowEmailChange) throw new NotImplemented('Not implemented');
      if (!params?.authenticated) {
        throw new NotAuthenticated('Not authenticated');
      }
      const { user } = params;
      if (!user) throw new NotAuthenticated('Not authenticated');
      const { email, password } = payload;
      if (!user.password) throw new GeneralError();
      const passwordIsCorrect = await comparePasswords(password, user.password);
      if (!passwordIsCorrect) throw new NotAuthenticated('Not authenticated');
      if (email === user.email) throw new Conflict('Email is the same');
      await this.patch(user.id, { email });
      await this.notifier('emailChange', { ...user, email }, { oldEmail: user.email });
    }

    return {
      action,
      success: true,
    };
  }
}

export const getOptions = (app: Application): KnexAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('postgresqlClient'),
    name: 'supertray_users',
    filters: {
      $join: true,
    },
  };
};
