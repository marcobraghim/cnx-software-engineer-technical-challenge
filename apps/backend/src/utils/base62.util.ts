import Hashids from 'hashids';

const hashids = new Hashids(
  process.env.BASE62_SECRET_SALT ?? '1234567890', // Salt do .env
  7, // Tamanho
  '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ' // Base62
);

export function genBase62FromNumber(num: number): string {
  return hashids.encode(num);
}

export function decodeBase62FromToken(token: string): number | null {
  try {
    const [emailId] = hashids.decode(token);
    return emailId ? Number(emailId) : null;
  } catch (error) {
    return null;
  }
}