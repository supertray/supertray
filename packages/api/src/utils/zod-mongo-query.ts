import { z } from 'zod';

import { logger } from '../logger';

export type ZodMongoQueryObjectValueSchema<T extends z.ZodTypeAny> = T extends z.ZodEffects<
  infer U,
  unknown
>
  ? ZodMongoQueryObjectValueSchema<U>
  : T extends z.ZodDate
  ? z.ZodOptional<
      z.ZodObject<{
        $lt: z.ZodOptional<T>;
        $lte: z.ZodOptional<T>;
        $gt: z.ZodOptional<T>;
        $gte: z.ZodOptional<T>;
      }>
    >
  : T extends z.ZodBoolean
  ? z.ZodOptional<
      z.ZodUnion<
        [
          z.ZodObject<{
            $eq: z.ZodOptional<T>;
            $ne: z.ZodOptional<T>;
          }>,
          T,
        ]
      >
    >
  : T extends z.ZodUnion<infer U>
  ? z.ZodOptional<z.ZodObject<{ [k: string]: never }>>
  : T extends z.ZodArray<infer U>
  ? z.ZodOptional<z.ZodObject<{ [k: string]: never }>>
  : T extends z.ZodObject<z.ZodRawShape>
  ? z.ZodOptional<z.ZodObject<{ [k: string]: never }>>
  : z.ZodOptional<
      z.ZodUnion<
        [
          z.ZodObject<{
            $lt: z.ZodOptional<T>;
            $lte: z.ZodOptional<T>;
            $gt: z.ZodOptional<T>;
            $gte: z.ZodOptional<T>;
            $eq: z.ZodOptional<T>;
            $ne: z.ZodOptional<T>;
            $in: z.ZodOptional<z.ZodArray<T, 'many'>>;
            $nin: z.ZodOptional<z.ZodArray<T, 'many'>>;
          }>,
          T,
        ]
      >
    >;

export type ZodMongoInnerQuerySchema<
  T extends {
    [key: string]: z.ZodTypeAny;
  },
> = z.ZodObject<{
  [key in keyof T]: ZodMongoQueryObjectValueSchema<T[key]>;
}>;

export type ZodMongoInnerAndOrQuerySchema<
  T extends {
    [key: string]: z.ZodTypeAny;
  },
> = z.ZodObject<{
  $and: z.ZodOptional<z.ZodArray<ZodMongoInnerQuerySchema<T>>>;
  $or: z.ZodOptional<z.ZodArray<ZodMongoInnerQuerySchema<T>>>;
}>;

export type ZodMongoQuerySchema<
  T extends {
    [key: string]: z.ZodTypeAny;
  },
> = z.ZodUnion<[ZodMongoInnerQuerySchema<T>, ZodMongoInnerAndOrQuerySchema<T>]>;

const createZodQueryValueObjectSchema = <T extends z.ZodTypeAny>(zodSchemaType: T) => {
  let schema = zodSchemaType;
  if (schema instanceof z.ZodEffects) {
    schema = schema._def.schema;
  }
  if (
    schema instanceof z.ZodUnion ||
    schema instanceof z.ZodArray ||
    schema instanceof z.ZodObject
  ) {
    logger.warn('ZodUnion, ZodArray and ZodObject is not supported in mongo-like queries');
    return z.object<{ [k: string]: never }>({}).optional();
  }
  if (schema instanceof z.ZodDate) {
    return z
      .object({
        $lt: schema.optional(),
        $lte: schema.optional(),
        $gt: schema.optional(),
        $gte: schema.optional(),
      })
      .strict()
      .optional();
  }
  if (schema instanceof z.ZodBoolean) {
    return z
      .union([z.object({ $eq: schema.optional(), $ne: schema.optional() }).strict(), schema])
      .optional();
  }
  return z
    .union([
      z
        .object({
          $lt: schema.optional(),
          $lte: schema.optional(),
          $gt: schema.optional(),
          $gte: schema.optional(),
          $eq: schema.optional(),
          $ne: schema.optional(),
          $in: z.array(schema).optional(),
          $nin: z.array(schema).optional(),
        })
        .strict(),
      schema,
    ])
    .optional();
};

export const createZodMongoLikeQuerySchema = <
  T extends {
    [key: string]: z.ZodTypeAny;
  },
>(
  schema: z.ZodObject<T>,
): ZodMongoQuerySchema<T> => {
  const querySchema = {};
  Object.keys(schema.shape).forEach((key) => {
    const value = schema.shape[key];
    const valueObjectSchema = createZodQueryValueObjectSchema(value);
    Object.assign(querySchema, {
      [key]: valueObjectSchema,
    });
  });
  const querySchemaZod = z.object(querySchema).strict() as ZodMongoInnerQuerySchema<T>;
  const createAndOrSchema = (zodQuery: ZodMongoInnerQuerySchema<T>) => {
    return z.object({
      $and: z.array(zodQuery).optional(),
      $or: z.array(zodQuery).optional(),
    });
  };
  const queryAndOrSchemaZod = createAndOrSchema(querySchemaZod);
  return z.union([querySchemaZod, queryAndOrSchemaZod]);
};

export const createZodMongoLikeQueryValueSchema = <T extends z.ZodTypeAny>(zodSchemaType: T) => {
  return createZodQueryValueObjectSchema(zodSchemaType) as ZodMongoQueryObjectValueSchema<T>;
};
