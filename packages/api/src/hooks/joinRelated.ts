import type { HookContext } from '../declarations';
import type { ResolverContext, SimpleResolver } from 'feathers-hooks-common';

import { Type } from '@feathersjs/typebox';
import { fastJoin } from 'feathers-hooks-common';

type Relation = {
  service: keyof HookContext['app']['services'];
  parentField: string;
  relatedField: string;
};

type RelatedSchema = {
  type: 'many' | 'one';
} & Relation;

export const $joinQuery = Type.Optional(
  Type.Record(Type.String(), Type.Union([Type.RegEx(/^[*]/), Type.String()])),
);
export const $joinSchema = Type.Object(
  {
    $join: $joinQuery,
  },
  { additionalProperties: false },
);

export function beforeJoinRelated() {
  return (ctx: HookContext) => {
    if (!ctx.params.query.$join) {
      ctx.$join = {};
      return ctx;
    }
    ctx.$join = Object.fromEntries(
      Object.entries<string>(ctx.params.query.$join).map(([k, v]) => {
        if (v === '*') {
          return [k, true];
        }
        return [k, [v.split(',')]];
      }),
    );
    delete ctx.params.query.$join;
    return ctx;
  };
}

export function joinRelated(fields: { [K: string]: RelatedSchema }) {
  const cache = new Map();

  return (ctx: HookContext) => {
    const joinResolvers: [string, SimpleResolver][] = Object.keys(fields).map((k) => {
      const { type, service, parentField } = fields[k];

      return [
        k,
        ($select?: string[]) => {
          return async (item: any, context: ResolverContext): Promise<void> => {
            if (type === 'one') {
              let result = cache.get(`service.${item[parentField] as string}`);
              if (result) {
                // eslint-disable-next-line no-param-reassign
                item[k] = result;
                return;
              }
              result = await context.app.service(service).get(item[parentField], {
                query: {
                  $select,
                },
              });
              // }
              // eslint-disable-next-line no-param-reassign
              item[k] = result;
              cache.set(item[parentField], result);
            }
            // TODO: handle many
          };
        },
      ];
    });

    const joinResolver = {
      joins: Object.fromEntries(joinResolvers),
    };
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const result = fastJoin<HookContext>(joinResolver, ctx.$join)(ctx);
    cache.clear();
    return result;
  };
}

export function hasMany(relation: Relation): RelatedSchema {
  return {
    type: 'many',
    ...relation,
  };
}

export function hasOne(relation: Omit<Relation, 'relatedField'>): RelatedSchema {
  return {
    type: 'one',
    relatedField: 'id',
    ...relation,
  };
}
