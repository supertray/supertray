import { z } from 'zod';

import { logger } from '../logger';

type ZodPrismaBooleanFilter = z.ZodUnion<
  [
    z.ZodObject<{
      equals: z.ZodOptional<z.ZodBoolean>;
      not: z.ZodOptional<z.ZodBoolean>;
    }>,
    z.ZodBoolean,
  ]
>;

type ZodPrismaDateFilter = z.ZodObject<{
  lt: z.ZodOptional<z.ZodDate>;
  lte: z.ZodOptional<z.ZodDate>;
  gt: z.ZodOptional<z.ZodDate>;
  gte: z.ZodOptional<z.ZodDate>;
}>;

type ZodPrismaDefaultFilter<T extends z.ZodTypeAny> = z.ZodUnion<
  [
    z.ZodObject<{
      lt: z.ZodOptional<T>;
      lte: z.ZodOptional<T>;
      gt: z.ZodOptional<T>;
      gte: z.ZodOptional<T>;
      equals: z.ZodOptional<T>;
      not: z.ZodOptional<T>;
      in: z.ZodOptional<z.ZodArray<T, 'many'>>;
      notIn: z.ZodOptional<z.ZodArray<T, 'many'>>;
    }>,
    T,
  ]
>;

export type ZodPrismaFilterValueSchema<T extends z.ZodTypeAny> = T extends z.ZodEffects<
  infer U,
  unknown
>
  ? ZodPrismaFilterValueSchema<U>
  : T extends z.ZodDate
  ? z.ZodOptional<ZodPrismaDateFilter>
  : T extends z.ZodBoolean
  ? z.ZodOptional<ZodPrismaBooleanFilter>
  : T extends z.ZodUnion<infer U>
  ? z.ZodOptional<z.ZodNever>
  : T extends z.ZodArray<infer U>
  ? z.ZodOptional<z.ZodNever>
  : T extends z.ZodObject<z.ZodRawShape>
  ? z.ZodOptional<z.ZodNever>
  : z.ZodOptional<ZodPrismaDefaultFilter<T>>;

export type ZodPrismaInnerFilterSchema<
  T extends {
    [key: string]: z.ZodTypeAny;
  },
> = z.ZodObject<{
  [key in keyof T]: ZodPrismaFilterValueSchema<T[key]>;
}>;

export type ZodPrismaInnerAndOrNotFilterSchema<
  T extends {
    [key: string]: z.ZodTypeAny;
  },
> = z.ZodObject<{
  AND: z.ZodOptional<z.ZodArray<ZodPrismaInnerFilterSchema<T>>>;
  OR: z.ZodOptional<z.ZodArray<ZodPrismaInnerFilterSchema<T>>>;
  NOT: z.ZodOptional<ZodPrismaInnerFilterSchema<T>>;
}>;

export type ZodPrismaFilterSchema<
  T extends {
    [key: string]: z.ZodTypeAny;
  },
> = z.ZodUnion<[ZodPrismaInnerFilterSchema<T>, ZodPrismaInnerAndOrNotFilterSchema<T>]>;

const internalCreateZodPrismaFilterValueSchema = <T extends z.ZodTypeAny>(
  zodSchemaType: T,
):
  | z.ZodOptional<ZodPrismaDateFilter>
  | z.ZodOptional<ZodPrismaBooleanFilter>
  | z.ZodOptional<z.ZodNever>
  | z.ZodOptional<ZodPrismaDefaultFilter<T>> => {
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
    return z.never().optional();
  }
  if (schema instanceof z.ZodDate) {
    const s = schema as z.ZodDate;
    return z
      .object({
        lt: s.optional(),
        lte: s.optional(),
        gt: s.optional(),
        gte: s.optional(),
      })
      .optional();
  }
  if (schema instanceof z.ZodBoolean) {
    const s = schema;
    return z.union([z.object({ equals: s.optional(), not: s.optional() }).strict(), s]).optional();
  }
  return z
    .union([
      z
        .object({
          lt: schema.optional(),
          lte: schema.optional(),
          gt: schema.optional(),
          gte: schema.optional(),
          equals: schema.optional(),
          not: schema.optional(),
          in: z.array(schema).optional(),
          notIn: z.array(schema).optional(),
        })
        .strict(),
      schema,
    ])
    .optional();
};

export const createZodPrismaFilterValueSchema = <T extends z.ZodTypeAny>(schema: T) => {
  return internalCreateZodPrismaFilterValueSchema<T>(schema) as ZodPrismaFilterValueSchema<T>;
};

export const createZodPrismaFilterSchema = <
  T extends {
    [key: string]: z.ZodTypeAny;
  },
>(
  schema: z.ZodObject<T>,
): ZodPrismaFilterSchema<T> => {
  const querySchema = {} as {
    [k: string]: ZodPrismaFilterValueSchema<T[string]>;
  };
  Object.keys(schema.shape).forEach((key) => {
    const value = schema.shape[key];
    const valueObjectSchema = internalCreateZodPrismaFilterValueSchema(value);
    Object.assign(querySchema, {
      [key]: valueObjectSchema,
    });
  });
  const querySchemaZod = z.object(querySchema).strict() as ZodPrismaInnerFilterSchema<T>;
  const createAndOrNotSchema = (zodQuery: ZodPrismaInnerFilterSchema<T>) => {
    return z.object({
      AND: z.array(zodQuery).optional(),
      OR: z.array(zodQuery).optional(),
      NOT: zodQuery.optional(),
    });
  };
  const queryAndOrSchemaZod = createAndOrNotSchema(querySchemaZod);
  return z.union([querySchemaZod, queryAndOrSchemaZod]);
};

export type ZodPrismaFilter<
  T extends {
    [key: string]: z.ZodTypeAny;
  },
> = z.infer<ZodPrismaFilterSchema<T>>;

export type ZodPrismaOrderSchema<
  T extends {
    [key: string]: z.ZodTypeAny;
  },
> = z.ZodObject<{ [k in keyof T]: z.ZodOptional<z.ZodEnum<['asc', 'desc']>> }, 'strict'>;

export const createZodPrismaOrderSchema = <
  T extends {
    [key: string]: z.ZodTypeAny;
  },
>(
  schema: z.ZodObject<T>,
) => {
  const querySchema: {
    [k: string]: z.ZodOptional<z.ZodEnum<['asc', 'desc']>>;
  } = {};
  Object.keys(schema.shape).forEach((key) => {
    Object.assign(querySchema, {
      [key]: z.enum(['asc', 'desc']).optional(),
    });
  });
  return z.object(querySchema).strict() as ZodPrismaOrderSchema<T>;
};
