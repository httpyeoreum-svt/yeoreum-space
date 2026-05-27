import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Mood } from "@/lib/types";
import { rowToMood } from "./transform";

/** All moods, ordered by their configured sort order. Cached per request. */
export const getAllMoods = cache(async (): Promise<Mood[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("moods")
    .select("slug, label, bg, tone, tagline, sort_order")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToMood);
});

export const getMoodBySlug = cache(
  async (slug: string): Promise<Mood | null> => {
    const all = await getAllMoods();
    return all.find((m) => m.slug === slug) ?? null;
  },
);
