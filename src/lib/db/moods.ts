import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createAnonClient } from "@/lib/supabase/anon";
import type { Mood } from "@/lib/types";
import { rowToMood } from "./transform";

/** All moods, ordered by their configured sort order. Cached cross-request + per render. */
export const getAllMoods = cache(
  unstable_cache(
    async (): Promise<Mood[]> => {
      const supabase = createAnonClient();
      const { data, error } = await supabase
        .from("moods")
        .select("slug, label, bg, tone, tagline, sort_order")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []).map(rowToMood);
    },
    ["all-moods"],
    { revalidate: 60, tags: ["moods"] },
  ),
);

export const getMoodBySlug = cache(
  async (slug: string): Promise<Mood | null> => {
    const all = await getAllMoods();
    return all.find((m) => m.slug === slug) ?? null;
  },
);
