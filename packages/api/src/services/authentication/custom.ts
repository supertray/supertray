import type { Application } from '../../declarations';
import type {
  AuthenticationParams,
  AuthenticationRequest,
  AuthenticationResult,
  JwtVerifyOptions,
} from '@feathersjs/authentication';
import type { Secret } from 'jsonwebtoken';

import { AuthenticationService } from '@feathersjs/authentication';
import { NotAuthenticated } from '@feathersjs/errors';
import jsonwebtoken from 'jsonwebtoken';

export type CustomAuthenticationResult =
  | AuthenticationResult
  | (AuthenticationResult & {
      refreshToken: string;
      refreshTokenExpiresAt: number;
      session: string;
    });

export class CustomAuthenticationService extends AuthenticationService {
  app: Application;

  constructor(app: Application) {
    super(app);
    this.app = app;
  }

  async verifyAccessToken(
    accessToken: string,
    optsOverride?: JwtVerifyOptions,
    secretOverride?: Secret,
  ): Promise<any> {
    try {
      const jwtPayload = jsonwebtoken.verify(
        accessToken,
        secretOverride || this.app.get('authentication')!.secret,
      );
      if (typeof jwtPayload === 'string') {
        throw new NotAuthenticated('Not authenticated');
      }
      const session = await this.app.service('sessions').find({
        query: {
          id: jwtPayload.jti,
          $limit: 0,
        },
      });
      if (session.total !== 1) {
        throw new NotAuthenticated();
      }
      return await super.verifyAccessToken(accessToken, optsOverride, secretOverride);
    } catch (e) {
      throw new NotAuthenticated('Not authenticated');
    }
  }

  async getTokenOptions(
    authResult: AuthenticationResult,
    params: AuthenticationParams,
  ): Promise<any> {
    const options = await super.getTokenOptions(authResult, params);
    if (authResult.session) {
      // use session id as jwtid
      options.jwtid = authResult.session;
    }
    return {
      ...options,
    };
  }

  async getPayload(authResult: AuthenticationResult, params: AuthenticationParams) {
    const payload = await super.getPayload(authResult, params);
    return {
      ...payload,
    };
  }

  async authenticate(
    authentication: AuthenticationRequest,
    params: AuthenticationParams,
    ...allowed: string[]
  ): Promise<CustomAuthenticationResult> {
    const dontCreateSessionFor = ['jwt', 'refresh'];
    const authResult = await super.authenticate(authentication, params, ...allowed);
    if (!authResult.user.isVerified) {
      throw new NotAuthenticated('Email not verified');
    }
    if (authentication.strategy && !dontCreateSessionFor.includes(authentication.strategy)) {
      const session = await this.app.service('sessions').create({
        userId: authResult.user.id,
      });
      return {
        ...authResult,
        refreshToken: session.token,
        refreshTokenExpiresAt: new Date(session.expiresAt).getTime(),
        session: session.id,
      };
    }
    return {
      ...authResult,
    };
  }

  async create(
    data: AuthenticationRequest,
    params?: AuthenticationParams,
  ): Promise<CustomAuthenticationResult> {
    const result: CustomAuthenticationResult = await super.create(data, params);
    if ('session' in result) {
      // remove sessionId from result
      delete result.session;
    }
    return result;
  }
}
