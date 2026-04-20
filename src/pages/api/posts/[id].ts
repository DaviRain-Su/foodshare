import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { jsonOk, jsonError } from '../../../lib/response';
import { getAuthUser } from '../../../lib/auth';

// Get post detail
export const GET: APIRoute = async ({ params, request }) => {
  const userId = await getAuthUser(request, env.JWT_SECRET);
  const postId = params.id!;

  const post = await env.DB.prepare(`
    SELECT p.id, p.user_id, p.content, p.location, p.restaurant_name, p.created_at,
           u.nickname, u.avatar_url,
           (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS like_count,
           (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count
    FROM posts p
    JOIN users u ON p.user_id = u.id
    WHERE p.id = ?
  `).bind(postId).first();

  if (!post) {
    return jsonError(404, 'POST_NOT_FOUND', 'Post not found');
  }

  const [imagesResult, tagsResult] = await Promise.all([
    env.DB.prepare(
      'SELECT image_key FROM post_images WHERE post_id = ? ORDER BY sort_order'
    ).bind(postId).all(),
    env.DB.prepare(
      'SELECT tag FROM post_tags WHERE post_id = ?'
    ).bind(postId).all(),
  ]);

  let isLiked = false;
  if (userId) {
    const like = await env.DB.prepare(
      'SELECT 1 FROM likes WHERE post_id = ? AND user_id = ?'
    ).bind(postId, userId).first();
    isLiked = !!like;
  }

  return jsonOk({
    post: {
      id: post.id,
      user: {
        id: post.user_id,
        nickname: post.nickname,
        avatar_url: post.avatar_url,
      },
      content: post.content,
      images: imagesResult.results.map((img) => ({
        url: `${env.R2_PUBLIC_URL}/${img.image_key}`,
      })),
      tags: tagsResult.results.map((t) => t.tag),
      location: post.location,
      restaurant_name: post.restaurant_name,
      like_count: post.like_count,
      comment_count: post.comment_count,
      is_liked: isLiked,
      created_at: post.created_at,
    },
  });
};

// Delete post
export const DELETE: APIRoute = async ({ params, request }) => {
  const userId = await getAuthUser(request, env.JWT_SECRET);
  if (!userId) {
    return jsonError(401, 'UNAUTHORIZED', 'Not logged in');
  }

  const postId = params.id!;

  const post = await env.DB.prepare(
    'SELECT user_id FROM posts WHERE id = ?'
  ).bind(postId).first<{ user_id: string }>();

  if (!post) {
    return jsonError(404, 'POST_NOT_FOUND', 'Post not found');
  }

  if (post.user_id !== userId) {
    return jsonError(403, 'FORBIDDEN', 'Not the author');
  }

  // Get image keys to clean up R2
  const images = await env.DB.prepare(
    'SELECT image_key FROM post_images WHERE post_id = ?'
  ).bind(postId).all();

  // Delete from D1 (CASCADE handles images, tags, comments, likes)
  await env.DB.prepare('DELETE FROM posts WHERE id = ?').bind(postId).run();

  // Delete from R2
  for (const img of images.results) {
    await env.R2_IMAGES.delete(img.image_key as string);
  }

  return jsonOk({});
};
