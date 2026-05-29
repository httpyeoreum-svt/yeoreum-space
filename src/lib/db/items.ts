import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Item, MoodSlug } from "@/lib/types";
import { rowToItem } from "./transform";

const ITEM_SELECT = "*, item_moods(mood_slug), item_scenes(scene_slug)";

/** All items, sorted by addedAt descending. Cached per request. */
export const getAllItems = cache(async (): Promise<Item[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("items")
    .select(ITEM_SELECT)
    .order("added_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToItem);
});

export const getItemById = cache(
  async (id: string): Promise<Item | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("items")
      .select(ITEM_SELECT)
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? rowToItem(data) : null;
  },
);

export const getRecentItems = cache(
  async (limit = 6): Promise<Item[]> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("items")
      .select(ITEM_SELECT)
      .order("updated_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []).map(rowToItem);
  },
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
export const getCuratedSimilars = cache(
  async (itemId: string): Promise<Item[]> => {
    const supabase = await createClient();
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
);
