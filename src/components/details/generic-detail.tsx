import type {
  FilmsMeta,
  GamesMeta,
  Item,
  LikedByPerson,
  Member,
  PerfumeMeta,
} from "@/lib/types";
import { getAllMoods } from "@/lib/db/moods";
import { getMemberMap } from "@/lib/db/members";
import { getItemsByIds, getCuratedSimilars } from "@/lib/db/items";
import { ImagePlaceholder } from "../image-placeholder";
import { OptimizedImage } from "../optimized-image";
import { MoodChip } from "../mood-chip";
import { ItemCardSmall } from "../item-card-small";
import { DetailTabs } from "./detail-tabs";
import { youtubeVideoId } from "@/lib/youtube";
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

  const releaseDate =
    item.meta && "releaseDate" in item.meta && item.meta.releaseDate
      ? item.meta.releaseDate
      : undefined;
  const genre =
    item.meta && "genre" in item.meta && item.meta.genre
      ? item.meta.genre
      : undefined;
  const filmMeta = item.meta?.category === "films" ? item.meta : null;
  const gameMeta = item.meta?.category === "games" ? item.meta : null;
  const relatedSongs = filmMeta?.relatedSongIds?.length
    ? await getItemsByIds(filmMeta.relatedSongIds)
    : [];
  // Related games are bidirectional links in item_similars (curated similars).
  const relatedGames = gameMeta ? await getCuratedSimilars(item.id) : [];

  return (
    <article className="flex flex-col">
      <div className="px-4 sm:px-6 md:px-8">
        {item.category === "games" && item.imageUrl ? (
          // Games: show the image at its original aspect ratio (no crop).
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt=""
            className="w-full max-w-[480px] h-auto border border-[color:var(--color-paper-edge)]"
          />
        ) : (
          <div
            className={`${
              item.category === "perfume"
                ? "aspect-square max-w-[480px]"
                : item.category === "games"
                  ? "aspect-video max-w-[480px]"
                  : "aspect-[3/4] max-w-[420px]"
            } w-full overflow-hidden border border-[color:var(--color-paper-edge)]`}
          >
            <ImagePlaceholder
              category={item.category}
              id={item.id}
              imageUrl={item.imageUrl}
              sizes="(max-width: 640px) 100vw, 480px"
            />
          </div>
        )}
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
        {releaseDate && (
          <p className="mt-3 text-[10px] tracking-[0.25em] text-[color:var(--color-ink-soft)]">
            RELEASE&nbsp;&nbsp;{formatRelease(releaseDate)}
          </p>
        )}
        {genre && (
          <p className="mt-1.5 text-[10px] tracking-[0.25em] text-[color:var(--color-ink-soft)]">
            GENRE&nbsp;&nbsp;<span className="tracking-[0.05em]">{genre}</span>
          </p>
        )}
      </div>

      {item.meta?.category === "perfume" && (
        <PerfumeMetaBlock meta={item.meta} />
      )}

      {filmMeta && <FilmInfoBlock meta={filmMeta} />}

      <DetailTabs
        tabs={[
          {
            key: "story",
            label:
              item.category === "films"
                ? "STORY"
                : item.category === "perfume"
                  ? "紹介"
                  : "ABOUT",
            content: item.note ? (
              <p className="font-serif text-[11px] leading-relaxed text-[color:var(--color-ink)]">
                {item.category === "perfume" ? (
                  item.note
                ) : (
                  <>&ldquo;{item.note}&rdquo;</>
                )}
              </p>
            ) : null,
          },
          {
            key: "liked",
            label: item.category === "games" ? "RELATED" : "LIKED BY",
            content:
              hasLikedBy && memberMap ? (
                <div>
                  {likedByGroup && (
                    <p className="text-[10px] tracking-[0.3em] text-[color:var(--color-ink-muted)] mb-3">
                      {likedByGroup}
                    </p>
                  )}
                  <LikedByGrid people={likedBy!} memberMap={memberMap} />
                </div>
              ) : null,
          },
          {
            key: "moods",
            label: "MOODS",
            content:
              moodObjs.length > 0 ? (
                <div className="flex flex-nowrap gap-1.5 overflow-x-auto scroll-x">
                  {moodObjs.map((m) => (
                    <div key={m.slug} className="shrink-0">
                      <MoodChip mood={m} size="sm" href={`/moods/${m.slug}`} />
                    </div>
                  ))}
                </div>
              ) : null,
          },
        ]}
      />

      {filmMeta && (
        <FilmMediaBlock
          meta={filmMeta}
          relatedSongs={relatedSongs}
          ageVerified={ageVerified}
        />
      )}
      {gameMeta && (
        <GameMediaBlock
          meta={gameMeta}
          relatedGames={relatedGames}
          ageVerified={ageVerified}
        />
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

/** Display a release date string (yyyy / yyyy-mm / yyyy-mm-dd) with dot separators. */
function formatRelease(s: string): string {
  return s.trim().replace(/-/g, ".");
}

const sectionCls =
  "px-4 sm:px-6 md:px-8 pb-6 pt-5 border-t border-dashed border-[color:var(--color-paper-edge)] mx-4 sm:mx-6 md:mx-8 flex flex-col gap-5";
/** Same as sectionCls but without the dashed top divider (used for media blocks). */
const mediaSectionCls =
  "px-4 sm:px-6 md:px-8 pb-6 pt-2 mx-4 sm:mx-6 md:mx-8 flex flex-col gap-5";
const headingCls =
  "text-[9px] tracking-[0.3em] text-[color:var(--color-ink-soft)] mb-2";

/** A YouTube teaser/trailer embed. Renders nothing for non-YouTube URLs. */
function VideoEmbed({ url, title }: { url?: string; title: string }) {
  const id = youtubeVideoId(url);
  if (!id) return null;
  return (
    <div className="aspect-video w-full bg-black overflow-hidden border border-[color:var(--color-paper-edge)]">
      <iframe
        src={`https://www.youtube.com/embed/${id}?rel=0&playsinline=1`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        className="w-full h-full"
      />
    </div>
  );
}

/** Small "label: value" info chips row used by film / game meta. */
function InfoChips({ items }: { items: { label: string; value: string }[] }) {
  const rows = items.filter((i) => i.value);
  if (rows.length === 0) return null;
  return (
    <dl className="flex flex-wrap gap-x-6 gap-y-2">
      {rows.map((r) => (
        <div key={r.label} className="flex flex-col gap-0.5">
          <dt className="text-[9px] tracking-[0.3em] text-[color:var(--color-ink-soft)]">
            {r.label}
          </dt>
          <dd className="text-[13px] text-[color:var(--color-ink)]">{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Film info shown before NOTE: country / runtime (genre is in the header). */
function FilmInfoBlock({ meta }: { meta: FilmsMeta }) {
  const info = [
    { label: "COUNTRY", value: meta.country ?? "" },
    { label: "RUNTIME", value: meta.runtime ? `${meta.runtime} min` : "" },
  ];
  if (!info.some((i) => i.value)) return null;
  return (
    <div className={sectionCls}>
      <InfoChips items={info} />
    </div>
  );
}

/** Film media shown after NOTE: teaser / cast / related songs. */
function FilmMediaBlock({
  meta,
  relatedSongs,
  ageVerified,
}: {
  meta: FilmsMeta;
  relatedSongs: Item[];
  ageVerified: boolean;
}) {
  const cast = (meta.cast ?? []).filter((c) => c.role || c.actor);
  const hasVideo = Boolean(youtubeVideoId(meta.movieUrl));
  if (!hasVideo && cast.length === 0 && relatedSongs.length === 0) return null;

  return (
    <div className={mediaSectionCls}>
      {hasVideo && (
        <div>
          {meta.movieIsFull && <p className={headingCls}>本編</p>}
          <VideoEmbed url={meta.movieUrl} title={meta.movieIsFull ? "本編" : "Teaser"} />
        </div>
      )}

      {cast.length > 0 && (
        <div>
          <p className={headingCls}>CAST</p>
          <ul className="flex flex-col gap-2">
            {cast.map((c, i) => (
              <li
                key={i}
                className="grid grid-cols-[1fr_1fr] gap-3 items-baseline"
              >
                <span className="text-[14px] text-[color:var(--color-ink)]">
                  {c.actor || "—"}
                </span>
                <span className="text-[12px] text-[color:var(--color-ink-muted)]">
                  {c.role ? `as ${c.role}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {relatedSongs.length > 0 && (
        <div>
          <p className={headingCls}>RELATED SONGS</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {relatedSongs.map((r) => (
              <ItemCardSmall
                key={r.id}
                item={r}
                locked={isItemLocked(r, ageVerified)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Game media shown after NOTE: teaser / related video / related games. */
function GameMediaBlock({
  meta,
  relatedGames,
  ageVerified,
}: {
  meta: GamesMeta;
  relatedGames: Item[];
  ageVerified: boolean;
}) {
  const hasTeaser = Boolean(youtubeVideoId(meta.movieUrl));
  const hasRelatedVideo = Boolean(youtubeVideoId(meta.relatedVideoUrl));
  if (!hasTeaser && !hasRelatedVideo && relatedGames.length === 0) return null;

  return (
    <div className={mediaSectionCls}>
      {hasTeaser && <VideoEmbed url={meta.movieUrl} title="Teaser" />}

      {hasRelatedVideo && (
        <div>
          <p className={headingCls}>RELATED VIDEO</p>
          <VideoEmbed url={meta.relatedVideoUrl} title="Related video" />
        </div>
      )}

      {relatedGames.length > 0 && (
        <div>
          <p className={headingCls}>RELATED GAMES</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {relatedGames.map((r) => (
              <ItemCardSmall
                key={r.id}
                item={r}
                locked={isItemLocked(r, ageVerified)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
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
  // Order by the MEMBERS master order (memberMap preserves master/insertion order).
  const order = new Map([...memberMap.keys()].map((name, i) => [name, i] as const));
  const ordered = [...people].sort(
    (a, b) => (order.get(a.name) ?? Infinity) - (order.get(b.name) ?? Infinity),
  );
  return (
    <div className="flex flex-wrap items-start gap-x-4 gap-y-3">
      {ordered.map((p) => {
        const avatarUrl = p.avatarUrl ?? memberMap.get(p.name)?.avatarUrl;
        const initials = p.name.slice(0, 2).toUpperCase();
        return (
          <div key={p.name} className="flex flex-col items-center gap-1.5 w-16">
            <div className="relative w-14 h-14 rounded-full bg-[color:var(--color-cream-deep)] border border-[color:var(--color-line)] flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                <OptimizedImage src={avatarUrl} sizes="56px" />
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
