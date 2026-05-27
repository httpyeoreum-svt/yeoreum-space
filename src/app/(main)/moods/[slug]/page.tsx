import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getMoodBySlug, getAllMoods } from "@/lib/db/moods";
import { getItemsByMood } from "@/lib/db/items";
import { ItemCardSmall } from "@/components/item-card-small";
import { MoodChip } from "@/components/mood-chip";
import { isAgeVerified } from "@/lib/age-verify";

export default async function MoodPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug);
  const [mood, moods] = await Promise.all([getMoodBySlug(decoded), getAllMoods()]);
  if (!mood) notFound();

  const items = await getItemsByMood(mood.slug);
  const ageVerified = await isAgeVerified();
  const categoryCount = new Set(items.map((i) => i.category)).size;
  const text = mood.tone === "dark" ? "text-white" : "text-[color:var(--color-ink)]";
  const sub = mood.tone === "dark" ? "text-white/65" : "text-[color:var(--color-ink)]/65";

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="px-6 pt-4">
        <Link
          href="/moods"
          className="inline-flex items-center gap-2 text-[10px] tracking-[0.25em] text-[color:var(--color-ink-muted)] hover:text-[color:var(--color-ink)] transition"
        >
          <ArrowLeft size={12} strokeWidth={1.5} />
          BACK TO MOODS
        </Link>
      </div>

      <header
        className="px-6 sm:px-10 py-10 sm:py-14 mt-3"
        style={{ backgroundColor: mood.bg }}
      >
        <p className={`text-[10px] tracking-[0.3em] mb-3 ${sub}`}>THE MOOD</p>
        <h1 className={`font-serif text-[56px] sm:text-[72px] leading-none italic ${text}`}>
          {mood.label}
        </h1>
        {mood.tagline && (
          <p className={`mt-4 font-serif text-[18px] sm:text-[22px] leading-snug max-w-xl ${text}`}>
            {mood.tagline}
          </p>
        )}
        <p className={`mt-5 text-[10px] tracking-[0.25em] ${sub}`}>
          {items.length} ITEMS · {categoryCount} CATEGOR{categoryCount === 1 ? "Y" : "IES"}
        </p>
      </header>

      <section className="px-6 py-8">
        {items.length === 0 ? (
          <p className="text-sm text-[color:var(--color-ink-muted)]">No items in this mood yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {items.map((item) => (
              <ItemCardSmall
                key={item.id}
                item={item}
                locked={item.ageLimit && !ageVerified}
              />
            ))}
          </div>
        )}
      </section>

      <section className="px-6 pb-10 border-t border-[color:var(--color-line)]/40 pt-6">
        <p className="text-[10px] tracking-[0.3em] text-[color:var(--color-ink-muted)] mb-3">
          OTHER MOODS
        </p>
        <div className="flex flex-wrap gap-1.5">
          {moods
            .filter((m) => m.slug !== mood.slug)
            .map((m) => (
              <MoodChip key={m.slug} mood={m} size="sm" href={`/moods/${m.slug}`} />
            ))}
        </div>
      </section>
    </div>
  );
}
