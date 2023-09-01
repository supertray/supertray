import type { AdapterConfig } from '@tweedegolf/storage-abstraction';

import path from 'path';

import { Storage as FileStorage } from '@tweedegolf/storage-abstraction';

import { env } from './env';
import { logger } from './logger';

const absolutePathRegex = /^\/([A-z0-9-_+]+\/)*([A-z0-9]+)$/gm;

const getConfig = (): AdapterConfig => {
  switch (env.STORAGE_TYPE) {
    case 's3':
      return {
        type: 's3',
        bucketName: env.STORAGE_S3_BUCKET,
        accessKeyId: env.STORAGE_S3_ACCESS_KEY_ID,
        secretAccessKey: env.STORAGE_S3_SECRET_ACCESS_KEY,
        region: env.STORAGE_S3_REGION,
        endpoint: env.STORAGE_S3_ENDPOINT,
        useDualstack: true,
        sslEnabled: true,
      };
    default:
      // Default to local storage
      return {
        type: 'local',
        directory: absolutePathRegex.test(env.STORAGE_LOCAL_DIRECTORY)
          ? env.STORAGE_LOCAL_DIRECTORY
          : path.join(process.cwd(), env.STORAGE_LOCAL_DIRECTORY),
        mode: '750',
      };
  }
};

const config = getConfig();
export const storage = new FileStorage(getConfig());

storage
  .init()
  .then(async () => {
    if (!config.bucketName) return;
    await storage.createBucket(config.bucketName);
  })
  .catch((err) => {
    logger.error(err, 'Failed to initialize storage');
  });
