/**
 * Resolves a path inside `public/` against Vite's configured `BASE_URL`
 * so assets load cleanly on both root domains (Vercel/localhost) and subpaths (GitHub Pages).
 */
export function assetUrl(relativePath: string): string {
  const clean = relativePath.replace(/^\/+/, '');
  return `${import.meta.env.BASE_URL}${clean}`;
}
