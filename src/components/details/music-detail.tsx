import Link from "next/link";
import { Play, Pencil } from "lucide-react";
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

  return (
    <div className="@container">
      {/* Top section — 3-col [YouTube | Jacket+KCB+Mood | Title+TrackInfo+Genre].
          Mood and Genre are inline (label + value on one line) and pinned to
          the bottom of their columns so they appear as a single row across
          col2-col3, baseline-aligned with the YouTube's bottom. */}
      <div className="grid grid-cols-1 @[920px]:grid-cols-[1fr_260px_1fr] gap-5 items-stretch px-4 sm:px-6 md:px-8 pt-2 pb-6">
        <div className="min-w-0">
          <YouTubeEmbed url={meta?.mvUrl} title={item.title} />
        </div>
        <div className="flex flex-col gap-3 min-w-0 max-w-[260px] w-full mx-auto @[920px]:mx-0">
          <div className="aspect-square w-full overflow-hidden">
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
        <div className="flex flex-col gap-4 min-w-0 @container">
          <TitleBlock item={item} />
          <TrackInfoTable item={item} meta={meta} />
          {meta?.genre && (
            <div className="mt-auto pt-3 flex items-baseline gap-2 flex-wrap">
              <span className="text-[10px] tracking-[0.3em] text-[color:var(--color-ink-soft)]">
                Genre
              </span>
              <span className="text-[12px] text-[color:var(--color-ink)]">{meta.genre}</span>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 sm:px-6 md:px-8">
        <div className="flex flex-col gap-6 min-w-0 @container">
          {meta?.likedBy && meta.likedBy.length > 0 && (
            <LikedBy
              people={meta.likedBy}
              group={meta.likedByGroup}
              url={meta.playlistNoteUrl}
              memberMap={memberMap}
            />
          )}
          {(meta?.cover?.videoUrl || (meta?.cover?.members && meta.cover.members.length > 0)) && (
            <CoverSection
              videoUrl={meta?.cover?.videoUrl}
              members={meta?.cover?.members}
              memberMap={memberMap}
            />
          )}
          {meta?.samples && meta.samples.length > 0 && (
            <SampleGallery samples={meta.samples} />
          )}
          {item.note && <NotesBlock note={item.note} date={item.addedAt} />}
          {similar.length > 0 && <SimilarSongs items={similar} allMoods={allMoods} />}
        </div>
      </div>

    </div>
  );
}

function SampleGallery({ samples }: { samples: string[] }) {
  return (
    <section className="px-4 sm:px-6 md:px-8 pb-10 pt-2">
      <div className="flex sm:grid sm:grid-cols-2 gap-3 max-w-2xl overflow-x-auto sm:overflow-visible snap-x snap-mandatory sm:snap-none scroll-x -mx-4 sm:mx-0 px-4 sm:px-0 pb-2 sm:pb-0">
        {samples.slice(0, 4).map((url, i) => (
          <div
            key={i}
            className="shrink-0 w-[85%] sm:w-auto snap-center"
          >
            <div className="aspect-video w-full overflow-hidden bg-[color:var(--color-cream-deep)] border border-[color:var(--color-paper-edge)]/60">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Sample ${i + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function TitleBlock({ item }: { item: Item }) {
  return (
    <div className="pb-1 border-b border-[color:var(--color-line)]/50">
      <h2 className="font-serif text-[28px] @md:text-[36px] @xl:text-[44px] leading-[1.05] tracking-tight text-[color:var(--color-ink)] break-words">
        {item.title}
      </h2>
      {item.titleSub && item.titleSubPublic && (
        <p className="font-serif text-[18px] @md:text-[22px] text-[color:var(--color-ink-muted)] leading-tight mt-1 break-words">
          {item.titleSub}
        </p>
      )}
      <p className="font-serif text-[16px] @md:text-[20px] text-[color:var(--color-ink-muted)] mt-1 mb-3 flex flex-col @sm:flex-row @sm:items-baseline @sm:gap-3">
        <span>{item.creator}</span>
        {item.creatorKatakana && (
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
  const rows: InfoRow[] = [
    { label: "Album",        value: meta?.album },
    { label: "Release Date", value: meta?.releaseDate ? formatCardDate(meta.releaseDate) : undefined },
    { label: "Length",       value: meta?.length },
    { label: "Country",      value: formatCountry(meta?.country) },
  ].filter((r) => r.value);

  const hasListen = Boolean(meta?.appleMusicUrl || meta?.spotifyUrl);

  return (
    <section>
      <h3 className="font-serif text-[20px] text-[color:var(--color-ink)] mb-2">Track Info</h3>
      <dl className="text-[11px]">
        {rows.map((r) => (
          <div
            key={r.label}
            className="grid grid-cols-[5.5rem_1fr] sm:grid-cols-[7rem_1fr] items-baseline gap-x-2 py-1.5 border-b border-[color:var(--color-line)]/30 last:border-b-0"
          >
            <dt className="text-[color:var(--color-ink-soft)] tracking-wide">{r.label}</dt>
            <dd className="text-[color:var(--color-ink)] break-words">{r.value}</dd>
          </div>
        ))}
        {hasListen && (
          <div className="grid grid-cols-[5.5rem_1fr] sm:grid-cols-[7rem_1fr] items-baseline gap-x-2 py-1.5">
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
  return (
    <section>
      <h3 className="font-serif text-[20px] text-[color:var(--color-ink)] mb-2">Genre</h3>
      <p className="text-[12px] text-[color:var(--color-ink)] leading-snug">{genre}</p>
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
        src={`https://www.youtube.com/embed/${id}?rel=0`}
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
    <div className="flex flex-col items-center gap-1.5 w-14">
      <div className="w-12 h-12 rounded-full bg-[color:var(--color-cream-deep)] border border-[color:var(--color-line)] flex items-center justify-center overflow-hidden">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <span className="font-serif text-[12px] tracking-wide text-[color:var(--color-ink-muted)]">
            {initials}
          </span>
        )}
      </div>
      <p className="text-[10px] tracking-wide text-[color:var(--color-ink)]">{person.name}</p>
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
            src={`https://www.youtube.com/embed/${ytId}?rel=0`}
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

function SimilarSongs({ items, allMoods }: { items: Item[]; allMoods: Mood[] }) {
  return (
    <section>
      <h3 className="font-serif text-[20px] text-[color:var(--color-ink)] mb-2">Similar Songs</h3>
      <ul className="flex flex-col">
        {items.map((s) => (
          <li
            key={s.id}
            className="group flex items-center gap-3 py-2.5 border-b border-[color:var(--color-line)]/30 last:border-b-0 hover:bg-[color:var(--color-cream-soft)]/50 transition px-1"
          >
            <Link
              href={`/items/${s.id}`}
              className="flex-1 flex items-center gap-3 min-w-0"
            >
              <div className="w-11 h-11 shrink-0 overflow-hidden">
                <ImagePlaceholder category={s.category} id={s.id} imageUrl={s.imageUrl} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-serif text-[14px] leading-tight text-[color:var(--color-ink)] truncate group-hover:underline underline-offset-2">
                  {s.title}
                </p>
                <p className="text-[10px] text-[color:var(--color-ink-muted)] truncate">
                  {s.creator}
                </p>
              </div>
            </Link>
            <div className="hidden @md:flex items-center gap-1 shrink-0">
              {s.moods.slice(0, 2).map((slug) => {
                const m = allMoods.find((x) => x.slug === slug);
                return m ? <MoodChip key={slug} mood={m} size="sm" /> : null;
              })}
            </div>
            <span
              aria-hidden
              className="shrink-0 w-8 h-8 rounded-full border border-[color:var(--color-line)] flex items-center justify-center text-[color:var(--color-ink)]"
            >
              <Play size={11} className="ml-0.5" />
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
