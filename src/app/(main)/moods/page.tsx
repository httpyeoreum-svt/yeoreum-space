import Link from "next/link";
import { getAllMoods } from "@/lib/db/moods";
import { getAllItems } from "@/lib/db/items";
import { ImagePlaceholder } from "@/components/image-placeholder";

export default async function MoodsPage() {
  const [moods, items] = await Promise.all([getAllMoods(), getAllItems()]);
  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <header className="px-6 pt-6 pb-4">
        <p className="text-[10px] tracking-[0.3em] text-[color:var(--color-ink-soft)] mb-2">
          MOODS
        </p>
        <h1 className="font-serif text-[36px] sm:text-[40px] leading-none text-[color:var(--color-ink)]">
          Rooms you can walk into.
        </h1>
        <p className="mt-3 text-xs text-[color:var(--color-ink-muted)] max-w-xl">
          Each mood is a doorway across categories. Step into one and see what waits.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 px-6 pb-8">
        {moods.map((mood) => {
          const inMood = items.filter((i) => i.moods.includes(mood.slug));
          const samples = inMood.slice(0, 3);
          const text = mood.tone === "dark" ? "text-white" : "text-[color:var(--color-ink)]";
          const sub = mood.tone === "dark" ? "text-white/60" : "text-[color:var(--color-ink)]/55";
          const subStrong = mood.tone === "dark" ? "text-white/80" : "text-[color:var(--color-ink)]/70";
          return (
            <Link
              key={mood.slug}
              href={`/moods/${mood.slug}`}
              className="group block p-5 transition hover:brightness-95 min-h-[240px] flex flex-col"
              style={{ backgroundColor: mood.bg }}
            >
              <div className="flex-1">
                <h2 className={`font-serif text-[32px] leading-none ${text}`}>{mood.label}</h2>
                {mood.tagline && (
                  <p className={`text-[11px] leading-relaxed mt-2 ${subStrong}`}>{mood.tagline}</p>
                )}
              </div>
              <div className="mt-4">
                <p className={`text-[9px] tracking-[0.3em] ${sub} mb-2`}>
                  {inMood.length} ITEMS · {new Set(inMood.map((i) => i.category)).size} CATEGORIES
                </p>
                <div className="grid grid-cols-3 gap-1">
                  {samples.map((item) => (
                    <div key={item.id} className="aspect-square overflow-hidden border border-white/10">
                      <ImagePlaceholder category={item.category} id={item.id} imageUrl={item.imageUrl} />
                    </div>
                  ))}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
