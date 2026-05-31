import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createAnonClient } from "@/lib/supabase/anon";
import type { CuratedList, Item } from "@/lib/types";
import { rowToList } from "./transform";
import { getAllItems } from "./items";

const LIST_SELECT = "*, list_items(item_id, position)";

export const getAllLists = cache(
  unstable_cache(
    async (): Promise<CuratedList[]> => {
      const supabase = createAnonClient();
      const { data, error } = await supabase
        .from("lists")
        .select(LIST_SELECT)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(rowToList);
    },
    ["all-lists"],
    { revalidate: 60, tags: ["lists"] },
  ),
);

export const getListBySlug = cache(
  unstable_cache(
    async (slug: string): Promise<CuratedList | null> => {
      const supabase = createAnonClient();
      const { data, error } = await supabase
        .from("lists")
        .select(LIST_SELECT)
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data ? rowToList(data) : null;
    },
    ["list-by-slug"],
    { revalidate: 60, tags: ["lists"] },
  ),
);

/** Expand a list's itemIds into full Item objects, preserving position order. */
export async function getItemsInList(list: CuratedList): Promise<Item[]> {
  const all = await getAllItems();
  const byId = new Map(all.map((i) => [i.id, i]));
  return list.itemIds
    .map((id) => byId.get(id))
    .filter((x): x is Item => Boolean(x));
}
