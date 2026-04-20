export function avatarSrc(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('/')) return url;
  return `/api/images/${url}`;
}
