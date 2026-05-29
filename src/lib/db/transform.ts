import type {
  Category,
  CuratedList,
  Item,
  ItemMeta,
  Mood,
  MoodSlug,
  SceneSlug,
} from "../types";

/** Map a `items` row (with `item_moods(mood_slug)` and `item_scenes(scene_slug)` joined) to the app `Item` shape. */
export function rowToItem(row: Record<string, unknown>): Item {
  const joinedMoods =
    (row.item_moods as { mood_slug: string }[] | undefined) ?? [];
  const joinedScenes =
    (row.item_scenes as { scene_slug: string }[] | undefined) ?? [];
  return {
    id: row.id as string,
    category: row.category as Category,
    title: row.title as string,
    titleSub: (row.title_sub as string | null) ?? undefined,
    titleSubPublic: (row.title_sub_public as boolean | null) ?? false,
    creator: row.creator as string,
    creatorKatakana: (row.creator_katakana as string | null) ?? undefined,
    imageUrl: (row.image_url as string | null) ?? undefined,
    addedAt: row.added_at as string,
    note: (row.note as string | null) ?? undefined,
    meta: (row.meta as ItemMeta | null) ?? undefined,
    moods: joinedMoods.map((m) => m.mood_slug as MoodSlug),
    scenes: joinedScenes.map((s) => s.scene_slug as SceneSlug),
    ageLimit: (row.age_limit as boolean | null) ?? false,
  };
}

export function rowToMood(row: Record<string, unknown>): Mood {
  return {
    slug: row.slug as MoodSlug,
    label: row.label as string,
    bg: row.bg as string,
    tone: row.tone as "light" | "dark",
    tagline: (row.tagline as string | null) ?? undefined,
  };
}

/** Map a `lists` row (with `list_items(item_id, position)` joined) to `CuratedList`. */
export function rowToList(row: Record<string, unknown>): CuratedList {
  const joined =
    (row.list_items as { item_id: string; position: number }[] | undefined) ?? [];
  const sorted = [...joined].sort((a, b) => a.position - b.position);
  return {
    slug: row.slug as string,
    title: row.title as string,
    description: row.description as string,
    createdAt: row.created_at as string,
    themeMood: (row.theme_mood_slug as MoodSlug | null) ?? undefined,
    itemIds: sorted.map((li) => li.item_id),
  };
}
