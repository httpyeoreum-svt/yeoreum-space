import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getNovelBySlug } from "@/lib/db/novels";
import { getMemberMap } from "@/lib/db/members";
import { formatCardDate } from "@/lib/format";
import { OptimizedImage } from "@/components/optimized-image";

export default async function NovelPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug);
  const novel = await getNovelBySlug(decoded);
  if (!novel) notFound();

  const memberMap = novel.members.length > 0 ? await getMemberMap() : null;

  return (
    <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-none">
      <div className="px-4 sm:px-6 md:px-8 pt-3 pb-1 flex items-center gap-4">
        <Link
          href="/novels"
          className="inline-flex items-center gap-2 text-[10px] tracking-[0.25em] text-[color:var(--color-ink-muted)] hover:text-[color:var(--color-ink)] transition"
        >
          <ArrowLeft size={12} strokeWidth={1.5} />
          <span className="lg:hidden">BACK</span>
          <span className="hidden lg:inline">BACK TO NOVELS</span>
        </Link>
      </div>

      <article className="px-4 sm:px-6 md:px-8 max-w-3xl mx-auto pb-12">
        <header className="pt-4 pb-6 border-b border-[color:var(--color-line)]/30">
          <div className="flex items-center gap-2 mb-3 text-[10px] tracking-[0.25em] text-[color:var(--color-ink-soft)]">
            {novel.publishedAt && (
              <span>{formatCardDate(novel.publishedAt)}</span>
            )}
            {novel.tags.length > 0 && (
              <>
                <span>·</span>
                <span>{novel.tags.join(" / ")}</span>
              </>
            )}
          </div>
          <h1 className="font-serif text-[32px] sm:text-[40px] md:text-[48px] leading-[1.1] tracking-tight text-[color:var(--color-ink)] break-words">
            {novel.title}
          </h1>
          {novel.excerpt && (
            <p className="mt-4 text-[14px] sm:text-[16px] text-[color:var(--color-ink-muted)] leading-relaxed">
              {novel.excerpt}
            </p>
          )}
        </header>

        {/* Rich content from the WYSIWYG editor. Styling via prose helpers. */}
        <div
          className="post-content mt-6 text-[13px] leading-relaxed text-[color:var(--color-ink)]"
          dangerouslySetInnerHTML={{ __html: novel.content }}
        />

        {memberMap && (
          <section className="mt-10 pt-6 border-t border-[color:var(--color-line)]/30">
            <p className="text-[10px] tracking-[0.3em] text-[color:var(--color-ink-soft)] mb-3">
              MEMBERS
            </p>
            <div className="flex flex-wrap items-start gap-x-4 gap-y-3">
              {novel.members.map((name) => {
                const avatarUrl = memberMap.get(name)?.avatarUrl;
                const initials = name.slice(0, 2).toUpperCase();
                return (
                  <div key={name} className="flex flex-col items-center gap-1.5 w-16">
                    <div className="relative w-14 h-14 rounded-full bg-[color:var(--color-cream-deep)] border border-[color:var(--color-line)] flex items-center justify-center overflow-hidden">
                      {avatarUrl ? (
                        <OptimizedImage src={avatarUrl} sizes="56px" />
                      ) : (
                        <span className="font-serif text-[13px] tracking-wide text-[color:var(--color-ink-muted)]">
                          {initials}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] tracking-wide text-[color:var(--color-ink)] text-center">
                      {name}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </article>
    </div>
  );
}
