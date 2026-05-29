import { ArrowRight } from "lucide-react";
import type { Item } from "@/lib/types";
import { ItemCardLarge } from "./item-card-large";
import { isAgeVerified } from "@/lib/age-verify";
import { isItemLocked } from "@/lib/item-lock";

export async function RecentlyAdded({ items }: { items: Item[] }) {
  const verified = await isAgeVerified();
  return (
    <section className="px-6 pt-4 pb-3 shrink-0">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-[11px] tracking-[0.3em] text-[color:var(--color-ink)]">RECENTLY ADDED</h2>
        <a
          href="/collection"
          className="flex items-center gap-2 text-[10px] tracking-[0.25em] text-[color:var(--color-ink-muted)] hover:text-[color:var(--color-ink)] transition"
        >
          VIEW ALL
          <ArrowRight size={11} strokeWidth={1.5} />
        </a>
      </div>
      <div className="scroll-x flex gap-4 pb-1 items-start">
        {items.map((item, i) => (
          <div
            key={item.id}
            className={`flex-none w-[110px] ${i >= 6 ? "hidden lg:block" : "block"}`}
          >
            <ItemCardLarge item={item} locked={isItemLocked(item, verified)} />
          </div>
        ))}
      </div>
    </section>
  );
}
