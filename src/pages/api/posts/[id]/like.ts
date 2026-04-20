import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { jsonOk, jsonError } from '../../../../lib/response';
import { getAuthUser } from '../../../../lib/auth';

export const POST: APIRoute = async ({ params, request }) => {
  const userId = await getAuthUser(request, env.JWT_SECRET);
  if (!userId) return jsonError(401, 'UNAUTHORIZED', 'Not logged in');

  const postId = params.id!;

  const post = await env.DB.prepare('SELECT id FROM posts WHERE id = ?').bind(postId).first();
  if (!post) return jsonError(404, 'POST_NOT_FOUND', 'Post not found');

  await env.DB.prepare(
    'INSERT OR IGNORE INTO likes (post_id, user_id) VALUES (?, ?)'
  ).bind(postId, userId).run();

  const count = await env.DB.prepare(
    'SELECT COUNT(*) AS c FROM likes WHERE post_id = ?'
  ).bind(postId).first<{ c: number }>();

  return jsonOk({ liked: true, like_count: count!.c });
};

export const DELETE: APIRoute = async ({ params, request }) => {
  const userId = await getAuthUser(request, env.JWT_SECRET);
  if (!userId) return jsonError(401, 'UNAUTHORIZED', 'Not logged in');

  const postId = params.id!;

  await env.DB.prepare(
    'DELETE FROM likes WHERE post_id = ? AND user_id = ?'
  ).bind(postId, userId).run();

  const count = await env.DB.prepare(
    'SELECT COUNT(*) AS c FROM likes WHERE post_id = ?'
  ).bind(postId).first<{ c: number }>();

  return jsonOk({ liked: false, like_count: count!.c });
};
