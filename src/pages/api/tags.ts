import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { jsonOk } from '../../lib/response';

export const GET: APIRoute = async () => {

  const { results } = await env.DB.prepare(
    'SELECT tag AS name, COUNT(*) AS count FROM post_tags GROUP BY tag ORDER BY count DESC LIMIT 20'
  ).all();

  return jsonOk({ tags: results });
};
