/**
 * Hosts whose images we route through next/image (Vercel) optimization. Must
 * stay in sync with `images.remotePatterns` in next.config.ts — a host listed
 * here but not there would 400 at request time.
 */
const OPTIMIZABLE_HOST_SUFFIXES = [".supabase.co", ".mzstatic.com"];

/**
 * True when `next/image` can safely optimize this URL. Unknown hosts (e.g. a
 * legacy URL pasted from some other site) return false so the caller can fall
 * back to a plain <img> instead of triggering a 400 from the optimizer.
 */
export function isOptimizableImage(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const { protocol, hostname } = new URL(url);
    if (protocol !== "https:") return false;
    return OPTIMIZABLE_HOST_SUFFIXES.some((s) => hostname.endsWith(s));
  } catch {
    return false;
  }
}
