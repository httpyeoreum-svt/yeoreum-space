import { Suspense } from "react";
import { ChevronDown } from "lucide-react";
import { SearchBar } from "./search-bar";

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
      <Suspense fallback={null}>
        <SearchBar className="flex-1 max-w-md xl:max-w-2xl min-w-0" />
      </Suspense>

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
