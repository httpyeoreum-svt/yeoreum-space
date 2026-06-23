"use client";

import { useState, type ReactNode } from "react";

type Tab = { key: string; label: string; content: ReactNode };

/**
 * Tabbed section for the detail page (STORY / ABOUT, LIKED BY / RELATED, MOODS).
 * Tabs whose `content` is null/false are dropped, so empty sections never show.
 */
export function DetailTabs({ tabs }: { tabs: Tab[] }) {
  const available = tabs.filter((t) => t.content != null && t.content !== false);
  const [active, setActive] = useState(available[0]?.key ?? "");
  if (available.length === 0) return null;
  const current = available.find((t) => t.key === active) ?? available[0];

  return (
    <div className="px-4 sm:px-6 md:px-8 pt-5 pb-6 border-t border-dashed border-[color:var(--color-paper-edge)] mx-4 sm:mx-6 md:mx-8">
      <div className="flex gap-5 border-b border-[color:var(--color-line)]/30 mb-4">
        {available.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActive(t.key)}
            className={`pb-2 -mb-px text-[10px] tracking-[0.3em] transition border-b ${
              current.key === t.key
                ? "text-[color:var(--color-ink)] border-[color:var(--color-ink)]"
                : "text-[color:var(--color-ink-soft)] border-transparent hover:text-[color:var(--color-ink-muted)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div>{current.content}</div>
    </div>
  );
}
