const ITERATIONS = 100000;
const HASH_LENGTH = 32;
const ALGORITHM = 'PBKDF2';

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    ALGORITHM,
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: ALGORITHM, salt, iterations: ITERATIONS, hash: 'SHA-256' },
    key,
    HASH_LENGTH * 8,
  );
  const hash = new Uint8Array(bits);
  const saltHex = Array.from(salt).map((b) => b.toString(16).padStart(2, '0')).join('');
  const hashHex = Array.from(hash).map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${saltHex}:${hashHex}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(':');
  if (!saltHex || !hashHex) return false;
  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map((b) => parseInt(b, 16)));
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    ALGORITHM,
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: ALGORITHM, salt, iterations: ITERATIONS, hash: 'SHA-256' },
    key,
    HASH_LENGTH * 8,
  );
  const computed = Array.from(new Uint8Array(bits)).map((b) => b.toString(16).padStart(2, '0')).join('');
  return computed === hashHex;
}
