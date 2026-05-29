import type { Item } from "@/lib/types";

/** Minimum number of music items a creator needs before a profile page is created. */
export const ARTIST_PROFILE_THRESHOLD = 6;

/** Normalize a creator name into a URL-safe slug (lowercase, hyphens for spaces). */
export function artistSlug(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "-");
}

/** Returns Set<slug> for creators who have at least the threshold of music items. */
export function getArtistProfileSlugs(items: Item[]): Set<string> {
  const counts = new Map<string, number>();
  for (const it of items) {
    if (it.category !== "music") continue;
    const slug = artistSlug(it.creator);
    if (!slug) continue;
    counts.set(slug, (counts.get(slug) ?? 0) + 1);
  }
  const result = new Set<string>();
  for (const [slug, count] of counts) {
    if (count >= ARTIST_PROFILE_THRESHOLD) result.add(slug);
  }
  return result;
}

/** Resolve a slug back to the matching creator name and their music items. Returns null if below threshold. */
export function findArtistBySlug(
  items: Item[],
  slug: string,
): { creator: string; items: Item[] } | null {
  const decoded = decodeURIComponent(slug).trim().toLowerCase();
  const matched = items.filter(
    (i) => i.category === "music" && artistSlug(i.creator) === decoded,
  );
  if (matched.length < ARTIST_PROFILE_THRESHOLD) return null;
  return { creator: matched[0].creator, items: matched };
}
