import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { jsonOk, jsonError } from '../../../lib/response';
import { getAuthUser } from '../../../lib/auth';
import { CONSTANTS } from '../../../lib/constants';
import { isStringInRange } from '../../../lib/validate';

// Create post
export const POST: APIRoute = async ({ request }) => {
  const userId = await getAuthUser(request, env.JWT_SECRET);
  if (!userId) {
    return jsonError(401, 'UNAUTHORIZED', 'Not logged in');
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, 'INVALID_INPUT', 'Invalid JSON body');
  }

  const { content, image_keys, tags, location, restaurant_name, latitude, longitude } = body as {
    content?: string;
    image_keys?: string[];
    tags?: string[];
    location?: string;
    restaurant_name?: string;
    latitude?: number;
    longitude?: number;
  };

  // Validate
  if (content !== undefined && typeof content === 'string' && content.length > CONSTANTS.POST_CONTENT_MAX_LENGTH) {
    return jsonError(400, 'INVALID_INPUT', `Content must be at most ${CONSTANTS.POST_CONTENT_MAX_LENGTH} characters`);
  }

  if (!Array.isArray(image_keys) || image_keys.length < CONSTANTS.POST_IMAGES_MIN || image_keys.length > CONSTANTS.POST_IMAGES_MAX) {
    return jsonError(400, 'INVALID_INPUT', `Must have ${CONSTANTS.POST_IMAGES_MIN}-${CONSTANTS.POST_IMAGES_MAX} images`);
  }

  if (tags && (!Array.isArray(tags) || tags.length > CONSTANTS.TAGS_MAX_COUNT)) {
    return jsonError(400, 'INVALID_INPUT', `At most ${CONSTANTS.TAGS_MAX_COUNT} tags`);
  }

  if (tags) {
    for (const tag of tags) {
      if (typeof tag !== 'string' || tag.length === 0 || tag.length > CONSTANTS.TAG_MAX_LENGTH) {
        return jsonError(400, 'INVALID_INPUT', `Each tag must be 1-${CONSTANTS.TAG_MAX_LENGTH} characters`);
      }
    }
  }

  if (location !== undefined && !isStringInRange(location, 0, CONSTANTS.LOCATION_MAX_LENGTH)) {
    return jsonError(400, 'INVALID_INPUT', `Location must be at most ${CONSTANTS.LOCATION_MAX_LENGTH} characters`);
  }

  if (restaurant_name !== undefined && !isStringInRange(restaurant_name, 0, CONSTANTS.RESTAURANT_NAME_MAX_LENGTH)) {
    return jsonError(400, 'INVALID_INPUT', `Restaurant name must be at most ${CONSTANTS.RESTAURANT_NAME_MAX_LENGTH} characters`);
  }

  const postId = crypto.randomUUID();
  const postContent = content ?? '';

  // Use batch for transaction-like behavior
  const statements = [
    env.DB.prepare(
      'INSERT INTO posts (id, user_id, content, location, restaurant_name, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(postId, userId, postContent, location ?? null, restaurant_name ?? null, latitude ?? null, longitude ?? null),
  ];

  for (let i = 0; i < image_keys.length; i++) {
    statements.push(
      env.DB.prepare(
        'INSERT INTO post_images (id, post_id, image_key, sort_order) VALUES (?, ?, ?, ?)'
      ).bind(crypto.randomUUID(), postId, image_keys[i], i),
    );
  }

  if (tags) {
    for (const tag of tags) {
      statements.push(
        env.DB.prepare(
          'INSERT INTO post_tags (post_id, tag) VALUES (?, ?)'
        ).bind(postId, tag),
      );
    }
  }

  await env.DB.batch(statements);

  // Fetch created post with user info
  const user = await env.DB.prepare(
    'SELECT id, nickname, avatar_url FROM users WHERE id = ?'
  ).bind(userId).first();

  return jsonOk(
    {
      post: {
        id: postId,
        user: user,
        content: postContent,
        images: image_keys.map((key) => ({ url: `${env.R2_PUBLIC_URL}/${key}` })),
        tags: tags ?? [],
        location: location ?? null,
        restaurant_name: restaurant_name ?? null,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        like_count: 0,
        comment_count: 0,
        is_liked: false,
        created_at: new Date().toISOString(),
      },
    },
    201,
  );
};

