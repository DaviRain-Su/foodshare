/// <reference path="../.astro/types.d.ts" />

declare module 'cloudflare:workers' {
  interface CloudflareEnv {
    DB: import('@cloudflare/workers-types').D1Database;
    R2_IMAGES: import('@cloudflare/workers-types').R2Bucket;
    JWT_SECRET: string;
    R2_PUBLIC_URL: string;
  }
  export const env: CloudflareEnv;
}
