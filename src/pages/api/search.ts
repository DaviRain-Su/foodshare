import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { getAuthUser } from '../../lib/auth';
import { jsonOk, jsonError } from '../../lib/response';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const q = (url.searchParams.get('q') || '').trim();
  if (!q || q.length < 1) return jsonError(400, 'INVALID_QUERY', 'Query is required');
  if (q.length > 100) return jsonError(400, 'QUERY_TOO_LONG', 'Query too long');

  const userId = await getAuthUser(request, env.JWT_SECRET);
  const like = `%${q}%`;

  // Search posts
  const posts = await env.DB.prepare(`
    SELECT p.id, p.content, p.created_at, u.id AS user_id, u.nickname, u.avatar_url,
           (SELECT image_key FROM post_images WHERE post_id = p.id ORDER BY sort_order LIMIT 1) AS first_image
    FROM posts p JOIN users u ON p.user_id = u.id
    WHERE p.content LIKE ?
    ORDER BY p.created_at DESC LIMIT 20
  `).bind(like).all();

  // Search tags
  const tags = await env.DB.prepare(`
    SELECT tag, COUNT(*) AS count FROM post_tags WHERE tag LIKE ? GROUP BY tag ORDER BY count DESC LIMIT 10
  `).bind(like).all();

  // Search users
  const users = await env.DB.prepare(`
    SELECT id, nickname, avatar_url, bio FROM users WHERE nickname LIKE ? OR email LIKE ? LIMIT 10
  `).bind(like, like).all();

  const imagePrefix = env.R2_PUBLIC_URL || '/api/images';

  return jsonOk({
    posts: (posts.results || []).map((p: any) => ({
      id: p.id,
      content: p.content?.slice(0, 100),
      created_at: p.created_at,
      user: { id: p.user_id, nickname: p.nickname, avatar_url: p.avatar_url },
      thumbnail: p.first_image ? `${imagePrefix}/${p.first_image}` : null,
    })),
    tags: (tags.results || []).map((t: any) => ({ tag: t.tag, count: t.count })),
    users: (users.results || []).map((u: any) => ({ id: u.id, nickname: u.nickname, avatar_url: u.avatar_url, bio: u.bio })),
  });
};
