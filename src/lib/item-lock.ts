import type { Item } from "@/lib/types";

/**
 * IDs that carry the `ageLimit` flag for tagging purposes but should remain
 * visible without age verification. Add IDs here when an item should display
 * normally despite the flag still being set in the database.
 */
const AGE_LIMIT_DISPLAY_ALLOWLIST = new Set<string>();

/** Single source of truth for whether to blur / gate an item card. Safe in both server and client modules. */
export function isItemLocked(
  item: Pick<Item, "id" | "ageLimit">,
  ageVerified: boolean,
): boolean {
  if (!item.ageLimit) return false;
  if (ageVerified) return false;
  if (AGE_LIMIT_DISPLAY_ALLOWLIST.has(item.id)) return false;
  return true;
}
