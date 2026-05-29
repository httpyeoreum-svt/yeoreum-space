"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

export function SearchBar({
  className = "",
  autoFocus = false,
}: {
  className?: string;
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");

  useEffect(() => {
    setQ(params.get("q") ?? "");
  }, [params]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = q.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form onSubmit={submit} className={`relative ${className}`}>
      <Search
        size={13}
        strokeWidth={1.5}
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[color:var(--color-ink-soft)] pointer-events-none"
      />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        autoFocus={autoFocus}
        placeholder="Search by title, creator, or mood..."
        className="w-full bg-[color:var(--color-paper)] border border-[color:var(--color-line)]/40 pl-10 pr-3 py-2 text-xs placeholder:text-[color:var(--color-ink-soft)] text-[color:var(--color-ink)] focus:outline-none focus:border-[color:var(--color-ink)]/40"
      />
    </form>
  );
}
