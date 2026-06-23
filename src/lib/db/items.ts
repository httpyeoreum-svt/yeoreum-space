import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createAnonClient } from "@/lib/supabase/anon";
import type { Item, MoodSlug } from "@/lib/types";
import { rowToItem } from "./transform";

const ITEM_SELECT = "*, item_moods(mood_slug), item_scenes(scene_slug)";
/** Cross-request Data Cache settings shared by every items read. */
const ITEMS_TAG = "items";
const ITEMS_REVALIDATE = 60;

/**
 * All items, sorted by addedAt descending.
 * - `unstable_cache`: persists the Supabase result across requests/deploys
 *   (≤60s stale) so dynamic pages don't re-fetch the whole table every time.
 * - `cache`: dedupes repeat calls within a single render.
 */
export const getAllItems = cache(
  unstable_cache(
    async (): Promise<Item[]> => {
      const supabase = createAnonClient();
      const { data, error } = await supabase
        .from("items")
        .select(ITEM_SELECT)
        .order("added_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(rowToItem);
    },
    ["all-items"],
    { revalidate: ITEMS_REVALIDATE, tags: [ITEMS_TAG] },
  ),
);

export const getItemById = cache(
  unstable_cache(
    async (id: string): Promise<Item | null> => {
      const supabase = createAnonClient();
      const { data, error } = await supabase
        .from("items")
        .select(ITEM_SELECT)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data ? rowToItem(data) : null;
    },
    ["item-by-id"],
    { revalidate: ITEMS_REVALIDATE, tags: [ITEMS_TAG] },
  ),
);

export const getRecentItems = cache(
  unstable_cache(
    async (limit = 6): Promise<Item[]> => {
      const supabase = createAnonClient();
      const { data, error } = await supabase
        .from("items")
        .select(ITEM_SELECT)
        .order("added_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []).map(rowToItem);
    },
    ["recent-items"],
    { revalidate: ITEMS_REVALIDATE, tags: [ITEMS_TAG] },
  ),
);

export const getGridItems = cache(
  async (offset = 6, limit = 6): Promise<Item[]> => {
    const all = await getAllItems();
    return all.slice(offset, offset + limit);
  },
);

export const getItemsByMood = cache(
  async (slug: MoodSlug | string): Promise<Item[]> => {
    const all = await getAllItems();
    return all.filter((i) => (i.moods as string[]).includes(slug));
  },
);

/** Items sharing at least one mood with the given item, sorted by overlap then date. */
export const getRelatedByMood = cache(
  async (item: Item, limit = 6): Promise<Item[]> => {
    const all = await getAllItems();
    return all
      .filter(
        (i) =>
          i.id !== item.id &&
          i.moods.some((m) => item.moods.includes(m)),
      )
      .map((i) => ({
        item: i,
        overlap: i.moods.filter((m) => item.moods.includes(m)).length,
      }))
      .sort(
        (a, b) =>
          b.overlap - a.overlap ||
          (a.item.addedAt < b.item.addedAt ? 1 : -1),
      )
      .slice(0, limit)
      .map(({ item }) => item);
  },
);

/** Same-category items related by mood — used for "Similar Songs" etc. */
export const getSimilarInCategory = cache(
  async (item: Item, limit = 5): Promise<Item[]> => {
    const related = await getRelatedByMood(item, 20);
    return related.filter((i) => i.category === item.category).slice(0, limit);
  },
);

/**
 * Curated, owner-picked "similar" items for `itemId`, read from the
 * `item_similars` table. Links are bidirectional (each pair stored twice),
 * so we just look up `where item_id = X`. Returns [] if no curated links exist.
 */
/** Fetch items by id, preserving the order of `ids` (missing ids dropped). */
export const getItemsByIds = cache(
  unstable_cache(
    async (ids: string[]): Promise<Item[]> => {
      const clean = ids.filter(Boolean);
      if (clean.length === 0) return [];
      const supabase = createAnonClient();
      const { data, error } = await supabase
        .from("items")
        .select(ITEM_SELECT)
        .in("id", clean);
      if (error) throw error;
      const byId = new Map((data ?? []).map((r) => [r.id as string, rowToItem(r)]));
      return clean
        .map((id) => byId.get(id))
        .filter((x): x is Item => Boolean(x));
    },
    ["items-by-ids"],
    { revalidate: ITEMS_REVALIDATE, tags: [ITEMS_TAG] },
  ),
);

export const getCuratedSimilars = cache(
  unstable_cache(
    async (itemId: string): Promise<Item[]> => {
      const supabase = createAnonClient();
      const { data: links, error: linksError } = await supabase
        .from("item_similars")
        .select("similar_id")
        .eq("item_id", itemId);
      if (linksError) throw linksError;

      const ids = (links ?? []).map((r) => r.similar_id as string);
      if (ids.length === 0) return [];

      const { data, error } = await supabase
        .from("items")
        .select(ITEM_SELECT)
        .in("id", ids);
      if (error) throw error;
      return (data ?? []).map(rowToItem);
    },
    ["curated-similars"],
    { revalidate: ITEMS_REVALIDATE, tags: [ITEMS_TAG] },
  ),
);
