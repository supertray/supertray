import { z } from 'zod';

import { createZodPrismaFilterSchema, createZodPrismaOrderSchema } from '../utils';

export const mimeTypeSchema = z.enum([
  'image/png',
  'image/jpeg',
  'image/tiff',
  'application/pdf',
  // word
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  // excel
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  // powerpoint
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // text
  'text/plain',
  // email
  'message/rfc822',
]);

export const documentSchema = z.object({
  id: z.string().uuid(),
  workspaceId: z.string().uuid(),
  title: z.string(),
  content: z.string(),
  file: z.string(),
  filePdf: z.string(),
  mimeType: mimeTypeSchema,
  size: z.number(),
  createdBy: z.string().uuid(),
  createdAt: z.date().transform((date) => new Date(date)),
  updatedAt: z.date().transform((date) => new Date(date)),
});

export type Document = z.infer<typeof documentSchema>;

export const documentInternalCreateSchema = z.object({
  workspaceId: z.string().uuid(),
  title: z.string(),
  content: z.string(),
  file: z.string(),
  filePdf: z.string(),
  mimeType: mimeTypeSchema,
  size: z.number(),
  createdBy: z.string().uuid(),
});

export const documentQuerySchema = z.object({
  where: createZodPrismaFilterSchema(documentSchema).default({}),
  orderBy: createZodPrismaOrderSchema(documentSchema).optional(),
  take: z.number().min(1).max(50).default(20),
  skip: z.number().min(0).default(0),
});

export type DocumentQuery = z.infer<typeof documentQuerySchema>;
