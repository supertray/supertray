import type { FileInfo } from 'busboy';
import type { IncomingMessage, ServerResponse } from 'http';
import type { Readable } from 'stream';

import { createWriteStream, rmSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';

import createBusboy from 'busboy';

import { createUuid } from '../utils';

export function parse(req: IncomingMessage) {
  return new Promise<{ file: Readable; fileInfo: FileInfo }>((resolve, reject) => {
    const busboy = createBusboy({
      headers: req.headers,
      limits: {
        files: 1, // allow only a single upload at a time.
      },
      highWaterMark: 5 * 1024 * 1024, // 5 MiB
    });

    function onFile(name: string, file: Readable, fileInfo: FileInfo) {
      const { filename, encoding, mimeType } = fileInfo;
      console.log(
        `File [${name}]: filename: %j, encoding: %j, mimeType: %j`,
        filename,
        encoding,
        mimeType,
      );
      const saveTo = path.join(tmpdir(), `busboy-upload-${createUuid()}-${filename}`);
      file
        // .on('data', (data) => {
        //   console.log(`File [${name}] got ${data.length as number} bytes`);
        // })
        .on('close', () => {
          console.log(`File [${name}] done`);
          console.log(saveTo);
          rmSync(saveTo);
          busboy.removeListener('file', onFile);
          resolve({ file, fileInfo });
        });
      file.pipe(createWriteStream(saveTo));
    }

    function onError(err: unknown) {
      busboy.removeListener('error', onError);
      reject(err);
    }

    busboy.on('file', onFile);
    busboy.on('error', onError);

    req.pipe(busboy);
  });
}

export const uploadRouter = async (req: IncomingMessage, res: ServerResponse<IncomingMessage>) => {
  const { file, fileInfo } = await parse(req);
  // console.log(file, fileInfo);
  res.statusCode = 200;
  return res.end('ok');
};
