"use client";

import { useState } from "react";
import type { LyricExcerpt } from "@/lib/types";

const TAB_LABEL = { original: "Original", jp: "JP" } as const;

/**
 * Lyric excerpt with Original / JP sub-tabs.
 * - Original tab appears only when an original passage exists.
 * - JP tab appears when a translation exists, or when an original exists but
 *   has no translation yet (so a missing translation shows a placeholder).
 * - A Japanese-only song therefore shows just the JP content with no tab bar.
 */
export function LyricsTabs({ lyric }: { lyric: LyricExcerpt }) {
  const hasOriginal = Boolean(lyric.original);
  const hasJp = Boolean(lyric.japanese);

  const tabs = [
    hasOriginal ? ("original" as const) : null,
    hasJp || hasOriginal ? ("jp" as const) : null,
  ].filter((t): t is "original" | "jp" => t !== null);

  const [tab, setTab] = useState<"original" | "jp">(tabs[0]);
  const text = tab === "jp" ? lyric.japanese : lyric.original;
  const missing = !text;
  const placeholder = tab === "jp" ? "日本語訳は未登録です" : "原文は未登録です";

  return (
    <section>
      {tabs.length > 1 && (
        <div className="flex gap-1.5 mb-3">
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-3 py-1 text-[10px] tracking-[0.2em] border transition ${
                tab === t
                  ? "bg-[color:var(--color-ink)] text-white border-[color:var(--color-ink)]"
                  : "bg-transparent text-[color:var(--color-ink-muted)] border-[color:var(--color-line)]/50 hover:text-[color:var(--color-ink)]"
              }`}
            >
              {TAB_LABEL[t]}
            </button>
          ))}
        </div>
      )}
      <div className="relative bg-[color:var(--color-paper)] border border-[color:var(--color-paper-edge)] p-4">
        {missing ? (
          <p
            key={`${tab}-missing`}
            className="text-[12px] text-[color:var(--color-ink-soft)] italic animate-[fadeIn_180ms_ease-out]"
          >
            {placeholder}
          </p>
        ) : (
          <p
            key={tab}
            className="font-serif text-[13px] leading-relaxed text-[color:var(--color-ink)] whitespace-pre-line animate-[fadeIn_180ms_ease-out]"
          >
            {text}
          </p>
        )}
      </div>
    </section>
  );
}
