/**
 * Resolve an app-relative asset path against Vite's base URL.
 * Keeps absolute URLs (e.g. flagcdn fallbacks) untouched.
 */
export function assetUrl(path: string): string {
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  const base = import.meta.env.BASE_URL ?? "/";
  return `${base}${path.replace(/^\//, "")}`;
}
