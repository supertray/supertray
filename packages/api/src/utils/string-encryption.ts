// Checking the crypto module
import nodeCrypto from 'crypto';

import { env } from '../env';

export function uuidToKey(uuid: string) {
  return uuid.replace(/-/g, '');
}

// eslint-disable-next-line @typescript-eslint/naming-convention
const ALGORITHM = 'aes-256-cbc';
const key = uuidToKey(env.KEY);

/**
 *
 * @param {string} text
 * @returns
 */
export function encryptString(text: string, saveRandomLength?: number): string {
  const iv = nodeCrypto.randomBytes(16);
  const randomInteger = saveRandomLength || nodeCrypto.randomInt(11, 22);
  const unusedIv = nodeCrypto.randomBytes(randomInteger);
  const cipher = nodeCrypto.createCipheriv(ALGORITHM, Buffer.from(key), iv, {});
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return `${unusedIv.toString('hex')}${iv.toString('hex')}${encrypted.toString(
    'hex',
  )}${randomInteger.toString()}`;
}

/**
 *
 * @param {string} encryptedString The string to decrypt.
 * @param {string} key A 32-byte key.
 * @returns
 */
export function decryptString(encryptedString: string, saveRandomLength?: number) {
  const randomInteger = saveRandomLength || parseInt(encryptedString.slice(-2), 10);
  const realEncryptedString = encryptedString.slice(randomInteger * 2, encryptString.length - 2);
  const iv = Buffer.from(realEncryptedString.slice(0, 32), 'hex');
  const encryptedText = Buffer.from(realEncryptedString.slice(32), 'hex');
  const decipher = nodeCrypto.createDecipheriv(ALGORITHM, Buffer.from(key), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}
