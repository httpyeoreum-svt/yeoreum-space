import Link from "next/link";
import { Lock } from "lucide-react";
import type { Item } from "@/lib/types";
import { ImagePlaceholder } from "./image-placeholder";
import { CategoryLabel } from "./category-label";
import { formatCardDate } from "@/lib/format";

/**
 * Large card used inside the "Recently Added" horizontal carousel.
 * `locked` is computed by the caller (server page) — see ItemCardSmall.
 */
export function ItemCardLarge({ item, locked }: { item: Item; locked?: boolean }) {
  return (
    <Link href={`/items/${item.id}`} className="flex-none w-[110px] group">
      <div className="aspect-[4/5] w-full overflow-hidden border border-transparent group-hover:border-[color:var(--color-line)] transition relative">
        <div className={locked ? "w-full h-full blur-xl scale-110" : "w-full h-full"}>
          <ImagePlaceholder category={item.category} id={item.id} imageUrl={item.imageUrl} />
        </div>
        {locked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10">
            <Lock size={20} strokeWidth={1.5} className="text-white drop-shadow" />
          </div>
        )}
      </div>
      <div className="mt-0.5 space-y-0.5 min-w-0">
        <CategoryLabel category={item.category} className="!text-[7px] !tracking-[0.15em]" />
        <h3 className="font-serif text-[12px] leading-tight tracking-tight text-[color:var(--color-ink)] truncate group-hover:underline underline-offset-2">
          {locked ? "— age restricted —" : item.title}
        </h3>
        <p className="text-[9px] text-[color:var(--color-ink-muted)] truncate">
          {locked ? "" : item.creator}
        </p>
        <p className="text-[8px] tracking-[0.2em] text-[color:var(--color-ink-soft)] pt-0.5">
          {locked ? "" : formatCardDate(item.addedAt)}
        </p>
      </div>
    </Link>
  );
}
