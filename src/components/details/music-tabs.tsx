"use client";

import { useState, type ReactNode } from "react";

const TABS = [
  { key: "info", label: "Info" },
  { key: "cover", label: "Cover" },
  { key: "liked", label: "Liked" },
  { key: "similar", label: "Similar" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function MusicTabs({
  trackInfo,
  cover,
  liked,
  similar,
  counts,
}: {
  trackInfo: ReactNode;
  cover: ReactNode;
  liked: ReactNode;
  similar: ReactNode;
  counts?: Partial<Record<TabKey, number>>;
}) {
  const [tab, setTab] = useState<TabKey>("info");

  return (
    <div className="flex flex-col">
      <div className="flex border-b border-[color:var(--color-line)]/50">
        {TABS.map((t) => {
          const count = counts?.[t.key] ?? 0;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex-1 px-2 py-2.5 text-[10px] tracking-[0.2em] transition border-b-2 -mb-px touch-manipulation active:bg-[color:var(--color-cream-soft)] active:scale-[0.97] ${
                tab === t.key
                  ? "border-[color:var(--color-ink)] text-[color:var(--color-ink)]"
                  : "border-transparent text-[color:var(--color-ink-muted)] hover:text-[color:var(--color-ink)]"
              }`}
            >
              {t.label}
              {count > 0 && (
                <span className="ml-1 text-[9px] text-[color:var(--color-ink-soft)] tracking-normal">
                  +{count}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div key={tab} className="pt-4 animate-[fadeIn_180ms_ease-out]">
        {tab === "info" && trackInfo}
        {tab === "cover" && cover}
        {tab === "liked" && liked}
        {tab === "similar" && similar}
      </div>
    </div>
  );
}
