import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Scene } from "@/lib/types";

export const getAllScenes = cache(async (): Promise<Scene[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("scenes")
    .select("slug, label, sort_order")
    .order("sort_order", { ascending: true });
  if (error) throw new Error(`Failed to fetch scenes: ${error.message}`);
  return (data ?? []).map((r) => ({
    slug: r.slug as string,
    label: r.label as string,
  }));
});
