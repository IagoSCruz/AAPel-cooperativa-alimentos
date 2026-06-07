/**
 * H3: Single source of truth for image-host allowlist.
 *
 * Mirrors `next.config.ts > images.remotePatterns`. When you change one, change
 * the other (kept as plain TS so it can be imported from both server and
 * client components — `next.config.ts` is build-time only).
 *
 * In production this should be derived from env (cooperative-uploaded CDN
 * domain) so deploys do not require code changes.
 */
const STATIC_ALLOWED_HOSTS = ["images.unsplash.com"] as const;

/** Hostnames allowed for https:// image URLs (plus same-origin /uploads paths). */
export function getAllowedImageHosts(): ReadonlySet<string> {
  const hosts = new Set<string>(STATIC_ALLOWED_HOSTS);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    try {
      hosts.add(new URL(appUrl).hostname.toLowerCase());
    } catch {
      /* ignore invalid URL */
    }
  }
  return hosts;
}

/** @deprecated Use getAllowedImageHosts() for dynamic production domain. */
export const ALLOWED_IMAGE_HOSTS: ReadonlySet<string> = getAllowedImageHosts();
