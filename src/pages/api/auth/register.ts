import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { jsonOk, jsonError } from '../../../lib/response';
import { hashPassword } from '../../../lib/password';
import { signJwt, setTokenCookie } from '../../../lib/auth';
import { isValidEmail, isStringInRange } from '../../../lib/validate';
import { CONSTANTS } from '../../../lib/constants';

export const POST: APIRoute = async ({ request }) => {

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, 'INVALID_INPUT', 'Invalid JSON body');
  }

  const { email: rawEmail, password, nickname } = body as {
    email?: string;
    password?: string;
    nickname?: string;
  };

  // Validate
  if (!rawEmail || !isValidEmail(rawEmail)) {
    return jsonError(400, 'INVALID_INPUT', 'Invalid email');
  }
  if (!isStringInRange(password, CONSTANTS.PASSWORD_MIN_LENGTH, CONSTANTS.PASSWORD_MAX_LENGTH)) {
    return jsonError(400, 'INVALID_INPUT', `Password must be ${CONSTANTS.PASSWORD_MIN_LENGTH}-${CONSTANTS.PASSWORD_MAX_LENGTH} characters`);
  }
  if (!isStringInRange(nickname, CONSTANTS.NICKNAME_MIN_LENGTH, CONSTANTS.NICKNAME_MAX_LENGTH)) {
    return jsonError(400, 'INVALID_INPUT', `Nickname must be ${CONSTANTS.NICKNAME_MIN_LENGTH}-${CONSTANTS.NICKNAME_MAX_LENGTH} characters`);
  }

  const email = rawEmail.toLowerCase();

  // Check duplicate
  const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
  if (existing) {
    return jsonError(409, 'EMAIL_EXISTS', 'Email already registered');
  }

  // Create user
  const id = crypto.randomUUID();
  const password_hash = await hashPassword(password);

  await env.DB.prepare(
    'INSERT INTO users (id, email, password_hash, nickname) VALUES (?, ?, ?, ?)'
  ).bind(id, email, password_hash, nickname).run();

  // Sign JWT
  const token = await signJwt(id, env.JWT_SECRET);

  const res = jsonOk(
    {
      user: { id, email, nickname, avatar_url: null, bio: '' },
    },
    201,
  );
  res.headers.set('Set-Cookie', setTokenCookie(token));
  return res;
};
