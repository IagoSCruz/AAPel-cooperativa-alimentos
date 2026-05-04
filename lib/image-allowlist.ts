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
export const ALLOWED_IMAGE_HOSTS: ReadonlySet<string> = new Set([
  "images.unsplash.com",
]);
