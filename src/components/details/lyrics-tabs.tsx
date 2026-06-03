"use client";

import { useState } from "react";
import type { LyricExcerpt } from "@/lib/types";

/**
 * Lyric excerpt with Original / JP sub-tabs. The JP tab only appears when a
 * Japanese translation exists; otherwise the original is shown on its own.
 */
export function LyricsTabs({ lyric }: { lyric: LyricExcerpt }) {
  const hasJp = Boolean(lyric.japanese);
  const [tab, setTab] = useState<"original" | "jp">("original");
  const text = tab === "jp" && lyric.japanese ? lyric.japanese : lyric.original;

  return (
    <section>
      {hasJp && (
        <div className="flex gap-1.5 mb-3">
          {(
            [
              { key: "original", label: "Original" },
              { key: "jp", label: "JP" },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`px-3 py-1 text-[10px] tracking-[0.2em] border transition ${
                tab === t.key
                  ? "bg-[color:var(--color-ink)] text-white border-[color:var(--color-ink)]"
                  : "bg-transparent text-[color:var(--color-ink-muted)] border-[color:var(--color-line)]/50 hover:text-[color:var(--color-ink)]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
      <div className="relative bg-[color:var(--color-paper)] border border-[color:var(--color-paper-edge)] p-4">
        <p
          key={tab}
          className="font-serif text-[15px] leading-relaxed text-[color:var(--color-ink)] whitespace-pre-line animate-[fadeIn_180ms_ease-out]"
        >
          {text}
        </p>
      </div>
    </section>
  );
}
