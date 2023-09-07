import type { FileInfo } from 'busboy';
import type { IncomingMessage, ServerResponse } from 'http';
import type { Readable } from 'stream';

import { TRPCError } from '@trpc/server';
import createBusboy from 'busboy';
import { z } from 'zod';

import { ctx } from '../context';
import { authenticateToken } from '../middlewares';
import { storage } from '../storage';
import { trpcRouter } from '../trpc-router';
import { mimeTypeSchema } from '../trpc-routers/documents.schema';

const fileParseSchema = z.object({
  workspaceId: z.string().uuid(),
  filename: z.string(),
  encoding: z.string(),
  mimeType: mimeTypeSchema,
});

export function parse(req: IncomingMessage, workspaceId?: string) {
  return new Promise<{
    file: Readable;
    fileInfo: z.infer<typeof fileParseSchema>;
    storagePath: string;
  }>((resolve, reject) => {
    const busboy = createBusboy({
      headers: req.headers,
      limits: {
        files: 1, // allow only a single upload at a time.
        fileSize: 500 * 1024 * 1024, // 500 MiB
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
  try {
    res.setHeader('Content-Type', 'application/json');
    const { session } = await authenticateToken(req.headers.authorization);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const url = new URL(req.url!, 'http://localhost');
    const workspaceId = url.searchParams.get('workspaceId') || undefined;
    const { storagePath, fileInfo } = await parse(req, workspaceId);
    onUploaded(storagePath);
    const document = await trpcRouter.createCaller(ctx).document.internalCreate({
      workspaceId: fileInfo.workspaceId,
      mimeType: fileInfo.mimeType,
      title: fileInfo.filename.split('.').slice(0, -1).join('.'),
      file: storagePath,
      filePdf: storagePath,
      content: '',
      size: 1,
      createdBy: session.userId,
    });
    res.statusCode = 200;
    return res.end(
      JSON.stringify({
        success: true,
        document,
        error: undefined,
      }),
    );
  } catch (e) {
    ctx.logger.error(e);
    if (e instanceof z.ZodError) {
      res.statusCode = 400;
      return res.end(
        JSON.stringify({
          success: false,
          error: e,
        }),
      );
    }
    if (e instanceof TRPCError && e.code === 'UNAUTHORIZED') {
      res.statusCode = 401;
      return res.end(
        JSON.stringify({
          success: false,
          error: e,
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
