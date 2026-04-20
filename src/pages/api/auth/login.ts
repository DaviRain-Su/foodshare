import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { jsonOk, jsonError } from '../../../lib/response';
import { verifyPassword } from '../../../lib/password';
import { signJwt, setTokenCookie } from '../../../lib/auth';
import { isValidEmail } from '../../../lib/validate';

export const POST: APIRoute = async ({ request }) => {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, 'INVALID_INPUT', 'Invalid JSON body');
  }

  const { email: rawEmail, password } = body as {
    email?: string;
    password?: string;
  };

  if (!rawEmail || !isValidEmail(rawEmail) || !password) {
    return jsonError(400, 'INVALID_INPUT', 'Email and password are required');
  }

  const email = rawEmail.toLowerCase();

  const user = await env.DB.prepare(
    'SELECT id, email, password_hash, nickname, avatar_url, bio FROM users WHERE email = ?'
  ).bind(email).first<{
    id: string;
    email: string;
    password_hash: string;
    nickname: string;
    avatar_url: string | null;
    bio: string;
  }>();

  if (!user) {
    return jsonError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return jsonError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  const token = await signJwt(user.id, env.JWT_SECRET);

  const res = jsonOk({
    user: {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      avatar_url: user.avatar_url,
      bio: user.bio,
    },
  });
  res.headers.set('Set-Cookie', setTokenCookie(token));
  return res;
};
