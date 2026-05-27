import Link from "next/link";
import type { Item } from "@/lib/types";
import { getAllItems } from "@/lib/db/items";
import { getAllMoods } from "@/lib/db/moods";
import { ImagePlaceholder } from "@/components/image-placeholder";
import { CategoryLabel } from "@/components/category-label";
import { MoodChip } from "@/components/mood-chip";
import { formatCardDate } from "@/lib/format";

function groupByMonth(items: Item[]): [string, Item[]][] {
  const sorted = [...items].sort((a, b) => (a.addedAt < b.addedAt ? 1 : -1));
  const groups = new Map<string, Item[]>();
  for (const item of sorted) {
    const date = new Date(item.addedAt);
    const key = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }
  return Array.from(groups.entries());
}

export default async function JournalPage() {
  const [items, moods] = await Promise.all([getAllItems(), getAllMoods()]);
  const moodBySlug = new Map(moods.map((m) => [m.slug, m]));
  const groups = groupByMonth(items);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <header className="px-6 pt-6 pb-4">
        <p className="text-[10px] tracking-[0.3em] text-[color:var(--color-ink-soft)] mb-2">
          THE JOURNAL
        </p>
        <h1 className="font-serif text-[36px] sm:text-[40px] leading-none text-[color:var(--color-ink)]">
          What was added, and when.
        </h1>
        <p className="mt-3 text-xs text-[color:var(--color-ink-muted)] max-w-xl">
          A ledger of arrivals. The dates aren&rsquo;t release dates — they&rsquo;re the moments these things became mine.
        </p>
      </header>

      <div className="px-6 pb-10">
        {groups.map(([month, monthItems]) => (
          <section key={month} className="mb-8 last:mb-0">
            <div className="flex items-baseline justify-between border-b border-[color:var(--color-line)]/40 pb-2 mb-4">
              <h2 className="text-[10px] tracking-[0.3em] text-[color:var(--color-ink-muted)] uppercase">
                {month}
              </h2>
              <span className="text-[9px] tracking-[0.25em] text-[color:var(--color-ink-soft)]">
                {monthItems.length} ENTR{monthItems.length === 1 ? "Y" : "IES"}
              </span>
            </div>

            <ul className="flex flex-col">
              {monthItems.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/items/${item.id}`}
                    className="group flex gap-4 py-4 border-b border-[color:var(--color-line)]/20 last:border-b-0 hover:bg-[color:var(--color-cream-soft)]/40 transition px-2 -mx-2"
                  >
                    <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 overflow-hidden">
                      <ImagePlaceholder category={item.category} id={item.id} imageUrl={item.imageUrl} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3 mb-1">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <CategoryLabel category={item.category} />
                          <span className="text-[9px] tracking-[0.2em] text-[color:var(--color-ink-soft)]">
                            {item.id}
                          </span>
                        </div>
                        <span className="text-[9px] tracking-[0.2em] text-[color:var(--color-ink-soft)] shrink-0">
                          {formatCardDate(item.addedAt)}
                        </span>
                      </div>
                      <h3 className="font-serif text-[18px] sm:text-[20px] leading-tight text-[color:var(--color-ink)] group-hover:underline underline-offset-2 truncate">
                        {item.title}
                      </h3>
                      <p className="text-[11px] text-[color:var(--color-ink-muted)] mt-0.5 truncate">
                        {item.creator}
                      </p>
                      {item.note && (
                        <p className="mt-2 text-[12px] text-[color:var(--color-ink-muted)] leading-relaxed line-clamp-2">
                          {item.note}
                        </p>
                      )}
                      <div className="hidden sm:flex items-center gap-1 mt-2">
                        {item.moods.slice(0, 3).map((slug) => {
                          const m = moodBySlug.get(slug);
                          return m ? <MoodChip key={slug} mood={m} size="sm" /> : null;
                        })}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
