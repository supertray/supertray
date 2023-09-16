import type { Prisma } from '@prisma/client';

export type Models = keyof typeof Prisma.ModelName;

export type ArgsType<T extends Models> =
  Prisma.TypeMap['model'][T]['operations']['findMany']['args'];

export type WhereType<T extends Models> = NonNullable<ArgsType<T>['where']>;

export type AndType<T extends Models> = NonNullable<WhereType<T>['AND']>;

export type OrType<T extends Models> = NonNullable<WhereType<T>['OR']>;

export type NotType<T extends Models> = NonNullable<WhereType<T>['NOT']>;
