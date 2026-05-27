"use client";

import { useState } from "react";
import { LayoutGrid, List, ChevronDown } from "lucide-react";
import type { Item, Category } from "@/lib/types";
import type { CategoryCounts } from "@/lib/db/category-counts";
import { ItemCardSmall } from "./item-card-small";

type Tab = "all" | Category;

const TABS: { key: Tab; label: string }[] = [
  { key: "all",     label: "ALL" },
  { key: "music",   label: "MUSIC" },
  { key: "books",   label: "BOOKS" },
  { key: "films",   label: "FILMS" },
  { key: "perfume", label: "PERFUME" },
  { key: "games",   label: "GAMES" },
];

export function CategoryGrid({
  items,
  counts,
  ageVerified,
}: {
  items: Item[];
  counts: CategoryCounts;
  ageVerified: boolean;
}) {
  const [active, setActive] = useState<Tab>("all");
  const [view, setView] = useState<"grid" | "list">("grid");

  const filtered =
    active === "all" ? items : items.filter((i) => i.category === active);

  return (
    <section className="px-6 pt-3 pb-5">
      {/* Tabs row */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-y-2">
        <div className="flex items-end gap-1 scroll-x">
          {TABS.map((t) => {
            const isActive = active === t.key;
            const count = counts[t.key];
            return (
              <button
                key={t.key}
                onClick={() => setActive(t.key)}
                className={`px-4 py-1.5 text-[10px] tracking-[0.2em] transition border-t border-x whitespace-nowrap ${
                  isActive
                    ? "bg-[color:var(--color-ink)] text-white border-[color:var(--color-ink)]"
                    : "bg-transparent text-[color:var(--color-ink-muted)] border-[color:var(--color-line)]/40 hover:text-[color:var(--color-ink)]"
                }`}
              >
                {t.label} ({count})
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 text-[9px] tracking-[0.25em] text-[color:var(--color-ink-muted)]">
            SORT
            <span className="text-[color:var(--color-ink)]">RECENT</span>
            <ChevronDown size={11} strokeWidth={1.5} />
          </button>
          <div className="flex items-center border border-[color:var(--color-line)]/50">
            <button
              onClick={() => setView("grid")}
              className={`w-7 h-7 flex items-center justify-center ${
                view === "grid"
                  ? "bg-[color:var(--color-ink)] text-white"
                  : "text-[color:var(--color-ink-muted)]"
              }`}
              aria-label="grid view"
            >
              <LayoutGrid size={13} strokeWidth={1.5} />
            </button>
            <button
              onClick={() => setView("list")}
              className={`w-7 h-7 flex items-center justify-center ${
                view === "list"
                  ? "bg-[color:var(--color-ink)] text-white"
                  : "text-[color:var(--color-ink-muted)]"
              }`}
              aria-label="list view"
            >
              <List size={13} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-[color:var(--color-cream-soft)]/50 border border-[color:var(--color-line)]/40 p-4">
        <div
          className={
            view === "grid"
              ? "grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
              : "flex flex-col gap-2"
          }
        >
          {filtered.map((item) => (
            <ItemCardSmall
              key={item.id}
              item={item}
              locked={item.ageLimit && !ageVerified}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
