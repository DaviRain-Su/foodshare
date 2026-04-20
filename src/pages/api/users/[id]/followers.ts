import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { jsonOk } from '../../../../lib/response';
import { getAuthUser } from '../../../../lib/auth';

export const GET: APIRoute = async ({ params, request, url }) => {
  const userId = await getAuthUser(request, env.JWT_SECRET);
  const targetId = params.id!;

  const cursor = url.searchParams.get('cursor');
  let limit = parseInt(url.searchParams.get('limit') ?? '20', 10);
  if (isNaN(limit) || limit < 1) limit = 20;
  if (limit > 50) limit = 50;

  const bindings: unknown[] = [targetId];
  let query = `
    SELECT u.id, u.nickname, u.avatar_url, f.created_at
    FROM follows f
    JOIN users u ON f.follower_id = u.id
    WHERE f.following_id = ?
  `;

  if (cursor) {
    query += ' AND f.created_at < ?';
    bindings.push(cursor);
  }

  query += ' ORDER BY f.created_at DESC LIMIT ?';
  bindings.push(limit + 1);

  const { results } = await env.DB.prepare(query).bind(...bindings).all();

  const hasMore = results.length > limit;
  const users = hasMore ? results.slice(0, limit) : results;

  // Check if current user follows each of these
  let followingSet = new Set<string>();
  if (userId && users.length > 0) {
    const ids = users.map((u: Record<string, unknown>) => u.id as string);
    const placeholders = ids.map(() => '?').join(',');
    const followResults = await env.DB.prepare(
      `SELECT following_id FROM follows WHERE follower_id = ? AND following_id IN (${placeholders})`
    ).bind(userId, ...ids).all();
    for (const f of followResults.results) {
      followingSet.add(f.following_id as string);
    }
  }

  return jsonOk({
    users: users.map((u: Record<string, unknown>) => ({
      id: u.id,
      nickname: u.nickname,
      avatar_url: u.avatar_url,
      is_following: followingSet.has(u.id as string),
    })),
    next_cursor: hasMore ? (users[users.length - 1] as Record<string, unknown>).created_at : null,
    has_more: hasMore,
  });
};
