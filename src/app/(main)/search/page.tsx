import { Suspense } from "react";
import Link from "next/link";
import { getAllItems } from "@/lib/db/items";
import { getAllMoods } from "@/lib/db/moods";
import { getPublishedPosts } from "@/lib/db/posts";
import { isAgeVerified } from "@/lib/age-verify";
import { isItemLocked } from "@/lib/item-lock";
import { ItemCardSmall } from "@/components/item-card-small";
import { SearchBar } from "@/components/search-bar";
import { OptimizedImage } from "@/components/optimized-image";
import { formatCardDate } from "@/lib/format";
import type { Item, Post } from "@/lib/types";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const [items, moods, posts, ageVerified] = await Promise.all([
    getAllItems(),
    getAllMoods(),
    getPublishedPosts(),
    isAgeVerified(),
  ]);

  const filtered = filterItems(items, moods, query);
  const filteredPosts = filterPosts(posts, query);
  const totalResults = filtered.length + filteredPosts.length;

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <header className="px-6 pt-6 pb-3">
        <p className="text-[10px] tracking-[0.3em] text-[color:var(--color-ink-soft)] mb-2">
          SEARCH
        </p>
        <h1 className="font-serif text-[32px] sm:text-[36px] leading-none text-[color:var(--color-ink)]">
          {query ? `“${query}”` : "Search the collection."}
        </h1>
        <p className="mt-3 text-xs text-[color:var(--color-ink-muted)]">
          {query
            ? `${totalResults} result${totalResults === 1 ? "" : "s"}` +
              (filteredPosts.length > 0 && filtered.length > 0
                ? ` (${filtered.length} items, ${filteredPosts.length} journal)`
                : "")
            : "Search across titles, creators, ids, moods, members, lyrics, and journal posts."}
        </p>
      </header>
      <section className="px-6 pt-1 pb-4">
        <Suspense fallback={null}>
          <SearchBar className="max-w-2xl" autoFocus />
        </Suspense>
      </section>
      {query && (
        <section className="px-6 pb-8 flex flex-col gap-8">
          {filteredPosts.length > 0 && (
            <div>
              <h2 className="text-[10px] tracking-[0.3em] text-[color:var(--color-ink-soft)] mb-3">
                JOURNAL ({filteredPosts.length})
              </h2>
              <ul className="flex flex-col">
                {filteredPosts.map((post) => (
                  <li key={post.slug}>
                    <Link
                      href={`/journal/${post.slug}`}
                      className="group flex gap-4 py-4 border-b border-[color:var(--color-line)]/30 last:border-b-0 hover:bg-[color:var(--color-cream-soft)]/40 transition px-2 -mx-2"
                    >
                      {post.coverImage && (
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 overflow-hidden bg-[color:var(--color-cream-deep)]">
                          <OptimizedImage src={post.coverImage} sizes="80px" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 text-[9px] tracking-[0.2em] text-[color:var(--color-ink-soft)]">
                          {post.publishedAt && (
                            <span>{formatCardDate(post.publishedAt)}</span>
                          )}
                          {post.tags.length > 0 && (
                            <>
                              <span>·</span>
                              <span className="truncate">
                                {post.tags.slice(0, 3).join(" / ")}
                              </span>
                            </>
                          )}
                        </div>
                        <h3 className="font-serif text-[18px] sm:text-[20px] leading-tight text-[color:var(--color-ink)] group-hover:underline underline-offset-2 break-words">
                          {post.title}
                        </h3>
                        {post.excerpt && (
                          <p className="mt-1 text-[12px] text-[color:var(--color-ink-muted)] leading-relaxed line-clamp-2">
                            {post.excerpt}
                          </p>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {filtered.length > 0 && (
            <div>
              <h2 className="text-[10px] tracking-[0.3em] text-[color:var(--color-ink-soft)] mb-3">
                COLLECTION ({filtered.length})
              </h2>
              <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
                {filtered.map((item) => (
                  <ItemCardSmall
                    key={item.id}
                    item={item}
                    locked={isItemLocked(item, ageVerified)}
                  />
                ))}
              </div>
            </div>
          )}

          {totalResults === 0 && (
            <p className="text-[12px] text-[color:var(--color-ink-soft)] py-8">
              No matches found.
            </p>
          )}
        </section>
      )}
    </div>
  );
}

function filterPosts(posts: Post[], query: string): Post[] {
  if (!query) return [];
  const q = query.toLowerCase();
  return posts.filter((p) => {
    if (p.title.toLowerCase().includes(q)) return true;
    if (p.slug.toLowerCase().includes(q)) return true;
    if (p.excerpt?.toLowerCase().includes(q)) return true;
    if (p.tags.some((t) => t.toLowerCase().includes(q))) return true;
    // Strip HTML tags from content before matching
    const text = p.content.replace(/<[^>]*>/g, " ").toLowerCase();
    if (text.includes(q)) return true;
    return false;
  });
}

function filterItems(
  items: Item[],
  moods: { slug: string; label: string }[],
  query: string,
): Item[] {
  if (!query) return [];
  const q = query.toLowerCase();
  const matchingMoodSlugs = new Set(
    moods
      .filter(
        (m) =>
          m.label.toLowerCase().includes(q) ||
          m.slug.toLowerCase().includes(q),
      )
      .map((m) => m.slug),
  );
  return items.filter((i) => {
    if (
      i.title.toLowerCase().includes(q) ||
      i.creator.toLowerCase().includes(q) ||
      i.id.toLowerCase().includes(q)
    ) {
      return true;
    }
    if (i.moods.some((s) => matchingMoodSlugs.has(s))) return true;
    if (i.meta?.category === "music") {
      const m = i.meta;
      if (m.likedByGroup?.toLowerCase().includes(q)) return true;
      if (
        m.likedBy?.some(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.groupName?.toLowerCase().includes(q),
        )
      ) {
        return true;
      }
      if (m.cover?.members?.some((name) => name.toLowerCase().includes(q))) {
        return true;
      }
      if (
        m.lyricExcerpt?.original?.toLowerCase().includes(q) ||
        m.lyricExcerpt?.japanese?.toLowerCase().includes(q)
      ) {
        return true;
      }
    }
    return false;
  });
}
