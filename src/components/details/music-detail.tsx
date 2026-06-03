import Link from "next/link";
import { Pencil } from "lucide-react";
import type {
  Item,
  LikedByPerson,
  Member,
  Mood,
  MusicMeta,
} from "@/lib/types";
import { getAllMoods } from "@/lib/db/moods";
import { getAllScenes } from "@/lib/db/scenes";
import { getMemberMap } from "@/lib/db/members";
import { ImagePlaceholder } from "../image-placeholder";
import { OptimizedImage } from "../optimized-image";
import { MoodChip } from "../mood-chip";
import { formatCardDate } from "@/lib/format";
import { flagFromCountryName } from "@/lib/country";
import { youtubeVideoId } from "@/lib/youtube";
import { MusicTabs } from "./music-tabs";
import { LyricsTabs } from "./lyrics-tabs";

const EXTERNAL_ICON = (
  <svg
    width="11"
    height="11"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="shrink-0"
  >
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

const APPLE_MUSIC_LOGO = (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-label="Apple Music">
    <defs>
      <linearGradient id="am-grad" x1="0" y1="0" x2="0" y2="24" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FA233B" />
        <stop offset="1" stopColor="#FB5C74" />
      </linearGradient>
    </defs>
    <rect width="24" height="24" rx="5" fill="url(#am-grad)" />
    <path
      d="M15.5 6.4l-7 1.5v7.5c-.3-.2-.7-.3-1.1-.3-1.1 0-2 .7-2 1.7s.9 1.7 2 1.7 2-.7 2-1.7v-6.5l5-1.1v5c-.3-.2-.7-.3-1.1-.3-1.1 0-2 .7-2 1.7s.9 1.7 2 1.7 2-.7 2-1.7V6.4z"
      fill="white"
    />
  </svg>
);

const SPOTIFY_LOGO = (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-label="Spotify">
    <circle cx="12" cy="12" r="12" fill="#1DB954" />
    <path
      d="M17.5 17.3c-.24.36-.66.48-1.02.24-2.82-1.74-6.36-2.1-10.56-1.14-.42.12-.78-.18-.9-.54-.12-.42.18-.78.54-.9 4.56-1.02 8.52-.6 11.64 1.32.42.18.48.66.3 1.02zm1.44-3.3c-.3.42-.84.6-1.26.3-3.24-1.98-8.16-2.58-11.94-1.38-.48.12-1.02-.12-1.14-.6-.12-.48.12-1.02.6-1.14 4.32-1.32 9.72-.66 13.44 1.62.36.18.54.78.3 1.2zm.12-3.36c-3.84-2.28-10.26-2.52-13.92-1.38-.6.18-1.2-.18-1.38-.72-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.72 1.62.54.3.72 1.02.42 1.56-.3.42-1.02.6-1.56.3z"
      fill="white"
    />
  </svg>
);

export async function MusicDetail({
  item,
  similar,
  artistSlug,
}: {
  item: Item;
  similar: Item[];
  artistSlug?: string;
}) {
  const [allMoods, allScenes] = await Promise.all([
    getAllMoods(),
    getAllScenes(),
  ]);
  const sceneObjs = (item.scenes ?? [])
    .map((slug) => allScenes.find((s) => s.slug === slug))
    .filter((s): s is { slug: string; label: string } => Boolean(s));
  const memberMap = await getMemberMap();
  const meta = (item.meta?.category === "music" ? item.meta : undefined) as
    | MusicMeta
    | undefined;
  const moodObjs = item.moods
    .map((slug) => allMoods.find((m) => m.slug === slug))
    .filter((m): m is Mood => Boolean(m));

  const hasCover = Boolean(
    meta?.cover?.videoUrl ||
      (meta?.cover?.members && meta.cover.members.length > 0),
  );
  const hasLiked = Boolean(meta?.likedBy && meta.likedBy.length > 0);
  const hasSamples = Boolean(meta?.samples && meta.samples.length > 0);
  const hasLyric = Boolean(meta?.lyricExcerpt?.original);

  return (
    <div className="@container">
      {/* ============================
          MOBILE / TABLET (<lg) LAYOUT
          ============================ */}
      <div className="lg:hidden flex flex-col gap-4 px-4 pt-2 pb-[88px]">
        <MusicTabs
          header={
            <>
              <YouTubeEmbed url={meta?.mvUrl} title={item.title} color={meta?.color} />
              <TitleBlock item={item} meta={meta} artistSlug={artistSlug} />
            </>
          }
          counts={{
            lyrics: hasLyric ? 1 : 0,
            cover: hasCover ? 1 : 0,
            liked: meta?.likedBy?.length ?? 0,
            similar: similar.length,
          }}
          lyrics={
            hasLyric ? (
              <LyricsTabs lyric={meta!.lyricExcerpt!} />
            ) : (
              <p className="text-[12px] text-[color:var(--color-ink-soft)]">
                No lyrics yet.
              </p>
            )
          }
          trackInfo={
            <div className="flex flex-col">
              {meta?.recommendation && (
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {meta.recommendation
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean)
                    .map((tag, i) => (
                      <span
                        key={`${tag}-${i}`}
                        className="inline-flex items-center rounded-full border border-[color:var(--color-line)]/60 bg-[color:var(--color-paper)] px-2.5 py-0.5 text-[11px] text-[color:var(--color-ink-muted)]"
                      >
                        #{tag}
                      </span>
                    ))}
                </div>
              )}
              <TrackInfoTable item={item} meta={meta} />
              {meta?.genre && (
                <div className="grid grid-cols-[7rem_1fr] sm:grid-cols-[8.5rem_1fr] items-baseline gap-x-2 py-1.5 border-b border-[color:var(--color-line)]/30 text-[11px]">
                  <span className="text-[color:var(--color-ink-soft)] tracking-wide">
                    Genre
                  </span>
                  <div className="flex flex-nowrap gap-1.5 overflow-x-auto scroll-x min-w-0">
                    {meta.genre
                      .split(",")
                      .map((g) => g.trim())
                      .filter(Boolean)
                      .map((tag, i) => (
                        <span
                          key={`${tag}-${i}`}
                          className="inline-flex items-center rounded-full border border-[color:var(--color-line)]/60 bg-[color:var(--color-paper)] px-2.5 py-0.5 text-[11px] text-[color:var(--color-ink-muted)] shrink-0"
                        >
                          #{tag}
                        </span>
                      ))}
                  </div>
                </div>
              )}
              {moodObjs.length > 0 && (
                <div className="grid grid-cols-[7rem_1fr] sm:grid-cols-[8.5rem_1fr] items-baseline gap-x-2 py-1.5 border-b border-[color:var(--color-line)]/30 text-[11px]">
                  <span className="text-[color:var(--color-ink-soft)] tracking-wide">
                    Mood
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {moodObjs.map((m) => (
                      <MoodChip key={m.slug} mood={m} size="sm" href={`/moods/${m.slug}`} />
                    ))}
                  </div>
                </div>
              )}
              {sceneObjs.length > 0 && (
                <div className="grid grid-cols-[7rem_1fr] sm:grid-cols-[8.5rem_1fr] items-baseline gap-x-2 py-1.5 border-b border-[color:var(--color-line)]/30 text-[11px]">
                  <span className="text-[color:var(--color-ink-soft)] tracking-wide">
                    Scene
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {sceneObjs.map((s) => (
                      <span
                        key={s.slug}
                        className="inline-flex items-center rounded-full border border-[color:var(--color-line)]/60 bg-[color:var(--color-paper)] px-2.5 py-0.5 text-[11px] text-[color:var(--color-ink-muted)]"
                      >
                        {s.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          }
          cover={
            hasCover ? (
              <CoverSection
                videoUrl={meta?.cover?.videoUrl}
                members={meta?.cover?.members}
                memberMap={memberMap}
                hideHeading
              />
            ) : (
              <p className="text-[12px] text-[color:var(--color-ink-soft)]">
                No cover data.
              </p>
            )
          }
          liked={
            hasLiked ? (
              <LikedBy
                people={meta!.likedBy!}
                group={meta?.likedByGroup}
                url={meta?.playlistNoteUrl}
                memberMap={memberMap}
                hideHeading
              />
            ) : (
              <p className="text-[12px] text-[color:var(--color-ink-soft)]">
                No liked-by data.
              </p>
            )
          }
          similar={
            similar.length > 0 ? (
              <SimilarSongs items={similar} hideHeading />
            ) : (
              <p className="text-[12px] text-[color:var(--color-ink-soft)]">
                No similar songs yet.
              </p>
            )
          }
        />
        {hasSamples && (
          <div
            className="fixed bottom-0 left-0 right-0 z-30 border-t border-[color:var(--color-line)]/50 px-3 py-2 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] overflow-hidden"
            style={{
              backgroundColor: meta?.color
                ? withAlpha(meta.color, 0.35)
                : "var(--color-cream)",
            }}
          >
            <div className="flex gap-1.5 w-max animate-[marquee_25s_linear_infinite]">
              {[...meta!.samples!.slice(0, 4), ...meta!.samples!.slice(0, 4)].map((url, i) => (
                <div
                  key={i}
                  style={{ width: "110px", height: "62px" }}
                  className="relative shrink-0 overflow-hidden bg-[color:var(--color-cream-deep)] border border-[color:var(--color-paper-edge)]/60"
                >
                  <OptimizedImage src={url} sizes="110px" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ============================
          DESKTOP (lg+) LAYOUT
          ============================ */}
      <div className="hidden lg:block">
      {/* Top — 3-col [YouTube (1fr) | Jacket+KCB+Mood (260px) | Cover above Title (1fr)].
          YouTube keeps its original 1fr width. Cover sits in col 3 above the Title block. */}
      <div className="grid grid-cols-1 @[920px]:grid-cols-[1fr_260px_1fr] gap-5 items-start px-4 sm:px-6 md:px-8 pt-2 pb-6">
        <div className="min-w-0 order-1">
          <YouTubeEmbed url={meta?.mvUrl} title={item.title} color={meta?.color} />
        </div>
        <div className="flex flex-col gap-3 min-w-0 max-w-[260px] w-full mx-auto @[920px]:mx-0 order-3 @[920px]:order-2">
          <div className="aspect-square w-full overflow-hidden hidden @[920px]:block">
            <ImagePlaceholder
              category={item.category}
              id={item.id}
              imageUrl={item.imageUrl}
              sizes="260px"
            />
          </div>
          <KeyCamelotBpm meta={meta} />
          <div className="mt-auto pt-3 flex items-center gap-2 flex-wrap">
            <span className="text-[10px] tracking-[0.3em] text-[color:var(--color-ink-soft)]">
              Mood
            </span>
            <div className="flex flex-wrap gap-1.5">
              {moodObjs.map((m) => (
                <MoodChip key={m.slug} mood={m} size="sm" href={`/moods/${m.slug}`} />
              ))}
            </div>
          </div>
          {sceneObjs.length > 0 && (
            <div className="pt-2 flex items-center gap-2 flex-wrap">
              <span className="text-[10px] tracking-[0.3em] text-[color:var(--color-ink-soft)]">
                Scene
              </span>
              <div className="flex flex-wrap gap-1.5">
                {sceneObjs.map((s) => (
                  <span
                    key={s.slug}
                    className="inline-flex items-center rounded-full border border-[color:var(--color-line)]/60 bg-[color:var(--color-paper)] px-2.5 py-0.5 text-[11px] text-[color:var(--color-ink-muted)]"
                  >
                    {s.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-4 min-w-0 @container order-2 @[920px]:order-3">
          <TitleBlock item={item} meta={meta} artistSlug={artistSlug} />
          {meta?.recommendation && (
            <div className="flex flex-wrap gap-1.5">
              {meta.recommendation
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean)
                .map((tag, i) => (
                  <span
                    key={`${tag}-${i}`}
                    className="inline-flex items-center rounded-full border border-[color:var(--color-line)]/60 bg-[color:var(--color-paper)] px-2.5 py-0.5 text-[11px] text-[color:var(--color-ink-muted)]"
                  >
                    #{tag}
                  </span>
                ))}
            </div>
          )}
          {(meta?.cover?.videoUrl || (meta?.cover?.members && meta.cover.members.length > 0)) && (
            <CoverSection
              videoUrl={meta?.cover?.videoUrl}
              members={meta?.cover?.members}
              memberMap={memberMap}
            />
          )}
          <TrackInfoTable item={item} meta={meta} />
          {meta?.genre && (
            <div className="mt-auto pt-3 flex items-baseline gap-x-2 min-w-0">
              <span className="text-[10px] tracking-[0.3em] text-[color:var(--color-ink-soft)] shrink-0">
                Genre
              </span>
              <div className="flex flex-nowrap gap-1.5 overflow-x-auto scroll-x min-w-0">
                {meta.genre
                  .split(",")
                  .map((g) => g.trim())
                  .filter(Boolean)
                  .map((tag, i) => (
                    <span
                      key={`${tag}-${i}`}
                      className="inline-flex items-center rounded-full border border-[color:var(--color-line)]/60 bg-[color:var(--color-paper)] px-2.5 py-0.5 text-[11px] text-[color:var(--color-ink-muted)] shrink-0"
                    >
                      #{tag}
                    </span>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 sm:px-6 md:px-8">
        <div className="flex flex-col gap-6 min-w-0 @container">
          {hasLyric && <LyricsTabs lyric={meta!.lyricExcerpt!} />}
          {((meta?.samples && meta.samples.length > 0) ||
            (meta?.likedBy && meta.likedBy.length > 0) ||
            similar.length > 0) && (
            <div className="grid grid-cols-1 @[860px]:grid-cols-2 gap-6">
              {meta?.samples && meta.samples.length > 0 && (
                <SampleGallery samples={meta.samples} />
              )}
              {((meta?.likedBy && meta.likedBy.length > 0) || similar.length > 0) && (
                <div className="flex flex-col gap-6 min-w-0">
                  {meta?.likedBy && meta.likedBy.length > 0 && (
                    <LikedBy
                      people={meta.likedBy}
                      group={meta.likedByGroup}
                      url={meta.playlistNoteUrl}
                      memberMap={memberMap}
                    />
                  )}
                  {similar.length > 0 && <SimilarSongs items={similar} />}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      </div>{/* end DESKTOP wrapper */}

    </div>
  );
}

function SampleGallery({ samples }: { samples: string[] }) {
  return (
    <section className="min-w-0">
      <div className="flex sm:grid sm:grid-cols-2 gap-1.5 overflow-x-auto sm:overflow-visible snap-x snap-mandatory sm:snap-none scroll-x sm:max-w-[160px] lg:max-w-[200px]">
        {samples.slice(0, 4).map((url, i) => (
          <div
            key={i}
            style={{ width: "110px", height: "62px" }}
            className="relative shrink-0 sm:!w-auto sm:!h-auto sm:aspect-video overflow-hidden bg-[color:var(--color-cream-deep)] border border-[color:var(--color-paper-edge)]/60 snap-center"
          >
            <OptimizedImage src={url} alt={`Sample ${i + 1}`} sizes="200px" />
          </div>
        ))}
      </div>
    </section>
  );
}

function TitleBlock({
  item,
  meta,
  artistSlug,
}: {
  item: Item;
  meta?: MusicMeta;
  artistSlug?: string;
}) {
  const hasSubtitle = Boolean(item.titleSub && item.titleSubPublic);
  const hasKatakana = Boolean(item.creatorKatakana);
  const creatorContent = artistSlug ? (
    <Link
      href={`/artists/${artistSlug}`}
      className="hover:underline underline-offset-2"
    >
      {item.creator}
    </Link>
  ) : (
    item.creator
  );
  const listenLinks = (
    <>
      {meta?.appleMusicUrl && (
        <a
          href={meta.appleMusicUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Apple Music"
          className="inline-flex hover:opacity-80 transition"
        >
          {APPLE_MUSIC_LOGO}
        </a>
      )}
      {meta?.spotifyUrl && (
        <a
          href={meta.spotifyUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Spotify"
          className="inline-flex hover:opacity-80 transition"
        >
          {SPOTIFY_LOGO}
        </a>
      )}
    </>
  );
  const hasListen = Boolean(meta?.appleMusicUrl || meta?.spotifyUrl);

  return (
    <div className="pb-1 border-b border-[color:var(--color-line)]/50">
      {/* Mobile/Tablet (<lg): Title + Creator left, Listen icons right (after creator). */}
      <div className="flex items-baseline gap-x-4 gap-y-1 flex-wrap lg:block">
        <h2 className="font-serif text-[28px] @md:text-[36px] @xl:text-[44px] leading-[1.05] tracking-tight text-[color:var(--color-ink)] break-words">
          {item.title}
        </h2>
        <p className="lg:hidden font-serif text-[13px] @md:text-[16px] text-[color:var(--color-ink-muted)] break-words">
          {creatorContent}
        </p>
        {hasListen && (
          <span className="lg:hidden ml-auto inline-flex items-center gap-2 self-center">
            {listenLinks}
          </span>
        )}
      </div>
      {hasSubtitle && (
        <p className="font-serif text-[18px] @md:text-[22px] text-[color:var(--color-ink-muted)] leading-tight mt-1 break-words">
          {item.titleSub}
        </p>
      )}
      {/* Desktop only: Creator + Katakana left, Listen icons right */}
      <div className="hidden lg:flex items-baseline gap-3 mt-1 mb-3 flex-wrap">
        <p className="font-serif text-[16px] @md:text-[20px] text-[color:var(--color-ink-muted)] flex flex-col @sm:flex-row @sm:items-baseline @sm:gap-3">
          <span>{creatorContent}</span>
          {hasKatakana && (
            <span className="text-[11px] @md:text-[13px] text-[color:var(--color-ink-soft)] tracking-wide">
              {item.creatorKatakana}
            </span>
          )}
        </p>
        {hasListen && (
          <span className="ml-auto inline-flex items-center gap-2 self-center">
            {listenLinks}
          </span>
        )}
      </div>
    </div>
  );
}

type InfoRow = { label: string; value: string | undefined };

function formatCountry(name: string | undefined): string | undefined {
  if (!name) return undefined;
  const flag = flagFromCountryName(name);
  return flag ? `${flag}  ${name}` : name;
}

/**
 * Top-of-image boxed display of musical facts: KEY, CAMELOT, BPM.
 * Hidden when none of the three are populated. Read-only mirror of the admin
 * Audio features section.
 */
function KeyCamelotBpm({ meta }: { meta?: MusicMeta }) {
  const k = meta?.musicalKey;
  const c = meta?.camelot;
  const b = meta?.bpm;
  if (!k && !c && b === undefined) return null;

  return (
    <div className="grid grid-cols-3 gap-2 w-full">
      <FactBox label="KEY"     value={k ?? "—"} />
      <FactBox label="CAMELOT" value={c ?? "—"} />
      <FactBox label="BPM"     value={b !== undefined ? String(b) : "—"} />
    </div>
  );
}

function FactBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 border border-[color:var(--color-paper-edge)] bg-[color:var(--color-paper)] py-1.5">
      <span className="font-serif text-[13px] @md:text-[15px] text-[color:var(--color-ink)] leading-none">
        {value}
      </span>
      <span className="text-[8px] tracking-[0.2em] text-[color:var(--color-ink-soft)]">
        {label}
      </span>
    </div>
  );
}

function TrackInfoTable({ item, meta }: { item: Item; meta?: MusicMeta }) {
  const releaseDate = meta?.releaseDate ? formatCardDate(meta.releaseDate) : undefined;

  const otherRows: InfoRow[] = [
    { label: "Album",   value: meta?.album },
    { label: "Country", value: formatCountry(meta?.country) },
  ].filter((r) => r.value);

  const rowCls =
    "grid grid-cols-[7rem_1fr] sm:grid-cols-[8.5rem_1fr] items-baseline gap-x-2 py-1.5 border-b border-[color:var(--color-line)]/30";

  return (
    <section>
      <dl className="text-[11px]">
        {meta?.album && (
          <div className={rowCls}>
            <dt className="text-[color:var(--color-ink-soft)] tracking-wide">Album</dt>
            <dd className="text-[color:var(--color-ink)] break-words">{meta.album}</dd>
          </div>
        )}
        {releaseDate && (
          <div className={rowCls}>
            <dt className="text-[color:var(--color-ink-soft)] tracking-wide">Release</dt>
            <dd className="text-[color:var(--color-ink)]">{releaseDate}</dd>
          </div>
        )}
        {otherRows
          .filter((r) => r.label !== "Album")
          .map((r) => (
            <div key={r.label} className={rowCls}>
              <dt className="text-[color:var(--color-ink-soft)] tracking-wide">{r.label}</dt>
              <dd className="text-[color:var(--color-ink)] break-words">{r.value}</dd>
            </div>
          ))}
      </dl>
    </section>
  );
}

function MoodSection({ moodObjs }: { moodObjs: Mood[] }) {
  return (
    <section>
      <h3 className="font-serif text-[20px] text-[color:var(--color-ink)] mb-2">Mood</h3>
      <div className="flex flex-wrap gap-1.5">
        {moodObjs.map((m) => (
          <MoodChip key={m.slug} mood={m} size="sm" href={`/moods/${m.slug}`} />
        ))}
      </div>
    </section>
  );
}

function GenreSection({ genre }: { genre: string }) {
  const tags = genre.split(",").map((g) => g.trim()).filter(Boolean);
  return (
    <section>
      <h3 className="font-serif text-[20px] text-[color:var(--color-ink)] mb-2">Genre</h3>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag, i) => (
          <span
            key={`${tag}-${i}`}
            className="inline-flex items-center rounded-full border border-[color:var(--color-line)]/60 bg-[color:var(--color-paper)] px-2.5 py-0.5 text-[11px] text-[color:var(--color-ink-muted)]"
          >
            #{tag}
          </span>
        ))}
      </div>
    </section>
  );
}

/**
 * Top-of-page YouTube iframe. Renders nothing if the URL isn't a recognizable
 * YouTube link, so songs without an MV simply don't take any vertical space.
 */
function YouTubeEmbed({
  url,
  title,
  color,
}: {
  url?: string;
  title: string;
  color?: string;
}) {
  const id = youtubeVideoId(url);
  if (!id) return null;
  const tint = color ? withAlpha(color, 0.35) : null;
  return (
    <div
      className="w-full overflow-hidden border border-[color:var(--color-paper-edge)]"
      style={tint ? { backgroundColor: tint, padding: "10px" } : undefined}
    >
      <div className="aspect-video w-full bg-black overflow-hidden">
        <iframe
          src={`https://www.youtube.com/embed/${id}?rel=0&playsinline=1`}
          title={`${title} — MV`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="w-full h-full"
        />
      </div>
    </div>
  );
}

/** Append an alpha channel to a "#rrggbb" hex. Falls back to the input if not a valid hex. */
function withAlpha(hex: string, alpha: number): string {
  const m = /^#([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!m) return hex;
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, "0");
  return `#${m[1]}${a}`;
}

function LikedBy({
  people,
  group,
  url,
  memberMap,
  hideHeading,
}: {
  people: LikedByPerson[];
  group?: string;
  url?: string;
  memberMap: Map<string, Member>;
  hideHeading?: boolean;
}) {
  // Order by the MEMBERS master order (memberMap preserves master/insertion order).
  const order = new Map([...memberMap.keys()].map((name, i) => [name, i] as const));
  const ordered = [...people].sort(
    (a, b) => (order.get(a.name) ?? Infinity) - (order.get(b.name) ?? Infinity),
  );
  // When the heading is hidden (inside a tab), still surface group / playlist
  // link if present; otherwise the header row collapses entirely.
  const showHeaderRow = !hideHeading || Boolean(group) || Boolean(url);
  return (
    <section>
      {showHeaderRow && (
      <div className="flex items-baseline justify-between mb-3 gap-3 flex-wrap">
        {!hideHeading ? (
          <h3 className="font-serif text-[20px] text-[color:var(--color-ink)]">
            Liked by{" "}
            {group && (
              <span className="ml-2 text-[10px] tracking-[0.3em] text-[color:var(--color-ink-soft)] align-middle">
                {group}
              </span>
            )}
          </h3>
        ) : group ? (
          <span className="text-[10px] tracking-[0.3em] text-[color:var(--color-ink-soft)]">
            {group}
          </span>
        ) : (
          <span />
        )}
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[10px] tracking-[0.2em] text-[color:var(--color-ink-muted)] hover:text-[color:var(--color-ink)] transition"
          >
            playlist note
            {EXTERNAL_ICON}
          </a>
        )}
      </div>
      )}
      <div className="flex flex-wrap items-start gap-x-5 gap-y-3">
        {ordered.map((p) => (
          <Avatar
            key={p.name}
            person={p}
            avatarUrl={p.avatarUrl ?? memberMap.get(p.name)?.avatarUrl}
          />
        ))}
      </div>
    </section>
  );
}

function Avatar({ person, avatarUrl }: { person: LikedByPerson; avatarUrl?: string }) {
  const initials = person.name.slice(0, 2).toUpperCase();
  return (
    <div className="flex flex-col items-center gap-2 w-24">
      <div className="relative w-20 h-20 rounded-full bg-[color:var(--color-cream-deep)] border border-[color:var(--color-line)] flex items-center justify-center overflow-hidden">
        {avatarUrl ? (
          <OptimizedImage src={avatarUrl} sizes="80px" />
        ) : (
          <span className="font-serif text-[16px] tracking-wide text-[color:var(--color-ink-muted)]">
            {initials}
          </span>
        )}
      </div>
      <p className="text-[12px] tracking-wide text-[color:var(--color-ink)] text-center">{person.name}</p>
    </div>
  );
}

function NotesBlock({ note, date }: { note: string; date: string }) {
  return (
    <section>
      <h3 className="font-serif text-[20px] text-[color:var(--color-ink)] mb-2">Notes</h3>
      <div className="relative bg-[color:var(--color-paper)] border border-[color:var(--color-paper-edge)] p-4">
        <p className="text-[12px] leading-relaxed text-[color:var(--color-ink)] whitespace-pre-line pr-16">
          {note}
        </p>
        <div className="absolute top-3 right-4 flex items-center gap-2">
          <span className="text-[9px] tracking-[0.2em] text-[color:var(--color-ink-soft)]">
            {formatCardDate(date)}
          </span>
          <span className="text-[color:var(--color-ink-soft)]">
            <Pencil size={12} strokeWidth={1.5} />
          </span>
        </div>
      </div>
    </section>
  );
}


function CoverSection({
  videoUrl,
  members,
  memberMap,
  hideHeading,
}: {
  videoUrl?: string;
  members?: string[];
  memberMap: Map<string, Member>;
  hideHeading?: boolean;
}) {
  const ytId = youtubeVideoId(videoUrl);
  return (
    <section>
      <div className="flex items-center gap-x-5 gap-y-2 mb-3 flex-wrap">
        {!hideHeading && (
          <h3 className="font-serif text-[28px] @md:text-[32px] text-[color:var(--color-ink)] leading-none">Cover</h3>
        )}
        {members && members.length > 0 && (
          <div className="flex items-center gap-x-4 gap-y-2 flex-wrap">
            {members.map((name) => (
              <InlineMember
                key={name}
                name={name}
                avatarUrl={memberMap.get(name)?.avatarUrl}
              />
            ))}
          </div>
        )}
        {videoUrl && !ytId && (
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[10px] tracking-[0.2em] text-[color:var(--color-ink-muted)] hover:text-[color:var(--color-ink)] transition ml-auto"
          >
            watch cover
            {EXTERNAL_ICON}
          </a>
        )}
      </div>
      {ytId && (
        <div className="aspect-video w-full max-w-2xl bg-black overflow-hidden border border-[color:var(--color-paper-edge)]">
          <iframe
            src={`https://www.youtube.com/embed/${ytId}?rel=0&playsinline=1`}
            title="Cover performance"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="w-full h-full"
          />
        </div>
      )}
    </section>
  );
}

/** Circular avatar (image or initials fallback) + name, inline next to the Cover heading. */
function InlineMember({ name, avatarUrl }: { name: string; avatarUrl?: string }) {
  const initials = name.slice(0, 2).toUpperCase();
  return (
    <div className="flex items-center gap-2">
      <div className="relative w-10 h-10 rounded-full bg-[color:var(--color-cream-deep)] border border-[color:var(--color-line)] flex items-center justify-center overflow-hidden">
        {avatarUrl ? (
          <OptimizedImage src={avatarUrl} sizes="40px" />
        ) : (
          <span className="font-serif text-[12px] tracking-wide text-[color:var(--color-ink-muted)]">
            {initials}
          </span>
        )}
      </div>
      <span className="text-[14px] text-[color:var(--color-ink)]">{name}</span>
    </div>
  );
}

function SimilarSongs({ items, hideHeading }: { items: Item[]; hideHeading?: boolean }) {
  return (
    <section>
      {!hideHeading && (
        <h3 className="font-serif text-[20px] text-[color:var(--color-ink)] mb-2">Similar Songs</h3>
      )}
      <ul className="grid grid-cols-2 gap-x-3">
        {items.map((s) => (
          <li
            key={s.id}
            className="border-b border-[color:var(--color-line)]/30 min-w-0"
          >
            <Link
              href={`/items/${s.id}`}
              className="group flex items-center gap-3 py-2.5 transition hover:bg-[color:var(--color-cream-soft)]/40 px-1 min-w-0"
            >
              <div className="w-12 h-12 shrink-0 overflow-hidden">
                <ImagePlaceholder category={s.category} id={s.id} imageUrl={s.imageUrl} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-serif text-[14px] leading-tight text-[color:var(--color-ink)] truncate group-hover:underline underline-offset-2">
                  {s.title}
                </p>
                <p className="font-serif text-[10px] text-[color:var(--color-ink-muted)] truncate mt-0.5">
                  {s.creator}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