// Get feed
export const GET: APIRoute = async ({ request, url }) => {
  const userId = await getAuthUser(request, env.JWT_SECRET);

  const cursor = url.searchParams.get('cursor');
  const tag = url.searchParams.get('tag');
  const filterUserId = url.searchParams.get('user_id');
  let limit = parseInt(url.searchParams.get('limit') ?? String(CONSTANTS.FEED_PAGE_SIZE), 10);
  if (isNaN(limit) || limit < 1) limit = CONSTANTS.FEED_PAGE_SIZE;
  if (limit > CONSTANTS.FEED_PAGE_SIZE_MAX) limit = CONSTANTS.FEED_PAGE_SIZE_MAX;

  // Build query
  let query = `
    SELECT p.id, p.user_id, p.content, p.location, p.restaurant_name, p.latitude, p.longitude, p.created_at,
           u.nickname, u.avatar_url,
           (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS like_count,
           (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count
    FROM posts p
    JOIN users u ON p.user_id = u.id
  `;

  const bindings: unknown[] = [];
  const conditions: string[] = [];

  if (tag) {
    query = `
      SELECT p.id, p.user_id, p.content, p.location, p.restaurant_name, p.latitude, p.longitude, p.created_at,
             u.nickname, u.avatar_url,
             (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS like_count,
             (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count
      FROM posts p
      JOIN users u ON p.user_id = u.id
      JOIN post_tags pt ON pt.post_id = p.id
    `;
    conditions.push('pt.tag = ?');
    bindings.push(tag);
  }

  if (filterUserId) {
    conditions.push('p.user_id = ?');
    bindings.push(filterUserId);
  }

  if (cursor) {
    conditions.push('p.created_at < ?');
    bindings.push(cursor);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY p.created_at DESC LIMIT ?';
  bindings.push(limit + 1);

  const { results } = await env.DB.prepare(query).bind(...bindings).all();

  const hasMore = results.length > limit;
  const posts = hasMore ? results.slice(0, limit) : results;

  // Fetch images and tags for each post
  const postIds = posts.map((p: Record<string, unknown>) => p.id as string);

  let imagesMap: Record<string, { url: string }[]> = {};
  let tagsMap: Record<string, string[]> = {};
  let likedSet = new Set<string>();

  if (postIds.length > 0) {
    const placeholders = postIds.map(() => '?').join(',');

    const [imagesResult, tagsResult] = await Promise.all([
      env.DB.prepare(
        `SELECT post_id, image_key FROM post_images WHERE post_id IN (${placeholders}) ORDER BY sort_order`
      ).bind(...postIds).all(),
      env.DB.prepare(
        `SELECT post_id, tag FROM post_tags WHERE post_id IN (${placeholders})`
      ).bind(...postIds).all(),
    ]);

    for (const img of imagesResult.results) {
      const pid = img.post_id as string;
      if (!imagesMap[pid]) imagesMap[pid] = [];
      imagesMap[pid].push({ url: `${env.R2_PUBLIC_URL}/${img.image_key}` });
    }

    for (const t of tagsResult.results) {
      const pid = t.post_id as string;
      if (!tagsMap[pid]) tagsMap[pid] = [];
      tagsMap[pid].push(t.tag as string);
    }

    // Check likes if logged in
    if (userId) {
      const likesResult = await env.DB.prepare(
        `SELECT post_id FROM likes WHERE user_id = ? AND post_id IN (${placeholders})`
      ).bind(userId, ...postIds).all();
      for (const l of likesResult.results) {
        likedSet.add(l.post_id as string);
      }
    }
  }

  const formattedPosts = posts.map((p: Record<string, unknown>) => {
    const pid = p.id as string;
    return {
      id: pid,
      user: {
        id: p.user_id,
        nickname: p.nickname,
        avatar_url: p.avatar_url,
      },
      content: p.content,
      images: imagesMap[pid] ?? [],
      tags: tagsMap[pid] ?? [],
      location: p.location,
      restaurant_name: p.restaurant_name,
      latitude: p.latitude,
      longitude: p.longitude,
      like_count: p.like_count,
      comment_count: p.comment_count,
      is_liked: likedSet.has(pid),
      created_at: p.created_at,
    };
  });

  return jsonOk({
    posts: formattedPosts,
    next_cursor: hasMore ? (posts[posts.length - 1] as Record<string, unknown>).created_at : null,
    has_more: hasMore,
  });
};
