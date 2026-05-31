import Link from "next/link";
import { getAllLists, getItemsInList } from "@/lib/db/lists";
import { getAllMoods } from "@/lib/db/moods";
import { ImagePlaceholder } from "@/components/image-placeholder";
import { formatCardDate } from "@/lib/format";

export default async function ListsPage() {
  const [lists, moods] = await Promise.all([getAllLists(), getAllMoods()]);
  const moodBySlug = new Map(moods.map((m) => [m.slug, m]));

  const cards = await Promise.all(
    lists.map(async (list) => ({
      list,
      items: await getItemsInList(list),
      themeMood: list.themeMood ? moodBySlug.get(list.themeMood) : undefined,
    })),
  );

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <header className="px-6 pt-6 pb-4">
        <p className="text-[10px] tracking-[0.3em] text-[color:var(--color-ink-soft)] mb-2">
          LISTS
        </p>
        <h1 className="font-serif text-[36px] sm:text-[40px] leading-none text-[color:var(--color-ink)]">
          Cross-media constellations.
        </h1>
        <p className="mt-3 text-xs text-[color:var(--color-ink-muted)] max-w-xl">
          Items grouped not by what they are, but by when they belong. Made for a season, a mood, a particular kind of hour.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-6 pb-10">
        {cards.map(({ list, items, themeMood }) => (
          <Link
            key={list.slug}
            href={`/lists/${list.slug}`}
            className="tap group block bg-[color:var(--color-paper)] border border-[color:var(--color-paper-edge)]/60 p-5 transition hover:shadow-sm hover:border-[color:var(--color-line)]"
          >
            {themeMood && (
              <div className="flex items-center gap-1.5 mb-3">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: themeMood.bg }}
                />
                <span className="text-[9px] tracking-[0.3em] text-[color:var(--color-ink-soft)] uppercase">
                  {themeMood.label}
                </span>
              </div>
            )}
            <h2 className="font-serif text-[24px] sm:text-[26px] leading-tight tracking-tight text-[color:var(--color-ink)] group-hover:underline underline-offset-2">
              {list.title}
            </h2>
            <p className="mt-2 text-xs text-[color:var(--color-ink-muted)] leading-relaxed line-clamp-2 min-h-[2.5rem]">
              {list.description}
            </p>
            <div className="mt-4 grid grid-cols-5 gap-1">
              {items.slice(0, 5).map((item) => (
                <div key={item.id} className="aspect-square overflow-hidden">
                  <ImagePlaceholder category={item.category} id={item.id} imageUrl={item.imageUrl} />
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between text-[9px] tracking-[0.25em] text-[color:var(--color-ink-soft)]">
              <span>{items.length} ITEMS</span>
              <span>{formatCardDate(list.createdAt)}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
