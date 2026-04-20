import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { jsonOk, jsonError } from '../../../../lib/response';
import { getAuthUser } from '../../../../lib/auth';
import { CONSTANTS } from '../../../../lib/constants';

// Create comment
export const POST: APIRoute = async ({ params, request }) => {
  const userId = await getAuthUser(request, env.JWT_SECRET);
  if (!userId) return jsonError(401, 'UNAUTHORIZED', 'Not logged in');

  const postId = params.id!;

  const post = await env.DB.prepare('SELECT id FROM posts WHERE id = ?').bind(postId).first();
  if (!post) return jsonError(404, 'POST_NOT_FOUND', 'Post not found');

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, 'INVALID_INPUT', 'Invalid JSON body');
  }

  const { content } = body as { content?: string };
  if (!content || typeof content !== 'string' || content.length === 0 || content.length > CONSTANTS.COMMENT_MAX_LENGTH) {
    return jsonError(400, 'INVALID_INPUT', `Comment must be 1-${CONSTANTS.COMMENT_MAX_LENGTH} characters`);
  }

  const commentId = crypto.randomUUID();
  await env.DB.prepare(
    'INSERT INTO comments (id, post_id, user_id, content) VALUES (?, ?, ?, ?)'
  ).bind(commentId, postId, userId, content).run();

  const user = await env.DB.prepare(
    'SELECT id, nickname, avatar_url FROM users WHERE id = ?'
  ).bind(userId).first();

  const comment = await env.DB.prepare(
    'SELECT created_at FROM comments WHERE id = ?'
  ).bind(commentId).first();

  return jsonOk(
    {
      comment: {
        id: commentId,
        user,
        content,
        created_at: comment!.created_at,
      },
    },
    201,
  );
};

// Get comments
export const GET: APIRoute = async ({ params, url }) => {
  const postId = params.id!;

  const cursor = url.searchParams.get('cursor');
  let limit = parseInt(url.searchParams.get('limit') ?? String(CONSTANTS.COMMENTS_PAGE_SIZE), 10);
  if (isNaN(limit) || limit < 1) limit = CONSTANTS.COMMENTS_PAGE_SIZE;
  if (limit > 50) limit = 50;

  const bindings: unknown[] = [postId];
  let query = `
    SELECT c.id, c.content, c.created_at, c.user_id,
           u.nickname, u.avatar_url
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.post_id = ?
  `;

  if (cursor) {
    query += ' AND c.created_at > ?';
    bindings.push(cursor);
  }

  query += ' ORDER BY c.created_at ASC LIMIT ?';
  bindings.push(limit + 1);

  const { results } = await env.DB.prepare(query).bind(...bindings).all();

  const hasMore = results.length > limit;
  const comments = hasMore ? results.slice(0, limit) : results;

  return jsonOk({
    comments: comments.map((c: Record<string, unknown>) => ({
      id: c.id,
      user: { id: c.user_id, nickname: c.nickname, avatar_url: c.avatar_url },
      content: c.content,
      created_at: c.created_at,
    })),
    next_cursor: hasMore ? (comments[comments.length - 1] as Record<string, unknown>).created_at : null,
    has_more: hasMore,
  });
};
