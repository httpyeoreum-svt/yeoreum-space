import { CategoryGrid } from "@/components/category-grid";
import { getAllItems } from "@/lib/db/items";
import { getCategoryCounts } from "@/lib/db/category-counts";
import { isAgeVerified } from "@/lib/age-verify";
import { CATEGORY_META, type Category } from "@/lib/types";

export default async function CollectionPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const { cat } = await searchParams;
  const initialTab =
    cat && cat in CATEGORY_META ? (cat as Category) : "all";
  const [items, counts, ageVerified] = await Promise.all([
    getAllItems(),
    getCategoryCounts(),
    isAgeVerified(),
  ]);
  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <header className="px-6 pt-6 pb-3">
        <p className="text-[10px] tracking-[0.3em] text-[color:var(--color-ink-soft)] mb-2">
          THE COLLECTION
        </p>
        <h1 className="font-serif text-[36px] sm:text-[40px] leading-none text-[color:var(--color-ink)]">
          Everything kept.
        </h1>
        <p className="mt-3 text-xs text-[color:var(--color-ink-muted)] max-w-xs sm:max-w-md lg:max-w-none leading-relaxed">
          {items.length} entries across music, books, films, perfume, and games. Filter, sort, or scan.
        </p>
      </header>
      <CategoryGrid
        items={items}
        counts={counts}
        ageVerified={ageVerified}
        initialTab={initialTab}
      />
    </div>
  );
}
