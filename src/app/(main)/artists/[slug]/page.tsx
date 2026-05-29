import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAllItems } from "@/lib/db/items";
import { findArtistBySlug } from "@/lib/artist";
import { isAgeVerified } from "@/lib/age-verify";
import { isItemLocked } from "@/lib/item-lock";
import { ItemCardSmall } from "@/components/item-card-small";

export default async function ArtistPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [allItems, ageVerified] = await Promise.all([
    getAllItems(),
    isAgeVerified(),
  ]);
  const artist = findArtistBySlug(allItems, slug);
  if (!artist) notFound();

  // Sort by most recently added first.
  const sorted = [...artist.items].sort((a, b) =>
    (b.addedAt ?? "").localeCompare(a.addedAt ?? ""),
  );

  const sample = sorted[0];
  const countries = new Set(
    sorted
      .map((i) =>
        i.meta?.category === "music" ? i.meta.country : undefined,
      )
      .filter((c): c is string => Boolean(c)),
  );
  const genres = new Set(
    sorted
      .map((i) =>
        i.meta?.category === "music" ? i.meta.genre : undefined,
      )
      .filter((g): g is string => Boolean(g)),
  );

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="px-4 sm:px-6 md:px-8 pt-3 pb-1">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[10px] tracking-[0.25em] text-[color:var(--color-ink-muted)] hover:text-[color:var(--color-ink)] transition"
        >
          <ArrowLeft size={12} strokeWidth={1.5} />
          <span className="lg:hidden">BACK</span>
          <span className="hidden lg:inline">BACK TO COLLECTION</span>
        </Link>
      </div>

      <header className="px-6 pt-6 pb-4">
        <p className="text-[10px] tracking-[0.3em] text-[color:var(--color-ink-soft)] mb-2">
          ARTIST
        </p>
        <h1 className="font-serif text-[40px] sm:text-[48px] leading-none text-[color:var(--color-ink)] break-words">
          {artist.creator}
        </h1>
        {sample?.creatorKatakana && (
          <p className="mt-2 text-[12px] tracking-wide text-[color:var(--color-ink-soft)]">
            {sample.creatorKatakana}
          </p>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[color:var(--color-ink-muted)]">
          <span>
            <span className="font-serif text-[color:var(--color-ink)] text-[14px] mr-1.5">
              {sorted.length}
            </span>
            track{sorted.length === 1 ? "" : "s"} in the collection
          </span>
          {countries.size > 0 && (
            <span className="tracking-[0.15em]">
              {[...countries].join(" · ")}
            </span>
          )}
          {genres.size > 0 && (
            <span className="tracking-[0.15em]">
              {[...genres].slice(0, 4).join(" / ")}
            </span>
          )}
        </div>
      </header>

      <section className="px-6 pb-10">
        <p className="text-[10px] tracking-[0.3em] text-[color:var(--color-ink-soft)] mb-3">
          TRACKS
        </p>
        <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
          {sorted.map((item) => (
            <ItemCardSmall
              key={item.id}
              item={item}
              locked={isItemLocked(item, ageVerified)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
