import type { FileInfo } from 'busboy';
import type { IncomingMessage, ServerResponse } from 'http';
import type { Readable } from 'stream';

import createBusboy from 'busboy';

import { storage } from '../storage';
import { createUuid } from '../utils';

export function parse(req: IncomingMessage) {
  return new Promise<{ file: Readable; fileInfo: FileInfo; storagePath: string }>(
    (resolve, reject) => {
      const busboy = createBusboy({
        headers: req.headers,
        limits: {
          files: 1, // allow only a single upload at a time.
        },
        highWaterMark: 5 * 1024 * 1024, // 5 MiB
      });

      function onFile(name: string, file: Readable, fileInfo: FileInfo) {
        // TODO: implement fileInfo validation with zod
        const storagePath = `${createUuid()}-${fileInfo.filename}`;
        storage
          .addFileFromReadable(file, storagePath)
          .then(() => {
            busboy.removeListener('file', onFile);
            resolve({ file, fileInfo, storagePath });
          })
          .catch((err) => {
            reject(err);
          });
      }

      function onError(err: unknown) {
        busboy.removeListener('error', onError);
        reject(err);
      }

      busboy.on('file', onFile);
      busboy.on('error', onError);

      req.pipe(busboy);
    },
  );
}

export const uploadRouter = async (
  req: IncomingMessage,
  res: ServerResponse<IncomingMessage>,
  onUploaded: (storagePath: string) => void,
) => {
  const url = new URL(req.url!, 'http://localhost');
  const workspaceId = url.searchParams.get('workspaceId');
  console.log(workspaceId);
  // TODO: implement auth header check
  const { storagePath } = await parse(req);
  onUploaded(storagePath);
  res.statusCode = 200;
  return res.end('ok');
};
