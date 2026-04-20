import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { jsonOk, jsonError } from '../../../lib/response';
import { getAuthUser } from '../../../lib/auth';

export const GET: APIRoute = async ({ params, request }) => {
  const currentUserId = await getAuthUser(request, env.JWT_SECRET);
  const targetId = params.id!;

  const user = await env.DB.prepare(
    'SELECT id, nickname, avatar_url, bio, created_at FROM users WHERE id = ?'
  ).bind(targetId).first();

  if (!user) {
    return jsonError(404, 'USER_NOT_FOUND', 'User not found');
  }

  const [postCount, followerCount, followingCount] = await Promise.all([
    env.DB.prepare('SELECT COUNT(*) AS c FROM posts WHERE user_id = ?').bind(targetId).first<{ c: number }>(),
    env.DB.prepare('SELECT COUNT(*) AS c FROM follows WHERE following_id = ?').bind(targetId).first<{ c: number }>(),
    env.DB.prepare('SELECT COUNT(*) AS c FROM follows WHERE follower_id = ?').bind(targetId).first<{ c: number }>(),
  ]);

  let isFollowing = false;
  if (currentUserId && currentUserId !== targetId) {
    const follow = await env.DB.prepare(
      'SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?'
    ).bind(currentUserId, targetId).first();
    isFollowing = !!follow;
  }

  return jsonOk({
    user: {
      ...user,
      post_count: postCount!.c,
      follower_count: followerCount!.c,
      following_count: followingCount!.c,
      is_following: isFollowing,
    },
  });
};
