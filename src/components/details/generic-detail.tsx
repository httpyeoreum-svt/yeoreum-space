import type { Item, LikedByPerson, Member, PerfumeMeta } from "@/lib/types";
import { getAllMoods } from "@/lib/db/moods";
import { getMemberMap } from "@/lib/db/members";
import { ImagePlaceholder } from "../image-placeholder";
import { MoodChip } from "../mood-chip";
import { ItemCardSmall } from "../item-card-small";
import { formatCardDate } from "@/lib/format";
import { isAgeVerified } from "@/lib/age-verify";
import { isItemLocked } from "@/lib/item-lock";

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
  // Liked by is shared across perfume / books / films (music has its own layout).
  const likedBy =
    item.meta && "likedBy" in item.meta ? item.meta.likedBy : undefined;
  const likedByGroup =
    item.meta && "likedByGroup" in item.meta ? item.meta.likedByGroup : undefined;
  const hasLikedBy = Boolean(likedBy && likedBy.length > 0);
  const memberMap = hasLikedBy ? await getMemberMap() : null;
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

      {item.meta?.category === "perfume" && (
        <PerfumeMetaBlock meta={item.meta} />
      )}

      {item.note && (
        <div className="px-4 sm:px-6 md:px-8 pb-6 pt-5 border-t border-dashed border-[color:var(--color-paper-edge)] mx-4 sm:mx-6 md:mx-8">
          <p className="text-[9px] tracking-[0.3em] text-[color:var(--color-ink-soft)] mb-2">
            {item.category === "perfume" ? "紹介" : "NOTE"}
          </p>
          <p className="font-serif text-[18px] leading-snug text-[color:var(--color-ink)]">
            {item.category === "perfume" ? item.note : <>&ldquo;{item.note}&rdquo;</>}
          </p>
        </div>
      )}

      {item.meta?.category === "perfume" && item.meta.purchaseUrl && (
        <div className="px-4 sm:px-6 md:px-8 pb-7 pt-3">
          <a
            href={item.meta.purchaseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-[color:var(--color-ink)]/70 px-4 py-2 text-[11px] tracking-[0.2em] text-[color:var(--color-ink)] hover:bg-[color:var(--color-ink)] hover:text-[color:var(--color-paper)] transition"
          >
            販売先へ
            <span aria-hidden>↗</span>
          </a>
        </div>
      )}

      {hasLikedBy && memberMap && (
        <div className="px-4 sm:px-6 md:px-8 pb-7 pt-5 border-t border-dashed border-[color:var(--color-paper-edge)] mx-4 sm:mx-6 md:mx-8">
          <div className="flex items-baseline gap-3 flex-wrap mb-3">
            <p className="text-[9px] tracking-[0.3em] text-[color:var(--color-ink-soft)]">
              LIKED BY
            </p>
            {likedByGroup && (
              <p className="text-[10px] tracking-[0.3em] text-[color:var(--color-ink-muted)]">
                {likedByGroup}
              </p>
            )}
          </div>
          <LikedByGrid people={likedBy!} memberMap={memberMap} />
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
                locked={isItemLocked(r, ageVerified)}
              />
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

function PerfumeMetaBlock({ meta }: { meta: PerfumeMeta }) {
  const stages: { label: string; notes: string[] }[] = (
    [
      { label: "TOP", notes: meta.notesTop },
      { label: "MIDDLE", notes: meta.notesMiddle },
      { label: "LAST", notes: meta.notesLast },
    ] as const
  ).flatMap((s) =>
    s.notes && s.notes.length > 0
      ? [{ label: s.label, notes: s.notes }]
      : [],
  );

  const hasMoods = meta.moods && meta.moods.length > 0;
  const hasNotes = stages.length > 0;
  const hasConcentration = Boolean(meta.concentration);
  // Legacy flat notes (no Top/Middle/Last categorization) — render once below.
  const legacyNotes =
    !hasNotes && meta.notes && meta.notes.length > 0 ? meta.notes : null;

  if (!hasMoods && !hasNotes && !legacyNotes && !hasConcentration) return null;

  return (
    <div className="px-4 sm:px-6 md:px-8 pb-6 pt-5 border-t border-dashed border-[color:var(--color-paper-edge)] mx-4 sm:mx-6 md:mx-8 flex flex-col gap-5">
      {hasConcentration && (
        <div>
          <p className="text-[9px] tracking-[0.3em] text-[color:var(--color-ink-soft)] mb-2">
            賦香率
          </p>
          <p className="font-serif text-[15px] text-[color:var(--color-ink)]">
            {meta.concentration}
          </p>
        </div>
      )}
      {hasMoods && (
        <div>
          <p className="text-[9px] tracking-[0.3em] text-[color:var(--color-ink-soft)] mb-2">
            CHARACTER
          </p>
          <div className="flex flex-wrap gap-1.5">
            {meta.moods!.map((m) => (
              <span
                key={m}
                className="inline-flex items-center rounded-full border border-[color:var(--color-line)]/60 bg-[color:var(--color-paper)] px-2.5 py-0.5 text-[11px] text-[color:var(--color-ink-muted)]"
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      )}

      {hasNotes && (
        <div>
          <p className="text-[9px] tracking-[0.3em] text-[color:var(--color-ink-soft)] mb-2">
            OLFACTION
          </p>
          <ul className="flex flex-col">
            {stages.map((s, i) => (
              <li
                key={s.label}
                className={`grid grid-cols-[3.5rem_1fr] sm:grid-cols-[4.5rem_1fr] items-baseline gap-3 py-2 ${
                  i < stages.length - 1
                    ? "border-b border-[color:var(--color-line)]/30"
                    : ""
                }`}
              >
                <span className="text-[10px] tracking-[0.3em] text-[color:var(--color-ink-soft)]">
                  {s.label}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {s.notes.map((n) => (
                    <span
                      key={n}
                      className="inline-flex items-center rounded-full border border-[color:var(--color-line)]/60 bg-[color:var(--color-paper)] px-2.5 py-0.5 text-[11px] text-[color:var(--color-ink-muted)]"
                    >
                      {n}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {legacyNotes && (
        <div>
          <p className="text-[9px] tracking-[0.3em] text-[color:var(--color-ink-soft)] mb-2">
            NOTES
          </p>
          <div className="flex flex-wrap gap-1.5">
            {legacyNotes.map((n) => (
              <span
                key={n}
                className="inline-flex items-center rounded-full border border-[color:var(--color-line)]/60 bg-[color:var(--color-paper)] px-2.5 py-0.5 text-[11px] text-[color:var(--color-ink-muted)]"
              >
                {n}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LikedByGrid({
  people,
  memberMap,
}: {
  people: LikedByPerson[];
  memberMap: Map<string, Member>;
}) {
  return (
    <div className="flex flex-wrap items-start gap-x-4 gap-y-3">
      {people.map((p) => {
        const avatarUrl = p.avatarUrl ?? memberMap.get(p.name)?.avatarUrl;
        const initials = p.name.slice(0, 2).toUpperCase();
        return (
          <div key={p.name} className="flex flex-col items-center gap-1.5 w-16">
            <div className="w-14 h-14 rounded-full bg-[color:var(--color-cream-deep)] border border-[color:var(--color-line)] flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <span className="font-serif text-[13px] tracking-wide text-[color:var(--color-ink-muted)]">
                  {initials}
                </span>
              )}
            </div>
            <p className="text-[11px] tracking-wide text-[color:var(--color-ink)] text-center">
              {p.name}
            </p>
          </div>
        );
      })}
    </div>
  );
}
