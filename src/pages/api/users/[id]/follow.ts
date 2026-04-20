import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { jsonOk, jsonError } from '../../../../lib/response';
import { getAuthUser } from '../../../../lib/auth';

export const POST: APIRoute = async ({ params, request }) => {
  const userId = await getAuthUser(request, env.JWT_SECRET);
  if (!userId) return jsonError(401, 'UNAUTHORIZED', 'Not logged in');

  const targetId = params.id!;
  if (targetId === userId) {
    return jsonError(400, 'CANNOT_FOLLOW_SELF', 'Cannot follow yourself');
  }

  const target = await env.DB.prepare('SELECT id FROM users WHERE id = ?').bind(targetId).first();
  if (!target) return jsonError(404, 'USER_NOT_FOUND', 'User not found');

  await env.DB.prepare(
    'INSERT OR IGNORE INTO follows (follower_id, following_id) VALUES (?, ?)'
  ).bind(userId, targetId).run();

  return jsonOk({ following: true });
};

export const DELETE: APIRoute = async ({ params, request }) => {
  const userId = await getAuthUser(request, env.JWT_SECRET);
  if (!userId) return jsonError(401, 'UNAUTHORIZED', 'Not logged in');

  const targetId = params.id!;

  await env.DB.prepare(
    'DELETE FROM follows WHERE follower_id = ? AND following_id = ?'
  ).bind(userId, targetId).run();

  return jsonOk({ following: false });
};
