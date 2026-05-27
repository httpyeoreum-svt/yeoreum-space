import { OWNER } from "@/lib/data";
import { getAllMoods } from "@/lib/db/moods";
import { getAllItems } from "@/lib/db/items";
import { getAllLists } from "@/lib/db/lists";
import { formatSlashDate } from "@/lib/format";

export default async function AboutPage() {
  const [moods, items, lists] = await Promise.all([
    getAllMoods(),
    getAllItems(),
    getAllLists(),
  ]);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 sm:px-8 py-10">
        <header className="mb-10">
          <p className="text-[10px] tracking-[0.3em] text-[color:var(--color-ink-soft)] mb-3">
            ABOUT
          </p>
          <h1 className="font-serif text-[44px] sm:text-[56px] leading-none italic text-[color:var(--color-ink)]">
            yeoreum space
          </h1>
          <p className="mt-3 text-sm text-[color:var(--color-ink-muted)]">
            여름 / a personal archive of what stays.
          </p>
        </header>

        <section className="mb-10 font-serif text-[18px] sm:text-[20px] leading-relaxed text-[color:var(--color-ink)] space-y-4">
          <p>This is not a list of what&rsquo;s best. It is a list of what stayed.</p>
          <p>
            Music, books, films, perfume, games — each is filed under whatever weather it brings.
            Not by year, not by ranking, but by the mood it lets you walk into.
          </p>
          <p>
            <em>Yeoreum</em> (여름) is the Korean word for summer. The slow kind, with long afternoons.
          </p>
        </section>

        <section className="mb-10 border-t border-[color:var(--color-line)]/40 pt-7">
          <h2 className="text-[10px] tracking-[0.3em] text-[color:var(--color-ink-muted)] mb-4">
            HOW TO READ
          </h2>
          <ul className="space-y-2.5 text-xs text-[color:var(--color-ink-muted)] leading-relaxed">
            <li>
              <span className="text-[color:var(--color-ink)] font-medium">Home</span> — recently added entries, mood entry points, and the latest catalog page.
            </li>
            <li>
              <span className="text-[color:var(--color-ink)] font-medium">Collection</span> — every entry, browsable by category.
            </li>
            <li>
              <span className="text-[color:var(--color-ink)] font-medium">Moods</span> — items grouped by feeling, regardless of category. The dive points.
            </li>
            <li>
              <span className="text-[color:var(--color-ink)] font-medium">Journal</span> — chronological. What arrived, when. With notes from the moment of keeping.
            </li>
            <li>
              <span className="text-[color:var(--color-ink)] font-medium">Lists</span> — curated cross-media constellations: a mood made into a sequence.
            </li>
          </ul>
        </section>

        <section className="mb-10 border-t border-[color:var(--color-line)]/40 pt-7">
          <h2 className="text-[10px] tracking-[0.3em] text-[color:var(--color-ink-muted)] mb-4">
            AT A GLANCE
          </h2>
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Stat label="Items" value={items.length} />
            <Stat label="Moods" value={moods.length} />
            <Stat label="Lists" value={lists.length} />
            <Stat label="Categories" value={5} />
          </dl>
        </section>

        <section className="mb-10 border-t border-[color:var(--color-line)]/40 pt-7">
          <h2 className="text-[10px] tracking-[0.3em] text-[color:var(--color-ink-muted)] mb-4">
            OWNER
          </h2>
          <dl className="grid grid-cols-[7rem_1fr] sm:grid-cols-[8rem_1fr] gap-y-2.5 text-xs">
            <dt className="text-[color:var(--color-ink-soft)] tracking-wide">Handle</dt>
            <dd className="text-[color:var(--color-ink)]">{OWNER.handle}</dd>
            <dt className="text-[color:var(--color-ink-soft)] tracking-wide">Catalog ID</dt>
            <dd className="text-[color:var(--color-ink)]">{OWNER.catalogId}</dd>
            <dt className="text-[color:var(--color-ink-soft)] tracking-wide">Member since</dt>
            <dd className="text-[color:var(--color-ink)]">{formatSlashDate(OWNER.memberSince)}</dd>
            <dt className="text-[color:var(--color-ink-soft)] tracking-wide">Member no.</dt>
            <dd className="text-[color:var(--color-cat-music)] font-medium">#{OWNER.memberNo}</dd>
          </dl>
        </section>

        <section className="border-t border-[color:var(--color-line)]/40 pt-7">
          <h2 className="text-[10px] tracking-[0.3em] text-[color:var(--color-ink-muted)] mb-4">
            BUILT WITH
          </h2>
          <p className="text-xs text-[color:var(--color-ink-muted)] leading-relaxed">
            Next.js · Tailwind CSS · Cormorant Garamond · JetBrains Mono · Lucide · Supabase
          </p>
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="font-serif text-[32px] leading-none text-[color:var(--color-ink)] tabular-nums">
        {String(value).padStart(2, "0")}
      </p>
      <p className="text-[9px] tracking-[0.25em] text-[color:var(--color-ink-soft)] mt-1 uppercase">
        {label}
      </p>
    </div>
  );
}
