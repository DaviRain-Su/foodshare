import type { APIRoute } from 'astro';
import { jsonOk } from '../../../lib/response';
import { clearTokenCookie } from '../../../lib/auth';

export const POST: APIRoute = async () => {
  const res = jsonOk({});
  res.headers.set('Set-Cookie', clearTokenCookie());
  return res;
};
