/**
 * Shown instantly during client navigation between (main) routes while the
 * target server component streams in. Gives a tactile "something is happening"
 * cue so taps never feel dead.
 */
export default function Loading() {
  return (
    <div className="flex-1 min-h-0 flex items-center justify-center py-32">
      <div className="flex flex-col items-center gap-5">
        <div className="h-9 w-9 rounded-full border-2 border-[color:var(--color-line)] border-t-[color:var(--color-ink)] animate-spin" />
        <div className="flex flex-col items-center gap-2">
          <p className="text-[10px] tracking-[0.5em] text-[color:var(--color-ink-muted)] animate-pulse pl-[0.5em]">
            LOADING…
          </p>
          <div className="h-px w-28 overflow-hidden bg-[color:var(--color-line)]/40">
            <div className="h-full w-1/4 bg-[color:var(--color-ink)] [animation:loadingBar_1.1s_ease-in-out_infinite]" />
          </div>
        </div>
      </div>
    </div>
  );
}
