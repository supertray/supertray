// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type {
  Session,
  SessionData,
  SessionLogout,
  SessionPatch,
  SessionQuery,
  SessionRefresh,
} from './sessions.schema';
import type { Application } from '../../declarations';
import type { Id, NullableId, Params } from '@feathersjs/feathers';
import type { KnexAdapterParams, KnexAdapterOptions } from '@feathersjs/knex';

import crypto from 'node:crypto';

import {
  BadRequest,
  Forbidden,
  GeneralError,
  NotAuthenticated,
  NotFound,
  NotImplemented,
} from '@feathersjs/errors';
import { KnexService } from '@feathersjs/knex';
import jsonwebtoken, { JwtPayload, VerifyErrors } from 'jsonwebtoken';
import ms from 'ms';

import { logger } from '../../logger';

export type * from './sessions.schema';

export interface SessionParams extends KnexAdapterParams<SessionQuery> {}

// By default calls the standard Knex adapter service methods but can be customized with your own functionality.
export class SessionService<ServiceParams extends Params = SessionParams> extends KnexService<
  Session,
  SessionData,
  SessionParams,
  SessionPatch
> {
  app: Application;

  constructor(options: KnexAdapterOptions, app: Application) {
    super(options);
    this.app = app;
  }

  private createToken() {
    const { refreshTokenExpiresIn } = this.app.get('authExtension');
    const expiresAt = Date.now() + ms(refreshTokenExpiresIn);
    const token = crypto.randomBytes(48).toString('hex');
    return {
      token,
      expiresAt: new Date(expiresAt).toISOString(),
    };
  }

  async create(data: SessionData[], params?: ServiceParams): Promise<Session[]>;

  async create(data: SessionData, params?: ServiceParams): Promise<Session>;

  async create(
    data: SessionData | SessionData[],
    params?: SessionParams,
  ): Promise<Session | SessionData[]> {
    const { token, expiresAt } = this.createToken();
    const result = await this._create(
      {
        ...data,
        token,
        expiresAt,
      },
      params,
    );
    return result;
  }

  async refresh(data: SessionRefresh) {
    try {
      const { secret } = this.app.get('authentication')!;
      const { accessToken, refreshToken } = data;
      const jwtPayload = jsonwebtoken.verify(accessToken, secret, {
        ignoreExpiration: true,
      });
      if (typeof jwtPayload === 'string' || !jwtPayload.jti) {
        throw new BadRequest('Invalid payload type.');
      }
      const session = await this.get(jwtPayload.jti);
      if (session.token !== refreshToken) {
        throw new BadRequest('Invalid request.');
      }
      if (new Date(session.expiresAt).getTime() < Date.now()) {
        await this.remove(session.id);
        throw new BadRequest('Session expired.');
      }
      await this.remove(session.id);
      const result = await this.create({
        userId: session.userId,
      });
      const newAccessToken = await this.app.service('authentication').createAccessToken(
        {
          sub: result.userId,
        },
        {
          jwtid: result.id,
        },
      );
      return {
        accessToken: newAccessToken,
        authentication: {
          payload: jsonwebtoken.verify(newAccessToken, secret),
        },
        refreshToken: result.token,
        refreshTokenExpiresAt: new Date(result.expiresAt).getTime(),
      };
    } catch (e) {
      if (e instanceof NotFound) {
        logger.error(e);
        throw new BadRequest('Invalid request.');
      }
      return e;
    }
  }

  async logout(data: SessionLogout, params?: ServiceParams): Promise<{ success: boolean }> {
    if (!params?.authentication) {
      throw new NotAuthenticated('Not authenticated');
    }
    const { payload } = params.authentication;
    if (data && data.id) {
      const activeSession = await this.get(payload.jti);
      const session = await this.get(data.id);
      if (session.userId !== activeSession.userId) {
        throw new Forbidden('Forbidden');
      }
      await this.remove(data.id);
      return {
        success: true,
      };
    }
    await this.remove(payload.jti);
    return {
      success: true,
    };
  }
}

export const getOptions = (app: Application): KnexAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('postgresqlClient'),
    name: 'supertray_sessions',
  };
};
