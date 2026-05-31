import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getListBySlug, getItemsInList } from "@/lib/db/lists";
import { getAllMoods } from "@/lib/db/moods";
import { ImagePlaceholder } from "@/components/image-placeholder";
import { CategoryLabel } from "@/components/category-label";
import { MoodChip } from "@/components/mood-chip";
import { formatCardDate } from "@/lib/format";

export default async function ListPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const list = await getListBySlug(decodeURIComponent(slug));
  if (!list) notFound();

  const [items, moods] = await Promise.all([
    getItemsInList(list),
    getAllMoods(),
  ]);
  const moodBySlug = new Map(moods.map((m) => [m.slug, m]));
  const themeMood = list.themeMood ? moodBySlug.get(list.themeMood) : undefined;
  const categories = new Set(items.map((i) => i.category));

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="px-6 pt-4">
        <Link
          href="/lists"
          className="inline-flex items-center gap-2 text-[10px] tracking-[0.25em] text-[color:var(--color-ink-muted)] hover:text-[color:var(--color-ink)] transition"
        >
          <ArrowLeft size={12} strokeWidth={1.5} />
          BACK TO LISTS
        </Link>
      </div>

      <header className="px-6 pt-5 pb-6 border-b border-[color:var(--color-line)]/40">
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
        <h1 className="font-serif text-[36px] sm:text-[44px] leading-none tracking-tight text-[color:var(--color-ink)]">
          {list.title}
        </h1>
        <p className="mt-4 font-serif text-[18px] leading-relaxed text-[color:var(--color-ink-muted)] max-w-2xl">
          {list.description}
        </p>
        <p className="mt-5 text-[10px] tracking-[0.25em] text-[color:var(--color-ink-soft)]">
          {items.length} ITEMS · {categories.size} CATEGOR{categories.size === 1 ? "Y" : "IES"} · CREATED {formatCardDate(list.createdAt)}
        </p>
      </header>

      <ol className="px-6 py-6 flex flex-col">
        {items.map((item, i) => (
          <li
            key={item.id}
            className="group flex gap-3 sm:gap-4 py-4 border-b border-[color:var(--color-line)]/30 last:border-b-0"
          >
            <span className="text-[10px] tracking-wide text-[color:var(--color-ink-soft)] tabular-nums w-6 pt-1">
              {String(i + 1).padStart(2, "0")}
            </span>
            <Link href={`/items/${item.id}`} className="tap flex gap-4 flex-1 min-w-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 overflow-hidden">
                <ImagePlaceholder category={item.category} id={item.id} imageUrl={item.imageUrl} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <CategoryLabel category={item.category} />
                  <span className="text-[9px] tracking-[0.2em] text-[color:var(--color-ink-soft)]">
                    {item.id}
                  </span>
                </div>
                <h2 className="font-serif text-[18px] sm:text-[20px] leading-tight text-[color:var(--color-ink)] group-hover:underline underline-offset-2 truncate">
                  {item.title}
                </h2>
                <p className="text-[11px] text-[color:var(--color-ink-muted)] truncate">
                  {item.creator}
                </p>
                <div className="hidden sm:flex items-center gap-1 mt-1.5">
                  {item.moods.slice(0, 3).map((slug) => {
                    const m = moodBySlug.get(slug);
                    return m ? <MoodChip key={slug} mood={m} size="sm" /> : null;
                  })}
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
