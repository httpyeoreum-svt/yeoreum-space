import { Search, ChevronDown } from "lucide-react";

export function HeaderBar({
  current,
  total,
}: {
  current?: number;
  total?: number;
}) {
  const showCardCounter = current !== undefined && total !== undefined;
  return (
    <header className="flex items-center gap-3 lg:gap-4 px-6 py-3 border-b border-[color:var(--color-line)]/40 shrink-0">
      {/* Search */}
      <div className="flex-1 max-w-md xl:max-w-2xl relative min-w-0">
        <Search size={13} strokeWidth={1.5} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[color:var(--color-ink-soft)]" />
        <input
          type="text"
          placeholder="Search by title, creator, or mood..."
          className="w-full bg-[color:var(--color-paper)] border border-[color:var(--color-line)]/40 pl-10 pr-3 py-2 text-xs placeholder:text-[color:var(--color-ink-soft)] text-[color:var(--color-ink)] focus:outline-none focus:border-[color:var(--color-ink)]/40"
        />
      </div>

      {/* Card counter — optional, only at xl+ */}
      {showCardCounter && (
        <button className="hidden xl:flex items-center gap-2.5 bg-[color:var(--color-paper)] border border-[color:var(--color-line)]/40 px-3 py-1.5 shrink-0 ml-auto">
          <div className="text-left leading-tight">
            <p className="text-[8px] tracking-[0.3em] text-[color:var(--color-ink-soft)]">CARD</p>
            <p className="text-[10px] tracking-widest text-[color:var(--color-ink)] tabular-nums">
              {String(current).padStart(2, "0")} / {total}
            </p>
          </div>
          <ChevronDown size={12} strokeWidth={1.5} className="text-[color:var(--color-ink-soft)]" />
        </button>
      )}
    </header>
  );
}
