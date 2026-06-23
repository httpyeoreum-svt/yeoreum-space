import Link from "next/link";
import { X } from "lucide-react";
import { getPublishedNovels } from "@/lib/db/novels";
import { formatCardDate } from "@/lib/format";
import { OptimizedImage } from "@/components/optimized-image";

export default async function NovelsPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const { tag } = await searchParams;
  const activeTag = tag?.trim() || null;
  const all = await getPublishedNovels();
  const novels = activeTag
    ? all.filter((n) => n.tags.includes(activeTag))
    : all;

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <header className="px-6 pt-6 pb-4">
        <p className="text-[10px] tracking-[0.3em] text-[color:var(--color-ink-soft)] mb-2">
          NOVELS
        </p>
        <h1 className="font-serif text-[36px] sm:text-[40px] leading-none text-[color:var(--color-ink)]">
          Original fiction.
        </h1>
        {activeTag ? (
          <div className="mt-3 flex items-center gap-2 text-xs text-[color:var(--color-ink-muted)]">
            <span className="tracking-[0.15em] text-[color:var(--color-ink)]">
              #{activeTag}
            </span>
            <Link
              href="/novels"
              className="inline-flex items-center gap-1 text-[10px] tracking-[0.2em] text-[color:var(--color-ink-soft)] hover:text-[color:var(--color-ink)] transition"
            >
              <X size={11} strokeWidth={1.5} />
              CLEAR
            </Link>
          </div>
        ) : (
          <p className="mt-3 text-xs text-[color:var(--color-ink-muted)] max-w-xl">
            Self-authored short stories — read-through pieces written here.
          </p>
        )}
      </header>

      <div className="px-6 pb-10">
        {novels.length === 0 ? (
          <p className="text-[12px] text-[color:var(--color-ink-soft)]">
            {activeTag ? "No novels with this tag." : "No novels yet."}
          </p>
        ) : (
          <ul className="flex flex-col">
            {novels.map((novel) => (
              <li key={novel.slug}>
                <Link
                  href={`/novels/${novel.slug}`}
                  className="tap group flex gap-4 py-2.5 border-b border-[color:var(--color-line)]/30 last:border-b-0 hover:bg-[color:var(--color-cream-soft)]/40 transition px-2 -mx-2"
                >
                  {novel.coverImage && (
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 overflow-hidden bg-[color:var(--color-cream-deep)]">
                      <OptimizedImage src={novel.coverImage} sizes="96px" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 text-[9px] tracking-[0.2em] text-[color:var(--color-ink-soft)]">
                      {novel.publishedAt && (
                        <span>{formatCardDate(novel.publishedAt)}</span>
                      )}
                      {novel.tags.length > 0 && (
                        <>
                          <span>·</span>
                          <span className="truncate">
                            {novel.tags.slice(0, 3).join(" / ")}
                          </span>
                        </>
                      )}
                    </div>
                    <h2 className="font-serif text-[20px] sm:text-[24px] leading-tight text-[color:var(--color-ink)] group-hover:underline underline-offset-2 break-words">
                      {novel.title}
                    </h2>
                    {novel.excerpt && (
                      <p className="mt-1.5 text-[12px] text-[color:var(--color-ink-muted)] leading-relaxed line-clamp-2">
                        {novel.excerpt}
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
