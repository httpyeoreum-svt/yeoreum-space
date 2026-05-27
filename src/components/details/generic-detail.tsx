import type { Item } from "@/lib/types";
import { getAllMoods } from "@/lib/db/moods";
import { ImagePlaceholder } from "../image-placeholder";
import { MoodChip } from "../mood-chip";
import { ItemCardSmall } from "../item-card-small";
import { formatCardDate } from "@/lib/format";
import { isAgeVerified } from "@/lib/age-verify";

/** Fallback layout for items without a category-specific detail view yet. */
export async function GenericDetail({
  item,
  related,
}: {
  item: Item;
  related: Item[];
}) {
  const moods = await getAllMoods();
  const ageVerified = await isAgeVerified();
  const moodObjs = item.moods
    .map((slug) => moods.find((m) => m.slug === slug))
    .filter((m): m is NonNullable<typeof m> => Boolean(m));

  return (
    <article className="flex flex-col">
      <div className="px-4 sm:px-6 md:px-8">
        <div
          className={`${
            item.category === "perfume"
              ? "aspect-square max-w-[480px]"
              : "aspect-[3/4] max-w-[420px]"
          } w-full overflow-hidden border border-[color:var(--color-paper-edge)]`}
        >
          <ImagePlaceholder category={item.category} id={item.id} imageUrl={item.imageUrl} />
        </div>
      </div>

      <div className="px-4 sm:px-6 md:px-8 pt-5 pb-4">
        <h2 className="font-serif text-[28px] sm:text-[34px] leading-none tracking-tight text-[color:var(--color-ink)] break-words">
          {item.title}
        </h2>
        {item.titleSub && item.titleSubPublic && (
          <p className="font-serif text-[16px] sm:text-[20px] text-[color:var(--color-ink-muted)] mt-1 break-words">
            {item.titleSub}
          </p>
        )}
        <p className="mt-2 text-xs text-[color:var(--color-ink-muted)]">{item.creator}</p>
        <p className="mt-3 text-[10px] tracking-[0.25em] text-[color:var(--color-ink-soft)]">
          ADDED&nbsp;&nbsp;{formatCardDate(item.addedAt)}
        </p>
      </div>

      <div className="px-4 sm:px-6 md:px-8 pb-5">
        <p className="text-[9px] tracking-[0.3em] text-[color:var(--color-ink-soft)] mb-2">MOODS</p>
        <div className="flex flex-wrap gap-1.5">
          {moodObjs.map((m) => (
            <MoodChip key={m.slug} mood={m} size="sm" href={`/moods/${m.slug}`} />
          ))}
        </div>
      </div>

      {item.note && (
        <div className="px-4 sm:px-6 md:px-8 pb-6 pt-5 border-t border-dashed border-[color:var(--color-paper-edge)] mx-4 sm:mx-6 md:mx-8">
          <p className="text-[9px] tracking-[0.3em] text-[color:var(--color-ink-soft)] mb-2">NOTE</p>
          <p className="font-serif text-[18px] leading-snug text-[color:var(--color-ink)]">
            &ldquo;{item.note}&rdquo;
          </p>
        </div>
      )}

      {related.length > 0 && (
        <div className="px-4 sm:px-6 md:px-8 pt-5 pb-7 border-t border-[color:var(--color-line)]/40 bg-[color:var(--color-cream-soft)]/40">
          <p className="text-[10px] tracking-[0.3em] text-[color:var(--color-ink-muted)] mb-3">
            IN THE SAME MOOD
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {related.slice(0, 3).map((r) => (
              <ItemCardSmall
                key={r.id}
                item={r}
                locked={r.ageLimit && !ageVerified}
              />
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
