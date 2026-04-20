import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { jsonOk, jsonError } from '../../../lib/response';
import { getAuthUser } from '../../../lib/auth';

export const DELETE: APIRoute = async ({ params, request }) => {
  const userId = await getAuthUser(request, env.JWT_SECRET);
  if (!userId) return jsonError(401, 'UNAUTHORIZED', 'Not logged in');

  const commentId = params.id!;

  const comment = await env.DB.prepare(
    'SELECT c.user_id AS comment_author, p.user_id AS post_author FROM comments c JOIN posts p ON c.post_id = p.id WHERE c.id = ?'
  ).bind(commentId).first<{ comment_author: string; post_author: string }>();

  if (!comment) {
    return jsonError(404, 'COMMENT_NOT_FOUND', 'Comment not found');
  }

  if (comment.comment_author !== userId && comment.post_author !== userId) {
    return jsonError(403, 'FORBIDDEN', 'Not authorized to delete this comment');
  }

  await env.DB.prepare('DELETE FROM comments WHERE id = ?').bind(commentId).run();

  return jsonOk({});
};
