import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createAnonClient } from "@/lib/supabase/anon";
import type { Scene } from "@/lib/types";

export const getAllScenes = cache(
  unstable_cache(
    async (): Promise<Scene[]> => {
      const supabase = createAnonClient();
      const { data, error } = await supabase
        .from("scenes")
        .select("slug, label, sort_order")
        .order("sort_order", { ascending: true });
      if (error) throw new Error(`Failed to fetch scenes: ${error.message}`);
      return (data ?? []).map((r) => ({
        slug: r.slug as string,
        label: r.label as string,
      }));
    },
    ["all-scenes"],
    { revalidate: 60, tags: ["scenes"] },
  ),
);
