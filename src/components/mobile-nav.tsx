"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Menu, X } from "lucide-react";
import { SidebarContent } from "./sidebar";

/**
 * Mobile top bar + slide-in drawer containing the full sidebar nav.
 * Visible only below the `lg` breakpoint.
 */
export function MobileNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <header className="lg:hidden sticky top-0 z-20 flex items-center justify-between px-5 py-4 border-b border-[color:var(--color-line)]/50 bg-[color:var(--color-cream)] shrink-0">
        <Link href="/" className="font-serif text-2xl italic text-[color:var(--color-ink)] hover:opacity-80 transition">
          yeoreum space
        </Link>
        <div className="flex items-center gap-1">
          <Link
            href="/search"
            className="w-9 h-9 flex items-center justify-center text-[color:var(--color-ink)]"
            aria-label="search"
          >
            <Search size={18} strokeWidth={1.5} />
          </Link>
          <button
            onClick={() => setOpen(true)}
            className="w-9 h-9 border border-[color:var(--color-line)]/60 flex items-center justify-center text-[color:var(--color-ink)]"
            aria-label="menu"
          >
            <Menu size={18} strokeWidth={1.5} />
          </button>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden flex justify-end">
          <div
            aria-hidden
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-[color:var(--color-ink)]/40 backdrop-blur-[2px] animate-[fadein_0.18s_ease-out]"
          />
          <aside
            role="dialog"
            aria-modal="true"
            className="relative h-full w-[280px] max-w-[85vw] bg-[color:var(--color-cream-deep)] border-l border-[color:var(--color-line)] shadow-[-8px_0_24px_rgba(0,0,0,0.08)] animate-[slidein_0.22s_cubic-bezier(0.2,0.8,0.2,1)]"
          >
            <button
              onClick={() => setOpen(false)}
              aria-label="close menu"
              className="absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center bg-[color:var(--color-paper)] border border-[color:var(--color-line)] hover:bg-[color:var(--color-cream-soft)] transition"
            >
              <X size={15} strokeWidth={1.5} className="text-[color:var(--color-ink)]" />
            </button>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </aside>

          <style>{`
            @keyframes fadein { from { opacity: 0 } to { opacity: 1 } }
            @keyframes slidein { from { transform: translateX(24px); opacity: 0 } to { transform: translateX(0); opacity: 1 } }
          `}</style>
        </div>
      )}
    </>
  );
}
