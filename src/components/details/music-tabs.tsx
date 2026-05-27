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
}: {
  trackInfo: ReactNode;
  cover: ReactNode;
  liked: ReactNode;
  similar: ReactNode;
}) {
  const [tab, setTab] = useState<TabKey>("info");

  return (
    <div className="flex flex-col">
      <div className="flex border-b border-[color:var(--color-line)]/50">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex-1 px-2 py-2.5 text-[10px] tracking-[0.2em] transition border-b-2 -mb-px ${
              tab === t.key
                ? "border-[color:var(--color-ink)] text-[color:var(--color-ink)]"
                : "border-transparent text-[color:var(--color-ink-muted)] hover:text-[color:var(--color-ink)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="pt-4">
        {tab === "info" && trackInfo}
        {tab === "cover" && cover}
        {tab === "liked" && liked}
        {tab === "similar" && similar}
      </div>
    </div>
  );
}
