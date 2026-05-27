import type { Item } from "@/lib/types";
import { MusicDetail } from "./details/music-detail";
import { GenericDetail } from "./details/generic-detail";
import { getCuratedSimilars } from "@/lib/db/items";

/**
 * Dispatcher: routes to category-specific detail layouts.
 * Music has a rich 2-column layout; others fall back to GenericDetail.
 *
 * Similar songs are owner-curated (manual links in `item_similars`), not
 * derived from mood overlap. Empty list → section hides itself in MusicDetail.
 */
export async function ItemDetailContent({
  item,
  related,
}: {
  item: Item;
  related: Item[];
}) {
  if (item.category === "music") {
    const similar = await getCuratedSimilars(item.id);
    return <MusicDetail item={item} similar={similar} />;
  }
  return <GenericDetail item={item} related={related} />;
}
