/**
 * H3: Drop-in replacement for `<img>` that enforces the same host allowlist
 * as `next.config.ts` `images.remotePatterns`.
 *
 * Why: bare `<img src={apiUrl}>` bypasses `next/image`'s domain whitelist.
 * If a compromised admin (or stored XSS in the admin UI) lands an arbitrary
 * `image_url` in the API, the storefront would otherwise hot-link it from
 * any domain — leaking referrers, enabling tracking pixels, or rendering
 * malicious SVGs cross-origin.
 *
 * This wrapper keeps the existing layouts (no width/height refactor) while
 * re-introducing the host gate. If the URL fails the check, the slot is
 * left empty so the surrounding placeholder stays visible.
 */

import { ALLOWED_IMAGE_HOSTS } from "@/lib/image-allowlist";
import type { ImgHTMLAttributes } from "react";

function isAllowed(src: string | undefined): boolean {
  if (!src) return false;

  // Same-origin / relative paths (e.g. /uploads/foo.jpg) — safe.
  if (src.startsWith("/") && !src.startsWith("//")) return true;

  // Data/blob URLs — refuse: they're a common XSS vector and we don't use them.
  if (/^(data|blob|javascript|file|about):/i.test(src)) return false;

  try {
    const u = new URL(src);
    if (u.protocol !== "https:") return false;
    return ALLOWED_IMAGE_HOSTS.has(u.hostname.toLowerCase());
  } catch {
    return false;
  }
}

export type SafeImageProps = ImgHTMLAttributes<HTMLImageElement>;

export function SafeImage({ src, alt = "", ...rest }: SafeImageProps) {
  if (typeof src !== "string" || !isAllowed(src)) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} {...rest} />;
}
