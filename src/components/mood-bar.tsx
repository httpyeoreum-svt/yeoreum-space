import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getAllMoods } from "@/lib/db/moods";
import { getAllItems } from "@/lib/db/items";
import { MoodChip } from "./mood-chip";

export async function MoodBar() {
  const [moods, items] = await Promise.all([getAllMoods(), getAllItems()]);
  // Order chips by how many items carry each mood (most first).
  const countBySlug = new Map<string, number>();
  for (const item of items) {
    for (const slug of item.moods) {
      countBySlug.set(slug, (countBySlug.get(slug) ?? 0) + 1);
    }
  }
  const ordered = [...moods].sort(
    (a, b) => (countBySlug.get(b.slug) ?? 0) - (countBySlug.get(a.slug) ?? 0),
  );
  return (
    <section className="px-4 py-3 border-y border-[color:var(--color-line)]/40 bg-[color:var(--color-cream-soft)]/30 shrink-0">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 scroll-x">
          <span className="text-[9px] tracking-[0.3em] text-[color:var(--color-ink-muted)] shrink-0">
            BY MOOD
          </span>
          <div className="flex items-center gap-1.5">
            {ordered.map((m) => (
              <MoodChip key={m.slug} mood={m} size="sm" href={`/moods/${m.slug}`} />
            ))}
          </div>
        </div>
        <Link
          href="/moods"
          className="hidden md:flex items-center gap-2 text-[10px] tracking-[0.25em] text-[color:var(--color-ink-muted)] hover:text-[color:var(--color-ink)] transition shrink-0"
        >
          ALL MOODS
          <ArrowRight size={11} strokeWidth={1.5} />
        </Link>
      </div>
    </section>
  );
}
