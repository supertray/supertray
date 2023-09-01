import type { CaslAbilities, MongoLikeQuery } from '../schema';

import { subject as caslSubject } from '@casl/ability';
import { rulesToQuery } from '@casl/ability/extra';

import { errors } from '../errors';

export function checkPermission(abilities: CaslAbilities | null) {
  return <T extends Record<string, unknown>>(action: string, subject: string, value?: T) => {
    const allowed = abilities?.can(action, caslSubject(subject, value || {}));
    if (!allowed) {
      throw errors.forbidden();
    }
  };
}

// export function accessibleBy() {}
export const caslRulesToMongoLikeQuery = (casl: CaslAbilities, action: string, subject: string) => {
  const query = rulesToQuery(casl, action, subject, (rule) => {
    if (rule.inverted) {
      throw new Error('Inverted rules are not supported');
    }
    return rule.conditions || {};
  });
  return query || {};
};

export const getPermissionsQuery =
  (casl: CaslAbilities | null) => (action: string, subject: string) => {
    if (!casl) {
      return {} as MongoLikeQuery;
    }
    return caslRulesToMongoLikeQuery(casl, action, subject) as MongoLikeQuery;
  };

export { mongoToKnexQuery as applyPermissionQueryToKnex } from './mongo-to-knex-query';
