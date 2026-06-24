import type { Category } from "@/lib/types";

/** Shared Tailwind class strings for repeated UI atoms. */

/** Rounded outline "pill" used for tags, genres, scenes, notes, etc. */
export const TAG_PILL_CLS =
  "inline-flex items-center rounded-full border border-[color:var(--color-line)]/60 bg-[color:var(--color-paper)] px-2.5 py-0.5 text-[11px] text-[color:var(--color-ink-muted)]";

/**
 * Aspect ratio class for an item's cover, matching each category's natural
 * artwork shape so `object-cover` doesn't crop it:
 * games = 16:9 landscape, films / books = 3:4 portrait, music / perfume = square.
 */
export function cardAspectClass(category: Category): string {
  switch (category) {
    case "games":
      return "aspect-video";
    case "films":
    case "books":
      return "aspect-[3/4]";
    default:
      return "aspect-square";
  }
}
