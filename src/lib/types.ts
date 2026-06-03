export type Category = "music" | "books" | "films" | "perfume" | "games";

export const CATEGORY_META: Record<
  Category,
  { label: string; prefix: string; accentVar: string }
> = {
  music:   { label: "MUSIC",   prefix: "M", accentVar: "var(--color-cat-music)" },
  books:   { label: "BOOKS",   prefix: "B", accentVar: "var(--color-cat-books)" },
  films:   { label: "FILMS",   prefix: "F", accentVar: "var(--color-cat-films)" },
  perfume: { label: "PERFUME", prefix: "P", accentVar: "var(--color-cat-perfume)" },
  games:   { label: "GAMES",   prefix: "G", accentVar: "var(--color-cat-games)" },
};

export type MoodSlug =
  | "night"
  | "sweet"
  | "rain"
  | "lonely"
  | "bright"
  | "summer"
  | "soft";

export type SceneSlug = string;

/** Master entry in the scenes list (emotional / situational tag — 失恋, 後悔, etc.). */
export type Scene = {
  slug: SceneSlug;
  label: string;
};

export type Mood = {
  slug: MoodSlug;
  label: string;
  /** css color value (hex / var) */
  bg: string;
  /** "light" → dark text on chip; "dark" → light text on chip */
  tone: "light" | "dark";
  /** One-line description shown on /moods and /moods/[slug]. */
  tagline?: string;
};

/** A user-curated cross-media list / "playlist". */
export type CuratedList = {
  slug: string;
  title: string;
  description: string;
  /** ISO date string. */
  createdAt: string;
  /** Ordered list of item ids included in this list. */
  itemIds: string[];
  /** Optional themed mood — affects color accent on cards. */
  themeMood?: MoodSlug;
};

/** A person associated with an item (recommended it / "liked by"). */
export type LikedByPerson = {
  name: string;
  /** Group/affiliation, e.g. "SEVENTEEN". Used as a header label. */
  groupName?: string;
  avatarUrl?: string;
};

/** Global member registry entry — looked up by name for Cover / Liked by avatars. */
export type Member = {
  name: string;
  avatarUrl?: string;
  groupName?: string;
};

/** Bilingual short lyric / passage excerpt. */
export type LyricExcerpt = {
  original: string;
  japanese?: string;
};

/** Category-specific metadata kept as a discriminated union. */
export type MusicMeta = {
  category: "music";
  album?: string;
  releaseDate?: string;
  /** Work this song is the theme / title song for, e.g. "アニメ『◯◯』主題歌". */
  themeSong?: string;
  /** "Indie / Dream Pop" — free-form. */
  genre?: string;
  /** Track length as "mm:ss". */
  length?: string;
  /** Country of production / origin, e.g. "KR", "Korea". */
  country?: string;
  /** @deprecated — kept for backward compat. */
  format?: string;
  mvUrl?: string;
  /** Up to 4 sample / screenshot URLs (e.g. MV stills). */
  samples?: string[];
  /** Streaming platform deep links. */
  appleMusicUrl?: string;
  spotifyUrl?: string;
  /** Cover performance — videoUrl + members who performed it. */
  cover?: {
    videoUrl?: string;
    members?: string[];
  };
  lyricExcerpt?: LyricExcerpt;
  likedBy?: LikedByPerson[];
  /** Group header for likedBy, e.g. "SEVENTEEN". */
  likedByGroup?: string;
  /** External URL for a "playlist note" link. */
  playlistNoteUrl?: string;
  /** Owner's recommendation note — short freeform text explaining why this song stands out. */
  recommendation?: string;
  /** Musical key as written, e.g. "D# Minor", "Cm". */
  musicalKey?: string;
  /** Camelot wheel notation, e.g. "2A", "10B". */
  camelot?: string;
  /** Beats per minute, integer. */
  bpm?: number;
  /** Spotify/TuneBat-style audio features. All optional, 0-100 unless noted. */
  audioFeatures?: AudioFeatures;
  /** Theme color (hex, e.g. "#5b6f8a"). Drives the smartphone slideshow
   * background and the translucent header strip behind artist name. */
  color?: string;
};

