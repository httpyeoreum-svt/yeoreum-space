import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getNovelBySlug } from "@/lib/db/novels";
import { getMemberMap } from "@/lib/db/members";
import { getItemById } from "@/lib/db/items";
import { formatCardDate } from "@/lib/format";
import { OptimizedImage } from "@/components/optimized-image";
import { AvatarCircle } from "@/components/avatar-circle";
import { ImagePlaceholder } from "@/components/image-placeholder";
import { CategoryLabel } from "@/components/category-label";
import type { Item } from "@/lib/types";

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
  const relatedItems: Item[] = (
    await Promise.all(novel.relatedItemIds.map((id) => getItemById(id)))
  ).filter((i): i is Item => Boolean(i));

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
        {novel.headerImage ? (
          <>
            <div className="relative mt-2 w-full aspect-[16/9] overflow-hidden">
              <OptimizedImage
                src={novel.headerImage}
                sizes="(max-width: 768px) 100vw, 768px"
              />
              {/* Scrim so the overlaid date / title stay legible. */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
              {novel.tags.length > 0 && (
                <div className="absolute top-0 right-0 z-10 flex max-w-[70%] flex-wrap justify-end gap-x-2.5 gap-y-1 p-3 sm:p-4">
                  {novel.tags.map((t) => (
                    <Link
                      key={t}
                      href={`/novels?tag=${encodeURIComponent(t)}`}
                      className="text-[10px] tracking-[0.15em] text-white/90 drop-shadow-[0_1px_6px_rgba(0,0,0,0.65)] transition hover:text-white hover:underline underline-offset-2"
                    >
                      #{t}
                    </Link>
                  ))}
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
                {novel.publishedAt && (
                  <p className="mb-2 text-[10px] tracking-[0.25em] text-white/85">
                    {formatCardDate(novel.publishedAt)}
                  </p>
                )}
                <h1 className="font-serif text-[26px] sm:text-[36px] md:text-[44px] leading-[1.1] tracking-tight text-white break-words drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)]">
                  {novel.title}
                </h1>
              </div>
            </div>
            {novel.excerpt && (
              <header className="pt-4 pb-6 border-b border-[color:var(--color-line)]/30">
                <p className="text-[14px] sm:text-[16px] text-[color:var(--color-ink-muted)] leading-relaxed">
                  {novel.excerpt}
                </p>
              </header>
            )}
          </>
        ) : (
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
        )}

        {/* Rich content from the WYSIWYG editor. Styling via prose helpers. */}
        <div
          className="post-content font-jp-serif mt-6 text-[13px] leading-relaxed text-[color:var(--color-ink)]"
          dangerouslySetInnerHTML={{ __html: novel.content }}
        />

        {(memberMap || relatedItems.length > 0) && (
        <div className="mt-10 pt-6 border-t border-[color:var(--color-line)]/30 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-8">
        {memberMap && (
          <section>
            <p className="text-[10px] tracking-[0.3em] text-[color:var(--color-ink-soft)] mb-3">
              MEMBERS
            </p>
            <div className="flex flex-wrap items-start gap-x-4 gap-y-3">
              {novel.members.map((name) => {
                const avatarUrl = memberMap.get(name)?.avatarUrl;
                return (
                  <div key={name} className="flex flex-col items-center gap-1.5 w-16">
                    <AvatarCircle name={name} avatarUrl={avatarUrl} size="md" />
                    <p className="text-[11px] tracking-wide text-[color:var(--color-ink)] text-center">
                      {name}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {relatedItems.length > 0 && (
          <section>
            <p className="text-[10px] tracking-[0.3em] text-[color:var(--color-ink-soft)] mb-3">
              RELATED
            </p>
            <ul className="flex flex-col divide-y divide-[color:var(--color-line)]/30">
              {relatedItems.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/items/${item.id}`}
                    className="group flex items-center gap-3 py-2.5 transition hover:bg-[color:var(--color-cream-soft)]/40 px-1"
                  >
                    <div className="w-12 h-12 shrink-0 overflow-hidden">
                      <ImagePlaceholder
                        category={item.category}
                        id={item.id}
                        imageUrl={item.imageUrl}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <CategoryLabel
                          category={item.category}
                          className="!text-[8px] !tracking-[0.15em]"
                        />
                        <span className="text-[9px] tracking-[0.2em] text-[color:var(--color-ink-soft)]">
                          {item.id}
                        </span>
                      </div>
                      <p className="font-serif text-[14px] leading-tight text-[color:var(--color-ink)] truncate group-hover:underline underline-offset-2 mt-0.5">
                        {item.title}
                      </p>
                      <p className="font-serif text-[10px] text-[color:var(--color-ink-muted)] truncate">
                        {item.creator}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
        </div>
        )}
      </article>
    </div>
  );
}
