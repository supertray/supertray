import cryptoMod from 'crypto';

export const createUuid = () => {
  return cryptoMod.randomUUID();
};
