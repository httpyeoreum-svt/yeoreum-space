import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createAnonClient } from "@/lib/supabase/anon";
import type { Novel } from "@/lib/types";

function rowToNovel(row: Record<string, unknown>): Novel {
  return {
    slug: row.slug as string,
    title: row.title as string,
    content: (row.content as string | null) ?? "",
    excerpt: (row.excerpt as string | null) ?? undefined,
    coverImage: (row.cover_image as string | null) ?? undefined,
    status: row.status as "draft" | "published",
    publishedAt: (row.published_at as string | null) ?? undefined,
    tags: (row.tags as string[] | null) ?? [],
    members: (row.members as string[] | null) ?? [],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

/** Public-facing: only published novels whose published_at has arrived, newest first. */
export const getPublishedNovels = cache(
  unstable_cache(
    async (): Promise<Novel[]> => {
      const supabase = createAnonClient();
      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from("novels")
        .select("*")
        .eq("status", "published")
        .lte("published_at", nowIso)
        .order("published_at", { ascending: false, nullsFirst: false });
      if (error) throw new Error(`Failed to fetch novels: ${error.message}`);
      return (data ?? []).map(rowToNovel);
    },
    ["published-novels"],
    { revalidate: 60, tags: ["novels"] },
  ),
);

export const getNovelBySlug = cache(
  unstable_cache(
    async (slug: string): Promise<Novel | null> => {
      const supabase = createAnonClient();
      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from("novels")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .lte("published_at", nowIso)
        .maybeSingle();
      if (error) throw new Error(`Failed to fetch novel: ${error.message}`);
      return data ? rowToNovel(data) : null;
    },
    ["novel-by-slug"],
    { revalidate: 60, tags: ["novels"] },
  ),
);
