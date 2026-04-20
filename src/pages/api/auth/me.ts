import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { jsonOk, jsonError } from '../../../lib/response';
import { getAuthUser } from '../../../lib/auth';

export const GET: APIRoute = async ({ request }) => {
  const userId = await getAuthUser(request, env.JWT_SECRET);

  if (!userId) {
    return jsonError(401, 'UNAUTHORIZED', 'Not logged in');
  }

  const user = await env.DB.prepare(
    'SELECT id, email, nickname, avatar_url, bio, created_at FROM users WHERE id = ?'
  ).bind(userId).first();

  if (!user) {
    return jsonError(401, 'UNAUTHORIZED', 'User not found');
  }

  return jsonOk({ user });
};
