import { compare } from 'bcryptjs';

export async function comparePasswords(oldPassword: string, password: string): Promise<boolean> {
  return new Promise((resolve) => {
    compare(oldPassword, password, (err, data) => (err || !data ? resolve(false) : resolve(true)));
  });
}
