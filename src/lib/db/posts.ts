import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createAnonClient } from "@/lib/supabase/anon";
import type { Post } from "@/lib/types";

const POST_SELECT = "*, post_items(item_id, position)";

function rowToPost(row: Record<string, unknown>): Post {
  const joined =
    (row.post_items as { item_id: string; position: number }[] | undefined) ??
    [];
  const sortedItems = [...joined].sort((a, b) => a.position - b.position);
  return {
    slug: row.slug as string,
    title: row.title as string,
    content: (row.content as string | null) ?? "",
    excerpt: (row.excerpt as string | null) ?? undefined,
    coverImage: (row.cover_image as string | null) ?? undefined,
    status: row.status as "draft" | "published",
    publishedAt: (row.published_at as string | null) ?? undefined,
    tags: ((row.tags as string[] | null) ?? []),
    relatedItemIds: sortedItems.map((r) => r.item_id),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

/** Public-facing: only published posts whose published_at has arrived, newest first. */
export const getPublishedPosts = cache(
  unstable_cache(
    async (): Promise<Post[]> => {
      const supabase = createAnonClient();
      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from("posts")
        .select(POST_SELECT)
        .eq("status", "published")
        .lte("published_at", nowIso)
        .order("published_at", { ascending: false, nullsFirst: false });
      if (error) throw new Error(`Failed to fetch posts: ${error.message}`);
      return (data ?? []).map(rowToPost);
    },
    ["published-posts"],
    { revalidate: 60, tags: ["posts"] },
  ),
);

export const getPostBySlug = cache(
  unstable_cache(
    async (slug: string): Promise<Post | null> => {
      const supabase = createAnonClient();
      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from("posts")
        .select(POST_SELECT)
        .eq("slug", slug)
        .eq("status", "published")
        .lte("published_at", nowIso)
        .maybeSingle();
      if (error) throw new Error(`Failed to fetch post: ${error.message}`);
      return data ? rowToPost(data) : null;
    },
    ["post-by-slug"],
    { revalidate: 60, tags: ["posts"] },
  ),
);
