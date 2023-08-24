import { Type } from '@feathersjs/typebox';

export const timestamps = {
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' }),
};
