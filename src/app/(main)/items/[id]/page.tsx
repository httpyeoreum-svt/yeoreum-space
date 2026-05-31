import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getAllItems, getItemById, getRelatedByMood } from "@/lib/db/items";
import { ItemDetailContent } from "@/components/item-detail-content";
import { ItemIdPicker } from "@/components/item-id-picker";
import { ShuffleButton } from "@/components/shuffle-button";
import { AgeGate } from "@/components/age-gate";
import { isAgeVerified } from "@/lib/age-verify";
import { isItemLocked } from "@/lib/item-lock";
import { CATEGORY_META } from "@/lib/types";
import { artistSlug, getArtistProfileSlugs } from "@/lib/artist";

export default async function ItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const decoded = decodeURIComponent(id);
  const item = await getItemById(decoded);
  if (!item) notFound();

  if (isItemLocked(item, await isAgeVerified())) {
    return (
      <div className="flex-1 min-h-0 overflow-y-auto">
        <AgeGate redirectPath={`/items/${decoded}`} />
      </div>
    );
  }

  const related = await getRelatedByMood(item);

  const categoryMeta = CATEGORY_META[item.category];

  const allItems = await getAllItems();
  // Find next item in same category, sorted by id ascending.
  const allInCategory = allItems
    .filter((i) => i.category === item.category)
    .sort((a, b) => a.id.localeCompare(b.id));
  const idx = allInCategory.findIndex((i) => i.id === item.id);
  const prevItem = idx > 0 ? allInCategory[idx - 1] : null;
  const nextItem =
    idx >= 0 && idx < allInCategory.length - 1 ? allInCategory[idx + 1] : null;

  // If this music item's creator has a profile page (>= threshold tracks), pass its slug down.
  const profileSlugs =
    item.category === "music" ? getArtistProfileSlugs(allItems) : null;
  const itemArtistSlug =
    profileSlugs && profileSlugs.has(artistSlug(item.creator))
      ? artistSlug(item.creator)
      : undefined;

  return (
    <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-none">
      <div className="px-4 sm:px-6 md:px-8 pt-3 pb-1 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        {prevItem ? (
          <Link
            href={`/items/${prevItem.id}`}
            className="justify-self-start inline-flex items-center gap-2 text-[10px] tracking-[0.25em] text-[color:var(--color-ink-muted)] hover:text-[color:var(--color-ink)] transition"
          >
            <ArrowLeft size={12} strokeWidth={1.5} />
            BEFORE
          </Link>
        ) : (
          <span />
        )}
        <p className="text-[10px] tracking-[0.3em] text-center">
          <span style={{ color: categoryMeta.accentVar }} className="font-medium">
            {categoryMeta.label}
          </span>
          <span className="text-[color:var(--color-ink-soft)] mx-2">/</span>
          <ItemIdPicker
            currentId={item.id}
            ids={allInCategory.map((i) => i.id)}
          />
          <ShuffleButton
            currentId={item.id}
            ids={allInCategory.map((i) => i.id)}
          />
        </p>
        {nextItem ? (
          <Link
            href={`/items/${nextItem.id}`}
            className="justify-self-end inline-flex items-center gap-2 text-[10px] tracking-[0.25em] text-[color:var(--color-ink-muted)] hover:text-[color:var(--color-ink)] transition"
          >
            NEXT
            <ArrowRight size={12} strokeWidth={1.5} />
          </Link>
        ) : (
          <span />
        )}
      </div>
      <ItemDetailContent item={item} related={related} artistSlug={itemArtistSlug} />
    </div>
  );
}
