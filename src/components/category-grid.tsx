"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { LayoutGrid, List, ChevronDown } from "lucide-react";
import type { Item, Category } from "@/lib/types";
import type { CategoryCounts } from "@/lib/db/category-counts";
import { ItemCardSmall } from "./item-card-small";
import { ImagePlaceholder } from "./image-placeholder";
import { CategoryLabel } from "./category-label";
import { isItemLocked } from "@/lib/item-lock";

type Tab = "all" | Category;

type SortKey = "recent" | "title" | "year" | "runtime" | "country" | "genre";
const SORT_LABELS: Record<SortKey, string> = {
  recent: "RECENT",
  title: "TITLE",
  year: "YEAR",
  runtime: "RUNTIME",
  country: "COUNTRY",
  genre: "GENRE",
};

/**
 * Production / publication year (releaseDate, then legacy year). 0 when unknown.
 * Films and books both carry these fields.
 */
function itemYear(i: Item): number {
  const m = i.meta;
  if (m?.category === "films" || m?.category === "books") {
    const d = m.releaseDate?.trim();
    if (d) return parseInt(d.slice(0, 4), 10) || 0;
    return m.year ?? 0;
  }
  return 0;
}
/** Runtime in minutes; Infinity when unknown so it sorts last ascending. */
function filmRuntime(i: Item): number {
  return i.meta?.category === "films" && typeof i.meta.runtime === "number"
    ? i.meta.runtime
    : Infinity;
}
/** Country name; unknown → high sentinel so it sorts last alphabetically. */
function filmCountry(i: Item): string {
  const c = i.meta?.category === "films" ? i.meta.country?.trim() : "";
  return c || "￿";
}
/** Genre; unknown → high sentinel so it sorts last. Films and books both have it. */
function itemGenre(i: Item): string {
  const m = i.meta;
  if (m?.category === "films" || m?.category === "books") {
    return m.genre?.trim() || "￿";
  }
  return "￿";
}

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
  initialTab = "all",
}: {
  items: Item[];
  counts: CategoryCounts;
  ageVerified: boolean;
  /** Tab selected on first render (e.g. from the home panels' ?cat= link). */
  initialTab?: Tab;
}) {
  const [active, setActive] = useState<Tab>(initialTab);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState<SortKey>("recent");
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  // Films expose the full set; books add year / genre; others stay minimal.
  const sortOptions: SortKey[] =
    active === "films"
      ? ["recent", "title", "year", "runtime", "country", "genre"]
      : active === "books"
        ? ["recent", "title", "year", "genre"]
        : ["recent", "title"];
  const effectiveSort: SortKey = sortOptions.includes(sort) ? sort : "recent";

  useEffect(() => {
    if (!sortOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!sortRef.current?.contains(e.target as Node)) setSortOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [sortOpen]);

  const filtered =
    active === "all" ? items : items.filter((i) => i.category === active);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    switch (effectiveSort) {
      case "title":
        arr.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "year":
        arr.sort((a, b) => itemYear(b) - itemYear(a));
        break;
      case "runtime":
        arr.sort((a, b) => filmRuntime(a) - filmRuntime(b));
        break;
      case "country":
        arr.sort((a, b) => filmCountry(a).localeCompare(filmCountry(b)));
        break;
      case "genre":
        arr.sort((a, b) => itemGenre(a).localeCompare(itemGenre(b)));
        break;
      // "recent": keep the addedAt-desc order from getAllItems.
    }
    return arr;
  }, [filtered, effectiveSort]);

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
          <div className="relative" ref={sortRef}>
            <button
              type="button"
              onClick={() => setSortOpen((o) => !o)}
              className="flex items-center gap-2 text-[9px] tracking-[0.25em] text-[color:var(--color-ink-muted)] hover:text-[color:var(--color-ink)] transition"
            >
              SORT
              <span className="text-[color:var(--color-ink)]">
                {SORT_LABELS[effectiveSort]}
              </span>
              <ChevronDown size={11} strokeWidth={1.5} />
            </button>
            {sortOpen && (
              <div className="absolute right-0 top-full mt-1.5 z-20 min-w-[8rem] bg-[color:var(--color-paper)] border border-[color:var(--color-line)]/60 shadow-sm">
                {sortOptions.map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setSort(key);
                      setSortOpen(false);
                    }}
                    className={`block w-full text-left px-3 py-2 text-[10px] tracking-[0.2em] transition ${
                      effectiveSort === key
                        ? "text-[color:var(--color-ink)] bg-[color:var(--color-cream-soft)]"
                        : "text-[color:var(--color-ink-muted)] hover:text-[color:var(--color-ink)] hover:bg-[color:var(--color-cream-soft)]/60"
                    }`}
                  >
                    {SORT_LABELS[key]}
                  </button>
                ))}
              </div>
            )}
          </div>
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
        {view === "grid" ? (
          <div className="grid items-start gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
            {sorted.map((item) => (
              <ItemCardSmall
                key={item.id}
                item={item}
                locked={isItemLocked(item, ageVerified)}
              />
            ))}
          </div>
        ) : (
          <ul className="flex flex-col divide-y divide-[color:var(--color-line)]/30">
            {sorted.map((item) => {
              const locked = isItemLocked(item, ageVerified);
              return (
                <li key={item.id}>
                  <Link
                    href={`/items/${item.id}`}
                    className="tap group flex items-center gap-3 py-2.5 hover:bg-[color:var(--color-cream-soft)]/50 transition px-1"
                  >
                    <div className="w-12 h-12 shrink-0 overflow-hidden">
                      <div className={locked ? "w-full h-full blur-xl scale-110" : "w-full h-full"}>
                        <ImagePlaceholder category={item.category} id={item.id} imageUrl={item.imageUrl} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-serif text-[14px] leading-tight text-[color:var(--color-ink)] truncate group-hover:underline underline-offset-2">
                        {locked ? "— age restricted —" : item.title}
                      </p>
                      <p className="text-[10px] text-[color:var(--color-ink-muted)] truncate mt-0.5">
                        {locked ? "" : item.creator}
                      </p>
                    </div>
                    <CategoryLabel category={item.category} className="!text-[8px] !tracking-[0.15em] shrink-0" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
