import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { jsonOk, jsonError } from '../../lib/response';
import { getAuthUser } from '../../lib/auth';
import { CONSTANTS } from '../../lib/constants';

export const POST: APIRoute = async ({ request }) => {
  const userId = await getAuthUser(request, env.JWT_SECRET);
  if (!userId) {
    return jsonError(401, 'UNAUTHORIZED', 'Not logged in');
  }

  const formData = await request.formData();
  const image = formData.get('image') as File | null;
  const type = formData.get('type') as string | null;

  if (!image || !(image instanceof File)) {
    return jsonError(400, 'INVALID_INPUT', 'Image file is required');
  }

  if (!type || !['post', 'avatar'].includes(type)) {
    return jsonError(400, 'INVALID_INPUT', 'Type must be "post" or "avatar"');
  }

  // Validate file type
  if (!(CONSTANTS.IMAGE_ALLOWED_TYPES as readonly string[]).includes(image.type)) {
    return jsonError(400, 'INVALID_FILE_TYPE', 'Only JPEG, PNG, and WebP are allowed');
  }

  // Validate file size
  const maxSize = type === 'avatar' ? CONSTANTS.AVATAR_MAX_SIZE : CONSTANTS.IMAGE_MAX_SIZE;
  if (image.size > maxSize) {
    return jsonError(413, 'FILE_TOO_LARGE', `File exceeds ${maxSize / 1024 / 1024}MB limit`);
  }

  // Generate key
  const ext = image.type.split('/')[1];
  const key = type === 'avatar'
    ? `avatars/${userId}.${ext}`
    : `posts/${crypto.randomUUID()}.${ext}`;

  // Upload to R2
  await env.R2_IMAGES.put(key, await image.arrayBuffer(), {
    httpMetadata: { contentType: image.type },
  });

  return jsonOk(
    {
      image_key: key,
      url: `${env.R2_PUBLIC_URL}/${key}`,
    },
    201,
  );
};
