"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Home,
  LayoutGrid,
  MessageSquareQuote,
  NotebookText,
  BookText,
  ListOrdered,
  Info,
  Sun,
} from "lucide-react";
import { QUOTE } from "@/lib/data";
import { formatLongDate } from "@/lib/format";

const NAV = [
  { label: "HOME",       icon: Home,                href: "/" },
  { label: "COLLECTION", icon: LayoutGrid,          href: "/collection" },
  { label: "MOODS",      icon: MessageSquareQuote,  href: "/moods" },
  { label: "JOURNAL",    icon: NotebookText,        href: "/journal" },
  { label: "NOVELS",     icon: BookText,            href: "/novels" },
  { label: "LISTS",      icon: ListOrdered,         href: "/lists" },
  { label: "ABOUT",      icon: Info,                href: "/about" },
];

/** Inner sidebar content — reused by desktop `Sidebar` and the mobile drawer. */
export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <div className="flex flex-col h-full px-5 py-5">
      <Link
        href="/"
        onClick={onNavigate}
        className="mb-4 block"
      >
        <h1 className="font-serif text-[26px] leading-none italic text-[color:var(--color-ink)]">
          yeoreum space
        </h1>
      </Link>

      <nav className="flex flex-col gap-0.5 mb-auto">
        {NAV.map((n) => {
          const Icon = n.icon;
          const active = isActive(n.href);
          return (
            <Link
              key={n.label}
              href={n.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-2 py-1.5 text-[10px] tracking-[0.2em] transition ${
                active
                  ? "text-[color:var(--color-ink)] border-l-2 border-[color:var(--color-ink)] -ml-2 pl-[10px] bg-[color:var(--color-cream-soft)]/60"
                  : "text-[color:var(--color-ink-muted)] hover:text-[color:var(--color-ink)] border-l-2 border-transparent -ml-2 pl-[10px]"
              }`}
            >
              <Icon size={13} strokeWidth={1.5} />
              {n.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 bg-[color:var(--color-cream-soft)] border border-[color:var(--color-line)]/60 px-3 py-3 text-[10px] leading-snug text-[color:var(--color-ink-muted)]">
        <p className="mb-2">&ldquo;{QUOTE.body}&rdquo;</p>
        <p className="text-right text-[color:var(--color-ink-soft)]">{QUOTE.attribution}</p>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="text-[9px] tracking-[0.2em] text-[color:var(--color-ink-muted)]">
          <p>{now ? formatLongDate(now) : "—"}</p>
          <p className="mt-0.5">
            {now
              ? now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }).toUpperCase()
              : "—"}
          </p>
        </div>
        <div className="w-7 h-7 rounded-full bg-[color:var(--color-cream-soft)] border border-[color:var(--color-line)]/60 flex items-center justify-center">
          <Sun size={14} strokeWidth={1.5} className="text-[color:var(--color-ink-muted)]" />
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden lg:flex w-[260px] shrink-0 h-screen lg:sticky lg:top-0 lg:self-start bg-[color:var(--color-cream-deep)] border-r border-[color:var(--color-line)]/60">
      <SidebarContent />
    </aside>
  );
}
