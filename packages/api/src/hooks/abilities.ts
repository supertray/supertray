import type { HookContext } from '../declarations';

import { authorize } from 'feathers-casl';
import { combine } from 'feathers-hooks-common';

import { defineAbilitiesFor } from '../services/authentication/abilities';

export const defineAbilitiesHook = () => {
  return (context: any) => {
    if (context.type === 'after') {
      return context;
    }
    const { user } = context.params;
    if (!user) return context;
    const ability = defineAbilitiesFor(user, context.app);
    context.params.ability = ability;
    context.params.rules = ability.rules;
    return context;
  };
};

export const addAbilityToContext = () => {
  return (context: HookContext) => {
    const { user } = context.result;
    if (!user) return context;
    const ability = defineAbilitiesFor(user, context.app);
    context.result.ability = ability;
    context.result.rules = ability.rules;
    return context;
  };
};

export function authorizeKnexHook(method?: string) {
  return combine(
    defineAbilitiesHook(),
    authorize({
      adapter: '@feathersjs/knex',
      method,
    }),
  );
}
