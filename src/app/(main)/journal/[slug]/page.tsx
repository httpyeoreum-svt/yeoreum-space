import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getPostBySlug } from "@/lib/db/posts";
import { getItemById } from "@/lib/db/items";
import { isOptimizableImage } from "@/lib/image";
import { ImagePlaceholder } from "@/components/image-placeholder";
import { CategoryLabel } from "@/components/category-label";
import { formatCardDate } from "@/lib/format";
import type { Item } from "@/lib/types";

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug);
  const post = await getPostBySlug(decoded);
  if (!post) notFound();

  // Resolve related items (skip missing ones gracefully).
  const relatedItems: Item[] = (
    await Promise.all(post.relatedItemIds.map((id) => getItemById(id)))
  ).filter((i): i is Item => Boolean(i));

  return (
    <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-none">
      <div className="px-4 sm:px-6 md:px-8 pt-3 pb-1 flex items-center gap-4">
        <Link
          href="/journal"
          className="inline-flex items-center gap-2 text-[10px] tracking-[0.25em] text-[color:var(--color-ink-muted)] hover:text-[color:var(--color-ink)] transition"
        >
          <ArrowLeft size={12} strokeWidth={1.5} />
          <span className="lg:hidden">BACK</span>
          <span className="hidden lg:inline">BACK TO JOURNAL</span>
        </Link>
      </div>

      <article className="px-4 sm:px-6 md:px-8 max-w-3xl mx-auto pb-12">
        <header className="pt-4 pb-6 border-b border-[color:var(--color-line)]/30">
          <div className="flex items-center gap-2 mb-3 text-[10px] tracking-[0.25em] text-[color:var(--color-ink-soft)]">
            {post.publishedAt && (
              <span>{formatCardDate(post.publishedAt)}</span>
            )}
            {post.tags.length > 0 && (
              <>
                <span>·</span>
                <span>{post.tags.join(" / ")}</span>
              </>
            )}
          </div>
          <h1 className="font-serif text-[32px] sm:text-[40px] md:text-[48px] leading-[1.1] tracking-tight text-[color:var(--color-ink)] break-words">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="mt-4 text-[14px] sm:text-[16px] text-[color:var(--color-ink-muted)] leading-relaxed">
              {post.excerpt}
            </p>
          )}
        </header>

        {post.coverImage && (
          <div className="my-6 overflow-hidden">
            {isOptimizableImage(post.coverImage) ? (
              // Unknown intrinsic size: nominal width/height sets a placeholder
              // aspect; `h-auto` lets it scale to the real ratio after load.
              <Image
                src={post.coverImage}
                alt=""
                width={1200}
                height={750}
                sizes="(max-width: 768px) 100vw, 720px"
                className="w-full h-auto"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.coverImage}
                alt=""
                className="w-full h-auto"
                loading="lazy"
              />
            )}
          </div>
        )}

        {/* Rich content from the WYSIWYG editor. Styling via prose helpers. */}
        <div
          className="post-content mt-6 text-[15px] leading-relaxed text-[color:var(--color-ink)]"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {relatedItems.length > 0 && (
          <section className="mt-10 pt-6 border-t border-[color:var(--color-line)]/30">
            <p className="text-[10px] tracking-[0.3em] text-[color:var(--color-ink-soft)] mb-3">
              MENTIONED IN THIS POST
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
      </article>
    </div>
  );
}
