import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Novel } from "@/lib/types";
import { OptimizedImage } from "./optimized-image";

/**
 * "Recently added" horizontal carousel — novels only. Mirrors the layout of the
 * catalog version but links into /novels.
 */
export function RecentNovels({ novels }: { novels: Novel[] }) {
  return (
    <section className="px-6 pt-4 pb-3 shrink-0">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-[11px] tracking-[0.3em] text-[color:var(--color-ink)]">
          RECENTLY ADDED
        </h2>
        <Link
          href="/novels"
          className="flex items-center gap-2 text-[10px] tracking-[0.25em] text-[color:var(--color-ink-muted)] hover:text-[color:var(--color-ink)] transition"
        >
          VIEW ALL
          <ArrowRight size={11} strokeWidth={1.5} />
        </Link>
      </div>
      {novels.length === 0 ? (
        <p className="text-[11px] text-[color:var(--color-ink-soft)]">
          No novels yet.
        </p>
      ) : (
        <div className="scroll-x flex gap-2.5 pb-1 items-start">
          {novels.map((novel, i) => (
            <div
              key={novel.slug}
              className={`flex-none w-[110px] ${i >= 6 ? "hidden lg:block" : "block"}`}
            >
              <NovelCard novel={novel} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function NovelCard({ novel }: { novel: Novel }) {
  return (
    <Link href={`/novels/${novel.slug}`} className="tap w-[110px] group">
      <div className="aspect-square w-full overflow-hidden border border-transparent group-hover:border-[color:var(--color-line)] transition relative bg-[color:var(--color-cream-deep)]">
        {novel.coverImage ? (
          <OptimizedImage src={novel.coverImage} sizes="110px" />
        ) : (
          <div className="w-full h-full flex items-center justify-center px-2">
            <span className="font-serif italic text-[12px] leading-tight text-center text-[color:var(--color-ink-muted)] line-clamp-4">
              {novel.title}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
