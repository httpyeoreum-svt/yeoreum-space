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
import { getMemberMap } from "@/lib/db/members";
import { ImagePlaceholder } from "../image-placeholder";
import { MoodChip } from "../mood-chip";
import { formatCardDate } from "@/lib/format";
import { flagFromCountryName } from "@/lib/country";
import { youtubeVideoId } from "@/lib/youtube";
import { MusicTabs } from "./music-tabs";

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

export async function MusicDetail({
  item,
  similar,
}: {
  item: Item;
  similar: Item[];
}) {
  const allMoods = await getAllMoods();
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

  return (
    <div className="@container">
      {/* ============================
          MOBILE / TABLET (<lg) LAYOUT
          ============================ */}
      <div className="lg:hidden flex flex-col gap-4 px-4 pt-2 pb-[88px]">
        <YouTubeEmbed url={meta?.mvUrl} title={item.title} />
        <TitleBlock item={item} />
        <div className="-mt-3">
        <MusicTabs
          trackInfo={
            <div className="flex flex-col gap-4">
              <TrackInfoTable item={item} meta={meta} />
              {meta?.genre && (
                <div className="flex items-baseline gap-x-2 gap-y-1 flex-wrap">
                  <span className="text-[10px] tracking-[0.3em] text-[color:var(--color-ink-soft)]">
                    Genre
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {meta.genre
                      .split(",")
                      .map((g) => g.trim())
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
                </div>
              )}
              {moodObjs.length > 0 && (
                <div className="flex items-baseline gap-x-2 gap-y-1 flex-wrap">
                  <span className="text-[10px] tracking-[0.3em] text-[color:var(--color-ink-soft)]">
                    Mood
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {moodObjs.map((m) => (
                      <MoodChip key={m.slug} mood={m} size="sm" href={`/moods/${m.slug}`} />
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
              />
            ) : (
              <p className="text-[12px] text-[color:var(--color-ink-soft)]">
                No liked-by data.
              </p>
            )
          }
          similar={
            similar.length > 0 ? (
              <SimilarSongs items={similar} />
            ) : (
              <p className="text-[12px] text-[color:var(--color-ink-soft)]">
                No similar songs yet.
              </p>
            )
          }
        />
        </div>{/* end MusicTabs wrapper (negative top margin) */}
        {hasSamples && (
          <div className="fixed bottom-0 left-0 right-0 z-30 bg-[color:var(--color-cream)] border-t border-[color:var(--color-line)]/50 px-3 py-2 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] overflow-hidden">
            <div className="flex gap-1.5 w-max animate-[marquee_25s_linear_infinite]">
              {[...meta!.samples!.slice(0, 4), ...meta!.samples!.slice(0, 4)].map((url, i) => (
                <div
                  key={i}
                  style={{ width: "110px", height: "62px" }}
                  className="shrink-0 overflow-hidden bg-[color:var(--color-cream-deep)] border border-[color:var(--color-paper-edge)]/60"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
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
          <YouTubeEmbed url={meta?.mvUrl} title={item.title} />
        </div>
        <div className="flex flex-col gap-3 min-w-0 max-w-[260px] w-full mx-auto @[920px]:mx-0 order-3 @[920px]:order-2">
          <div className="aspect-square w-full overflow-hidden hidden @[920px]:block">
            <ImagePlaceholder category={item.category} id={item.id} imageUrl={item.imageUrl} />
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
        </div>
        <div className="flex flex-col gap-4 min-w-0 @container order-2 @[920px]:order-3">
          <TitleBlock item={item} />
          {(meta?.cover?.videoUrl || (meta?.cover?.members && meta.cover.members.length > 0)) && (
            <CoverSection
              videoUrl={meta?.cover?.videoUrl}
              members={meta?.cover?.members}
              memberMap={memberMap}
            />
          )}
          <TrackInfoTable item={item} meta={meta} />
          {meta?.genre && (
            <div className="mt-auto pt-3 flex items-baseline gap-x-2 gap-y-1 flex-wrap">
              <span className="text-[10px] tracking-[0.3em] text-[color:var(--color-ink-soft)]">
                Genre
              </span>
              <div className="flex flex-wrap gap-1.5">
                {meta.genre
                  .split(",")
                  .map((g) => g.trim())
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
            </div>
          )}
        </div>
      </div>

      <div className="px-4 sm:px-6 md:px-8">
        <div className="flex flex-col gap-6 min-w-0 @container">
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
            className="shrink-0 sm:!w-auto sm:!h-auto sm:aspect-video overflow-hidden bg-[color:var(--color-cream-deep)] border border-[color:var(--color-paper-edge)]/60 snap-center"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={`Sample ${i + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </section>
  );
}

function TitleBlock({ item }: { item: Item }) {
  const hasSubtitle = Boolean(item.titleSub && item.titleSubPublic);
  const hasKatakana = Boolean(item.creatorKatakana);

  return (
    <div className="pb-1 border-b border-[color:var(--color-line)]/50">
      {/* Mobile/Tablet (<lg): Title + Creator + Katakana on one line, with spacing. */}
      <div className="flex items-baseline gap-x-4 gap-y-1 flex-wrap lg:block">
        <h2 className="font-serif text-[28px] @md:text-[36px] @xl:text-[44px] leading-[1.05] tracking-tight text-[color:var(--color-ink)] break-words">
          {item.title}
        </h2>
        <p className="lg:hidden font-serif text-[13px] @md:text-[16px] text-[color:var(--color-ink-muted)] break-words">
          {item.creator}
        </p>
      </div>
      {hasSubtitle && (
        <p className="font-serif text-[18px] @md:text-[22px] text-[color:var(--color-ink-muted)] leading-tight mt-1 break-words">
          {item.titleSub}
        </p>
      )}
      {/* Desktop only: Creator + Katakana on its own line */}
      <p className="hidden lg:flex font-serif text-[16px] @md:text-[20px] text-[color:var(--color-ink-muted)] mt-1 mb-3 flex-col @sm:flex-row @sm:items-baseline @sm:gap-3">
        <span>{item.creator}</span>
        {hasKatakana && (
          <span className="text-[11px] @md:text-[13px] text-[color:var(--color-ink-soft)] tracking-wide">
            {item.creatorKatakana}
          </span>
        )}
      </p>
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

  const hasListen = Boolean(meta?.appleMusicUrl || meta?.spotifyUrl);

  const rowCls =
    "grid grid-cols-[7rem_1fr] sm:grid-cols-[8.5rem_1fr] items-baseline gap-x-2 py-1.5 border-b border-[color:var(--color-line)]/30 last:border-b-0";

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
        {hasListen && (
          <div className="grid grid-cols-[7rem_1fr] sm:grid-cols-[8.5rem_1fr] items-baseline gap-x-2 py-1.5">
            <dt className="text-[color:var(--color-ink-soft)] tracking-wide">Listen on</dt>
            <dd className="text-[color:var(--color-ink)] flex flex-wrap gap-1.5">
              {meta?.appleMusicUrl && (
                <a
                  href={meta.appleMusicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 bg-[color:var(--color-paper)] border border-[color:var(--color-paper-edge)] px-2 py-1 text-[11px] text-[color:var(--color-ink)] hover:bg-[color:var(--color-cream-soft)] transition"
                >
                  Apple Music
                  {EXTERNAL_ICON}
                </a>
              )}
              {meta?.spotifyUrl && (
                <a
                  href={meta.spotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 bg-[color:var(--color-paper)] border border-[color:var(--color-paper-edge)] px-2 py-1 text-[11px] text-[color:var(--color-ink)] hover:bg-[color:var(--color-cream-soft)] transition"
                >
                  Spotify
                  {EXTERNAL_ICON}
                </a>
              )}
            </dd>
          </div>
        )}
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
function YouTubeEmbed({ url, title }: { url?: string; title: string }) {
  const id = youtubeVideoId(url);
  if (!id) return null;
  return (
    <div className="aspect-video w-full bg-black overflow-hidden border border-[color:var(--color-paper-edge)]">
      <iframe
        src={`https://www.youtube.com/embed/${id}?rel=0&playsinline=1`}
        title={`${title} — MV`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        className="w-full h-full"
      />
    </div>
  );
}

function LikedBy({
  people,
  group,
  url,
  memberMap,
}: {
  people: LikedByPerson[];
  group?: string;
  url?: string;
  memberMap: Map<string, Member>;
}) {
  return (
    <section>
      <div className="flex items-baseline justify-between mb-3 gap-3 flex-wrap">
        <h3 className="font-serif text-[20px] text-[color:var(--color-ink)]">
          Liked by{" "}
          {group && (
            <span className="ml-2 text-[10px] tracking-[0.3em] text-[color:var(--color-ink-soft)] align-middle">
              {group}
            </span>
          )}
        </h3>
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
      <div className="flex flex-wrap items-start gap-x-5 gap-y-3">
        {people.map((p) => (
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
      <div className="w-20 h-20 rounded-full bg-[color:var(--color-cream-deep)] border border-[color:var(--color-line)] flex items-center justify-center overflow-hidden">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
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
}: {
  videoUrl?: string;
  members?: string[];
  memberMap: Map<string, Member>;
}) {
  const ytId = youtubeVideoId(videoUrl);
  return (
    <section>
      <div className="flex items-center gap-x-5 gap-y-2 mb-3 flex-wrap">
        <h3 className="font-serif text-[28px] @md:text-[32px] text-[color:var(--color-ink)] leading-none">Cover</h3>
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
      <div className="w-10 h-10 rounded-full bg-[color:var(--color-cream-deep)] border border-[color:var(--color-line)] flex items-center justify-center overflow-hidden">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
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

function SimilarSongs({ items }: { items: Item[] }) {
  return (
    <section>
      <h3 className="font-serif text-[20px] text-[color:var(--color-ink)] mb-2">Similar Songs</h3>
      <div className="grid grid-cols-2 gap-3">
        {items.map((s) => (
          <Link
            key={s.id}
            href={`/items/${s.id}`}
            className="group flex flex-col gap-2 p-2 border border-[color:var(--color-paper-edge)]/60 bg-[color:var(--color-paper)] transition hover:border-[color:var(--color-line)] hover:shadow-sm"
          >
            <div className="aspect-square w-full overflow-hidden">
              <ImagePlaceholder category={s.category} id={s.id} imageUrl={s.imageUrl} />
            </div>
            <div className="min-w-0">
              <p className="font-serif text-[14px] leading-tight text-[color:var(--color-ink)] line-clamp-2 group-hover:underline underline-offset-2">
                {s.title}
              </p>
              <p className="text-[10px] text-[color:var(--color-ink-muted)] truncate mt-0.5">
                {s.creator}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
