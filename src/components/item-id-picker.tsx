"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

/**
 * Tappable item id (e.g. "M-077") in the detail header. Opens a scrollable
 * list of every id in the same category; picking one navigates to that page.
 */
export function ItemIdPicker({
  currentId,
  ids,
}: {
  currentId: string;
  ids: string[];
}) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLAnchorElement>(null);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Center the current id when the list opens.
  useEffect(() => {
    if (open) activeRef.current?.scrollIntoView({ block: "center" });
  }, [open]);

  return (
    <span ref={boxRef} className="relative inline-flex align-middle">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Jump to another item"
        className="inline-flex items-center gap-1 text-[color:var(--color-ink-soft)] hover:text-[color:var(--color-ink)] transition"
      >
        {currentId}
        <ChevronDown
          size={10}
          strokeWidth={1.5}
          className={`transition ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="absolute left-1/2 -translate-x-1/2 top-[calc(100%+6px)] z-30 max-h-60 w-24 overflow-y-auto bg-[color:var(--color-paper)] border border-[color:var(--color-line)] shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
          {ids.map((id) => {
            const active = id === currentId;
            return (
              <Link
                key={id}
                ref={active ? activeRef : undefined}
                href={`/items/${id}`}
                onClick={() => setOpen(false)}
                className={`block px-3 py-1.5 text-[10px] tracking-[0.2em] text-center transition ${
                  active
                    ? "bg-[color:var(--color-ink)] text-white"
                    : "text-[color:var(--color-ink-muted)] hover:bg-[color:var(--color-cream-soft)]"
                }`}
              >
                {id}
              </Link>
            );
          })}
        </div>
      )}
    </span>
  );
}
