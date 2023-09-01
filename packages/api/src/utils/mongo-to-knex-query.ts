import type { Knex } from 'knex';

import { isPlainObject } from 'lodash';
import { z } from 'zod';

// eslint-disable-next-line @typescript-eslint/naming-convention
const OPERATORS = {
  $lt: '<',
  $lte: '<=',
  $gt: '>',
  $gte: '>=',
  $eq: '=',
  $ne: '!=',
};

// eslint-disable-next-line @typescript-eslint/naming-convention
const OPERATORS_KNEX_IN_METHOD = {
  $in: 'whereIn',
  $nin: 'whereNotIn',
};

type OperatorKeys = keyof typeof OPERATORS;
type OperatorKnexMethodInKeys = keyof typeof OPERATORS_KNEX_IN_METHOD;

const queryValueSchema = z.union([z.string(), z.number(), z.date(), z.boolean(), z.null()]);

const queryValueObjectSchema = z.object({
  $in: z.array(queryValueSchema).optional(),
  $nin: z.array(queryValueSchema).optional(),
  $lt: queryValueSchema.optional(),
  $lte: queryValueSchema.optional(),
  $gt: queryValueSchema.optional(),
  $gte: queryValueSchema.optional(),
  $eq: queryValueSchema.optional(),
  $ne: queryValueSchema.optional(),
});

type QueryValueObject = z.infer<typeof queryValueObjectSchema>;

const innerQuerySchema = z.record(z.union([queryValueSchema, queryValueObjectSchema]));

type InnerQuery = z.infer<typeof innerQuerySchema>;

const andOrQuerySchema = z.object({
  $and: z.array(innerQuerySchema).optional(),
  $or: z.array(innerQuerySchema).optional(),
});

type AndOrQuery = z.infer<typeof andOrQuerySchema>;

export const mongoLikeQuerySchema = z.union([
  z.object({
    $and: z.array(z.union([innerQuerySchema, andOrQuerySchema])),
    $or: z.array(z.union([innerQuerySchema, andOrQuerySchema])),
  }),
  innerQuerySchema,
]);

export type MongoLikeQuery = z.infer<typeof mongoLikeQuerySchema>;

export function mongoToKnexQuery<Q extends MongoLikeQuery | QueryValueObject>(
  qb: Knex.QueryBuilder,
  query: Q,
  prefixKey?: string,
  parentKey?: string,
) {
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  Object.keys(query).forEach((key) => {
    if (key === '$and' || key === '$or') {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const value = (query as AndOrQuery)[key]!;
      if (key === '$and') {
        return qb.andWhere((qb1) =>
          value.forEach((item) => mongoToKnexQuery(qb1, item, prefixKey)),
        );
      }
      return qb.orWhere((qb1) => value.forEach((item) => mongoToKnexQuery(qb1, item, prefixKey)));
    }

    const fieldKey = prefixKey ? `${prefixKey}.${parentKey || key}` : parentKey || key;

    if (Object.keys(OPERATORS).includes(key) && parentKey) {
      const k = key as OperatorKeys;
      const value = (query as QueryValueObject)[k];
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return qb.where(fieldKey, OPERATORS[k], value);
    }

    if (Object.keys(OPERATORS_KNEX_IN_METHOD).includes(key) && parentKey) {
      const k = key as OperatorKnexMethodInKeys;
      const value = (query as QueryValueObject)[k];
      if (k === '$in') {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return qb.whereIn(fieldKey, value);
      }
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return qb.whereNotIn(fieldKey, value);
    }

    const value = (query as InnerQuery)[key];
    if (isPlainObject(value)) {
      return mongoToKnexQuery(qb, value as QueryValueObject, prefixKey, key);
    }
    return qb.where(fieldKey, '=', value);
  });
}
