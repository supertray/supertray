import type { FileInfo } from 'busboy';
import type { IncomingMessage, ServerResponse } from 'http';
import type { Readable } from 'stream';

import { randomBytes } from 'crypto';

import createBusboy from 'busboy';
import { z } from 'zod';

import { storage } from '../storage';
import { createUuid } from '../utils';

const fileParseSchema = z.object({
  workspaceId: z.string().uuid(),
  filename: z.string(),
  encoding: z.string(),
  mimeType: z.enum([
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
  ]),
});

export function parse(req: IncomingMessage, workspaceId: string) {
  return new Promise<{
    file: Readable;
    fileInfo: z.infer<typeof fileParseSchema>;
    storagePath: string;
  }>((resolve, reject) => {
    const busboy = createBusboy({
      headers: req.headers,
      limits: {
        files: 1, // allow only a single upload at a time.
      },
      highWaterMark: 5 * 1024 * 1024, // 5 MiB
    });

    function onFile(name: string, file: Readable, fileInfo: FileInfo) {
      const parseFile = async () => {
        const parsedFileInfo = fileParseSchema.parse({
          ...fileInfo,
          workspaceId,
        });
        const createdDate = Date.now();
        const storagePath = `${createdDate}_${fileInfo.filename}`;
        await storage.addFileFromReadable(file, storagePath);
        busboy.removeListener('file', onFile);
        return { file, fileInfo: parsedFileInfo, storagePath };
      };
      // TODO: implement fileInfo validation with zod
      parseFile()
        .then((result) => {
          // eslint-disable-next-line no-use-before-define
          cleanup();
          resolve(result);
        })
        .catch((err) => {
          // eslint-disable-next-line no-use-before-define
          cleanup();
          reject(err);
        });
    }

    function onError(err: unknown) {
      // eslint-disable-next-line no-use-before-define
      cleanup();
      reject(err);
    }

    function cleanup() {
      busboy.removeListener('error', onError);
      busboy.removeListener('file', onFile);
    }

    busboy.on('file', onFile);
    busboy.on('error', onError);

    req.pipe(busboy);
  });
}

export const uploadRouter = async (
  req: IncomingMessage,
  res: ServerResponse<IncomingMessage>,
  onUploaded: (storagePath: string) => void,
) => {
  const url = new URL(req.url!, 'http://localhost');
  const workspaceId = url.searchParams.get('workspaceId');
  // TODO: implement auth header check
  res.setHeader('Content-Type', 'application/json');
  try {
    const { storagePath } = await parse(req, workspaceId!);
    onUploaded(storagePath);
    res.statusCode = 200;
    return res.end(
      JSON.stringify({
        success: true,
        error: undefined,
      }),
    );
  } catch (e) {
    if (e instanceof z.ZodError) {
      res.statusCode = 400;
      return res.end(
        JSON.stringify({
          error: e,
          success: false,
        }),
      );
    }
    res.statusCode = 500;
    return res.end(
      JSON.stringify({
        success: false,
        error: {
          ...e,
          name: 'InternalServerError',
        },
      }),
    );
  }
};
