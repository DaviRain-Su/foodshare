import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { jsonOk, jsonError } from '../../../lib/response';
import { getAuthUser } from '../../../lib/auth';
import { CONSTANTS } from '../../../lib/constants';
import { isStringInRange } from '../../../lib/validate';

export const PUT: APIRoute = async ({ request }) => {
  const userId = await getAuthUser(request, env.JWT_SECRET);
  if (!userId) return jsonError(401, 'UNAUTHORIZED', 'Not logged in');

  const formData = await request.formData();
  const nickname = formData.get('nickname') as string | null;
  const bio = formData.get('bio') as string | null;
  const avatar = formData.get('avatar') as File | null;

  // Validate
  if (nickname !== null && !isStringInRange(nickname, CONSTANTS.NICKNAME_MIN_LENGTH, CONSTANTS.NICKNAME_MAX_LENGTH)) {
    return jsonError(400, 'INVALID_INPUT', `Nickname must be ${CONSTANTS.NICKNAME_MIN_LENGTH}-${CONSTANTS.NICKNAME_MAX_LENGTH} characters`);
  }

  if (bio !== null && typeof bio === 'string' && bio.length > CONSTANTS.BIO_MAX_LENGTH) {
    return jsonError(400, 'INVALID_INPUT', `Bio must be at most ${CONSTANTS.BIO_MAX_LENGTH} characters`);
  }

  let avatarUrl: string | undefined;

  if (avatar && avatar instanceof File && avatar.size > 0) {
    if (!(CONSTANTS.IMAGE_ALLOWED_TYPES as readonly string[]).includes(avatar.type)) {
      return jsonError(400, 'INVALID_FILE_TYPE', 'Only JPEG, PNG, and WebP are allowed');
    }
    if (avatar.size > CONSTANTS.AVATAR_MAX_SIZE) {
      return jsonError(413, 'FILE_TOO_LARGE', 'Avatar must be at most 512KB');
    }

    const ext = avatar.type.split('/')[1];
    const key = `avatars/${userId}.${ext}`;
    await env.R2_IMAGES.put(key, await avatar.arrayBuffer(), {
      httpMetadata: { contentType: avatar.type },
    });
    avatarUrl = key;
  }

  // Build update query
  const updates: string[] = [];
  const bindings: unknown[] = [];

  if (nickname !== null) {
    updates.push('nickname = ?');
    bindings.push(nickname);
  }
  if (bio !== null) {
    updates.push('bio = ?');
    bindings.push(bio);
  }
  if (avatarUrl !== undefined) {
    updates.push('avatar_url = ?');
    bindings.push(avatarUrl);
  }

  if (updates.length > 0) {
    updates.push("updated_at = datetime('now')");
    bindings.push(userId);
    await env.DB.prepare(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...bindings).run();
  }

  const user = await env.DB.prepare(
    'SELECT id, email, nickname, avatar_url, bio, created_at FROM users WHERE id = ?'
  ).bind(userId).first();

  return jsonOk({ user });
};
