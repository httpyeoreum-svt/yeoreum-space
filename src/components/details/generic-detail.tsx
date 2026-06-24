import type {
  Category,
  FilmsMeta,
  Item,
  LikedByPerson,
  Member,
  PerfumeMeta,
} from "@/lib/types";
import { CATEGORY_META } from "@/lib/types";
import { getAllMoods } from "@/lib/db/moods";
import { getMemberMap } from "@/lib/db/members";
import { getItemsByIds, getCuratedSimilars } from "@/lib/db/items";
import { ImagePlaceholder } from "../image-placeholder";
import { AvatarCircle } from "../avatar-circle";
import { MoodChip } from "../mood-chip";
import { ItemCardSmall } from "../item-card-small";
import { DetailTabs } from "./detail-tabs";
import { YouTubeEmbed } from "../youtube-embed";
import { youtubeVideoId } from "@/lib/youtube";
import { flagFromCountryName } from "@/lib/country";
import { TAG_PILL_CLS } from "@/lib/ui";
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
  // Curated similars (bidirectional links in item_similars). Links can cross
  // categories (e.g. a film linked to a book), so we group the results by
  // category and render one "RELATED <CATEGORY>" tab per group — the item's own
  // category first. This keeps a film's related books out of its films tab.
  const supportsCurated =
    item.category === "games" ||
    item.category === "books" ||
    item.category === "films";
  const relatedCurated = supportsCurated
    ? await getCuratedSimilars(item.id)
    : [];
  const curatedOrder: Category[] = [
    item.category,
    ...(["films", "books", "games"] as Category[]).filter(
      (c) => c !== item.category,
    ),
  ];
  const curatedGroups = curatedOrder
    .map((cat) => ({
      cat,
      items: relatedCurated.filter((i) => i.category === cat),
    }))
    .filter((g) => g.items.length > 0);

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
        {/* Films show release / genre inside the 2×2 info block below. */}
        {releaseDate && item.category !== "films" && (
          <p className="mt-3 text-[10px] tracking-[0.25em] text-[color:var(--color-ink-soft)]">
            RELEASE&nbsp;&nbsp;{formatRelease(releaseDate)}
          </p>
        )}
        {genre && item.category !== "films" && (
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
            // Films embed their teaser / 本編 (and related video) here — there is
            // no separate TEASER tab for films; the story and footage live together.
            content: (() => {
              const note = item.note ? (
                <p className="font-serif text-[11px] leading-relaxed text-[color:var(--color-ink)]">
                  {item.category === "perfume" ? (
                    item.note
                  ) : (
                    <>&ldquo;{item.note}&rdquo;</>
                  )}
                </p>
              ) : null;
              if (!filmMeta) return note;
              const hasMovie = youtubeVideoId(filmMeta.movieUrl);
              const hasRelatedVideo = youtubeVideoId(filmMeta.relatedVideoUrl);
              if (!note && !hasMovie && !hasRelatedVideo) return null;
              return (
                <div className="flex flex-col gap-5">
                  {hasMovie && (
                    <div>
                      {filmMeta.movieIsFull && <p className={headingCls}>本編</p>}
                      <YouTubeEmbed
                        url={filmMeta.movieUrl}
                        title={filmMeta.movieIsFull ? "本編" : "Teaser"}
                      />
                    </div>
                  )}
                  {note}
                  {hasRelatedVideo && (
                    <div>
                      <p className={headingCls}>RELATED VIDEO</p>
                      <YouTubeEmbed
                        url={filmMeta.relatedVideoUrl}
                        title="Related video"
                      />
                    </div>
                  )}
                </div>
              );
            })(),
          },
          {
            key: "liked",
            label: item.category === "games" ? "RELATED" : "LIKED",
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
              moodObjs.length > 0 || related.length > 0 ? (
                <div className="flex flex-col gap-5">
                  {moodObjs.length > 0 && (
                    <div className="flex flex-nowrap gap-1.5 overflow-x-auto scroll-x">
                      {moodObjs.map((m) => (
                        <div key={m.slug} className="shrink-0">
                          <MoodChip mood={m} size="sm" href={`/moods/${m.slug}`} />
                        </div>
                      ))}
                    </div>
                  )}
                  {related.length > 0 && (
                    <div>
                      <p className="text-[9px] tracking-[0.3em] text-[color:var(--color-ink-soft)] mb-3">
                        IN THE SAME MOOD
                      </p>
                      <div className="grid items-start grid-cols-2 sm:grid-cols-3 gap-3">
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
                </div>
              ) : null,
          },
          ...curatedGroups.map((g) => ({
            key: `related-${g.cat}`,
            label: `RELATED ${CATEGORY_META[g.cat].label}`,
            content: (
              <div className="grid items-start grid-cols-2 sm:grid-cols-3 gap-3">
                {g.items.map((r) => (
                  <ItemCardSmall
                    key={r.id}
                    item={r}
                    locked={isItemLocked(r, ageVerified)}
                  />
                ))}
              </div>
            ),
          })),
          {
            key: "teaser",
            label: "TEASER",
            content:
              gameMeta &&
              (youtubeVideoId(gameMeta.movieUrl) ||
                youtubeVideoId(gameMeta.relatedVideoUrl)) ? (
                <div className="flex flex-col gap-5">
                  {youtubeVideoId(gameMeta.movieUrl) && (
                    <YouTubeEmbed url={gameMeta.movieUrl} title="Teaser" />
                  )}
                  {youtubeVideoId(gameMeta.relatedVideoUrl) && (
                    <div>
                      <p className={headingCls}>RELATED VIDEO</p>
                      <YouTubeEmbed
                        url={gameMeta.relatedVideoUrl}
                        title="Related video"
                      />
                    </div>
                  )}
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
    </article>
  );
}

/** Display a release date string (yyyy / yyyy-mm / yyyy-mm-dd) with dot separators. */
function formatRelease(s: string): string {
  return s.trim().replace(/-/g, ".");
}

const sectionCls =
  "px-4 sm:px-6 md:px-8 pb-6 pt-5 border-t border-dashed border-[color:var(--color-paper-edge)] mx-4 sm:mx-6 md:mx-8 flex flex-col gap-5";
const headingCls =
  "text-[9px] tracking-[0.3em] text-[color:var(--color-ink-soft)] mb-2";

/** Film info shown before NOTE — a 2×2 grid: release / country, genre / runtime. */
function FilmInfoBlock({ meta }: { meta: FilmsMeta }) {
  const country = meta.country?.trim();
  const flag = country ? flagFromCountryName(country) : "";
  const info = [
    { label: "RELEASE", value: meta.releaseDate ? formatRelease(meta.releaseDate) : "" },
    {
      label: "COUNTRY",
      value: country ? (flag ? `${flag} ${country}` : country) : "",
    },
    { label: "GENRE", value: meta.genre?.trim() ?? "" },
    { label: "RUNTIME", value: meta.runtime ? `${meta.runtime} min` : "" },
  ];
  if (!info.some((i) => i.value)) return null;
  return (
    <div className={sectionCls}>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
        {info.map((r) => (
          <div key={r.label} className="flex flex-col gap-0.5">
            <dt className="text-[9px] tracking-[0.3em] text-[color:var(--color-ink-soft)]">
              {r.label}
            </dt>
            <dd className="text-[13px] text-[color:var(--color-ink)]">
              {r.value || "—"}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** Film media shown after NOTE: cast / related songs (teaser is a tab). */
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
  if (cast.length === 0 && relatedSongs.length === 0) return null;

  return (
    <div className={sectionCls}>
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
          <div className="grid items-start grid-cols-2 sm:grid-cols-3 gap-3">
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
                className={TAG_PILL_CLS}
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
                      className={TAG_PILL_CLS}
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
                className={TAG_PILL_CLS}
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
        return (
          <div key={p.name} className="flex flex-col items-center gap-1.5 w-16">
            <AvatarCircle name={p.name} avatarUrl={avatarUrl} size="md" />
            <p className="text-[11px] tracking-wide text-[color:var(--color-ink)] text-center">
              {p.name}
            </p>
          </div>
        );
      })}
    </div>
  );
}
