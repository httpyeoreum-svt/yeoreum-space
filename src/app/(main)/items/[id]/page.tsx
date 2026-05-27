import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getAllItems, getItemById, getRelatedByMood } from "@/lib/db/items";
import { ItemDetailContent } from "@/components/item-detail-content";
import { AgeGate } from "@/components/age-gate";
import { isAgeVerified } from "@/lib/age-verify";
import { CATEGORY_META } from "@/lib/types";

export default async function ItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const decoded = decodeURIComponent(id);
  const item = await getItemById(decoded);
  if (!item) notFound();

  if (item.ageLimit && !(await isAgeVerified())) {
    return (
      <div className="flex-1 min-h-0 overflow-y-auto">
        <AgeGate redirectPath={`/items/${decoded}`} />
      </div>
    );
  }

  const related = await getRelatedByMood(item);

  const categoryMeta = CATEGORY_META[item.category];

  // Find next item in same category, sorted by id ascending.
  const allInCategory = (await getAllItems())
    .filter((i) => i.category === item.category)
    .sort((a, b) => a.id.localeCompare(b.id));
  const idx = allInCategory.findIndex((i) => i.id === item.id);
  const nextItem =
    idx >= 0 && idx < allInCategory.length - 1 ? allInCategory[idx + 1] : null;

  return (
    <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-none">
      <div className="px-4 sm:px-6 md:px-8 pt-3 pb-1 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <Link
          href="/"
          className="justify-self-start inline-flex items-center gap-2 text-[10px] tracking-[0.25em] text-[color:var(--color-ink-muted)] hover:text-[color:var(--color-ink)] transition"
        >
          <ArrowLeft size={12} strokeWidth={1.5} />
          <span className="lg:hidden">BACK</span>
          <span className="hidden lg:inline">BACK TO COLLECTION</span>
        </Link>
        <p className="text-[10px] tracking-[0.3em] text-center">
          <span style={{ color: categoryMeta.accentVar }} className="font-medium">
            {categoryMeta.label}
          </span>
          <span className="text-[color:var(--color-ink-soft)] mx-2">/</span>
          <span className="text-[color:var(--color-ink-soft)]">{item.id}</span>
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
      <ItemDetailContent item={item} related={related} />
    </div>
  );
}
