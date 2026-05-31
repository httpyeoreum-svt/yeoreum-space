import Link from "next/link";
import { Lock } from "lucide-react";
import type { Item } from "@/lib/types";
import { ImagePlaceholder } from "./image-placeholder";
import { CategoryLabel } from "./category-label";

/**
 * Small "collectible" card used in the lower category grid.
 *
 * `locked` is computed at the page/server level (combination of `item.ageLimit`
 * and the visitor's age-verified cookie) and passed in so this stays sync —
 * client wrappers like CategoryGrid can render it directly.
 */
export function ItemCardSmall({ item, locked }: { item: Item; locked?: boolean }) {
  return (
    <Link
      href={`/items/${item.id}`}
      className="card-notch group relative block bg-[color:var(--color-paper)] border border-[color:var(--color-paper-edge)]/60 p-2.5 transition hover:shadow-sm hover:border-[color:var(--color-line)]"
    >
      <header className="flex items-center justify-between pb-1.5">
        <span className="text-[8px] tracking-[0.2em] text-[color:var(--color-ink-soft)]">
          {item.id}
        </span>
        <CategoryLabel category={item.category} className="!text-[7px] !tracking-[0.15em]" />
      </header>
      <div
        className={`${
          item.category === "books" ? "aspect-[3/4]" : "aspect-square"
        } w-full overflow-hidden relative`}
      >
        <div className={locked ? "w-full h-full blur-xl scale-110" : "w-full h-full"}>
          <ImagePlaceholder category={item.category} id={item.id} imageUrl={item.imageUrl} />
        </div>
        {locked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10">
            <Lock size={20} strokeWidth={1.5} className="text-white drop-shadow" />
          </div>
        )}
      </div>
      <div className="pt-2 min-w-0">
        <h3 className="font-serif text-[14px] leading-tight tracking-tight text-[color:var(--color-ink)] truncate">
          {locked ? "— age restricted —" : item.title}
        </h3>
        <p className="font-serif text-[10px] text-[color:var(--color-ink-muted)] mt-0.5 truncate">
          {locked ? "" : item.creator}
        </p>
      </div>
    </Link>
  );
}