/** Manually entered Spotify audio features. 0-100 except loudness (dB). */
export type AudioFeatures = {
  popularity?: number;
  energy?: number;
  danceability?: number;
  /** Spotify calls this "valence". */
  happiness?: number;
  acousticness?: number;
  instrumentalness?: number;
  liveness?: number;
  speechiness?: number;
  /** dB, typically -60 to 0. */
  loudness?: number;
};

export type BooksMeta = {
  category: "books";
  publisher?: string;
  /** Publication date as written. Accepts yyyy or yyyy-mm-dd. */
  releaseDate?: string;
  genre?: string;
  /** @deprecated — superseded by releaseDate. Kept for legacy rows. */
  year?: number;
  /** Members who like / recommend this book. */
  likedBy?: LikedByPerson[];
  /** Group header for likedBy, e.g. "SEVENTEEN". */
  likedByGroup?: string;
};

export type FilmsMeta = {
  category: "films";
  director?: string;
  year?: number;
  runtime?: number;
  /** Members who like / recommend this film. */
  likedBy?: LikedByPerson[];
  /** Group header for likedBy, e.g. "SEVENTEEN". */
  likedByGroup?: string;
};

export type PerfumeMeta = {
  category: "perfume";
  /** Character moods (Cool / Warm / Floral / etc.). */
  moods?: string[];
  /** @deprecated Flat olfaction notes — superseded by notesTop / notesMiddle / notesLast. */
  notes?: string[];
  /** Top notes. */
  notesTop?: string[];
  /** Middle / heart notes. */
  notesMiddle?: string[];
  /** Last / base notes. */
  notesLast?: string[];
  /** Fragrance concentration tier — Parfum / EDP / EDT / EDC / Eau Fraîche. */
  concentration?: string;
  /** External URL where this fragrance can be purchased. */
  purchaseUrl?: string;
  /** Members who like / wear / recommend this fragrance. */
  likedBy?: LikedByPerson[];
  /** Group header for likedBy, e.g. "SEVENTEEN". */
  likedByGroup?: string;
};

export type GamesMeta = {
  category: "games";
  platform?: string;
  genre?: string;
};

export type ItemMeta = MusicMeta | BooksMeta | FilmsMeta | PerfumeMeta | GamesMeta;

export type Item = {
  /** Human-friendly id, e.g. "M-018" */
  id: string;
  category: Category;
  /** Main title — always shown publicly. */
  title: string;
  /** Optional sub-title (alternate spelling); only shown publicly if `titleSubPublic`. */
  titleSub?: string;
  titleSubPublic?: boolean;
  /** Primary creator in latin script (artist / author / director / brand). */
  creator: string;
  /** Optional Japanese katakana spelling, shown next to / under the English creator. */
  creatorKatakana?: string;
  /** URL to cover image (Supabase Storage). Falls back to ImagePlaceholder if absent. */
  imageUrl?: string;
  /** ISO date string */
  addedAt: string;
  moods: MoodSlug[];
  scenes: SceneSlug[];
  note?: string;
  meta?: ItemMeta;
  /** True ⇒ blurred on lists and gated on detail until the viewer unlocks age. */
  ageLimit?: boolean;
};

// ============================================================================
// Posts (blog)
// ============================================================================

export type PostStatus = "draft" | "published";

export type Post = {
  slug: string;
  title: string;
  /** Rich HTML produced by the WYSIWYG editor on the admin side. */
  content: string;
  excerpt?: string;
  coverImage?: string;
  status: PostStatus;
  publishedAt?: string;
  tags: string[];
  /** IDs of related catalog items (music/books/films/perfume/games). */
  relatedItemIds: string[];
  createdAt: string;
  updatedAt: string;
};
