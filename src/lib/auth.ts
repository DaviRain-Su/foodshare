import { CONSTANTS } from './constants';

interface JwtPayload {
  sub: string;
  iat: number;
  exp: number;
}

function base64UrlEncode(data: Uint8Array): string {
  const str = btoa(String.fromCharCode(...data));
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string): Uint8Array {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice(0, (4 - (str.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

async function getKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

export async function signJwt(userId: string, secret: string): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload: JwtPayload = {
    sub: userId,
    iat: now,
    exp: now + CONSTANTS.JWT_EXPIRES_IN_SECONDS,
  };

  const enc = new TextEncoder();
  const headerB64 = base64UrlEncode(enc.encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(enc.encode(JSON.stringify(payload)));
  const signingInput = `${headerB64}.${payloadB64}`;

  const key = await getKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(signingInput));
  const sigB64 = base64UrlEncode(new Uint8Array(sig));

  return `${signingInput}.${sigB64}`;
}

export async function verifyJwt(token: string, secret: string): Promise<string | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, sigB64] = parts;
    const signingInput = `${headerB64}.${payloadB64}`;

    const key = await getKey(secret);
    const enc = new TextEncoder();
    const sig = base64UrlDecode(sigB64);
    const valid = await crypto.subtle.verify('HMAC', key, sig, enc.encode(signingInput));
    if (!valid) return null;

    const payload: JwtPayload = JSON.parse(
      new TextDecoder().decode(base64UrlDecode(payloadB64)),
    );

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) return null;

    return payload.sub;
  } catch {
    return null;
  }
}

export function getTokenFromCookie(request: Request): string | null {
  const cookie = request.headers.get('cookie');
  if (!cookie) return null;
  const match = cookie.match(/(?:^|;\s*)token=([^;]*)/);
  return match ? match[1] : null;
}

export function setTokenCookie(token: string): string {
  return `token=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${CONSTANTS.JWT_EXPIRES_IN_SECONDS}`;
}

export function clearTokenCookie(): string {
  return 'token=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0';
}

export async function getAuthUser(request: Request, jwtSecret: string): Promise<string | null> {
  const token = getTokenFromCookie(request);
  if (!token) return null;
  return verifyJwt(token, jwtSecret);
}
