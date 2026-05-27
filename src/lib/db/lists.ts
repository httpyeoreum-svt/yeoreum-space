import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { CuratedList, Item } from "@/lib/types";
import { rowToList } from "./transform";
import { getAllItems } from "./items";

const LIST_SELECT = "*, list_items(item_id, position)";

export const getAllLists = cache(async (): Promise<CuratedList[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lists")
    .select(LIST_SELECT)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToList);
});

export const getListBySlug = cache(
  async (slug: string): Promise<CuratedList | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("lists")
      .select(LIST_SELECT)
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw error;
    return data ? rowToList(data) : null;
  },
);

/** Expand a list's itemIds into full Item objects, preserving position order. */
export async function getItemsInList(list: CuratedList): Promise<Item[]> {
  const all = await getAllItems();
  const byId = new Map(all.map((i) => [i.id, i]));
  return list.itemIds
    .map((id) => byId.get(id))
    .filter((x): x is Item => Boolean(x));
}
