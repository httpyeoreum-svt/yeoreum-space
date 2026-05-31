import Link from "next/link";
import { getPublishedPosts } from "@/lib/db/posts";
import { formatCardDate } from "@/lib/format";
import { OptimizedImage } from "@/components/optimized-image";

export default async function JournalPage() {
  const posts = await getPublishedPosts();

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <header className="px-6 pt-6 pb-4">
        <p className="text-[10px] tracking-[0.3em] text-[color:var(--color-ink-soft)] mb-2">
          THE JOURNAL
        </p>
        <h1 className="font-serif text-[36px] sm:text-[40px] leading-none text-[color:var(--color-ink)]">
          Notes from the room.
        </h1>
        <p className="mt-3 text-xs text-[color:var(--color-ink-muted)] max-w-xl">
          Longer-form writing — about a song, a season, a passing thought.
        </p>
      </header>

      <div className="px-6 pb-10">
        {posts.length === 0 ? (
          <p className="text-[12px] text-[color:var(--color-ink-soft)]">
            No posts yet.
          </p>
        ) : (
          <ul className="flex flex-col">
            {posts.map((post) => (
              <li key={post.slug}>
                <Link
                  href={`/journal/${post.slug}`}
                  className="tap group flex gap-4 py-5 border-b border-[color:var(--color-line)]/30 last:border-b-0 hover:bg-[color:var(--color-cream-soft)]/40 transition px-2 -mx-2"
                >
                  {post.coverImage && (
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 overflow-hidden bg-[color:var(--color-cream-deep)]">
                      <OptimizedImage src={post.coverImage} sizes="96px" />
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
                    <h2 className="font-serif text-[20px] sm:text-[24px] leading-tight text-[color:var(--color-ink)] group-hover:underline underline-offset-2 break-words">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="mt-1.5 text-[12px] text-[color:var(--color-ink-muted)] leading-relaxed line-clamp-2">
                        {post.excerpt}
                      </p>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
