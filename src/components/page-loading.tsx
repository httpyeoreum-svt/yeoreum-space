/**
 * Shared route loading indicator. Used by the (main) loading.tsx and the
 * item detail loading.tsx so navigation (including NEXT / BEFORE between
 * songs) always shows a "something is happening" cue.
 */
export function PageLoading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[color:var(--color-cream)]/70 backdrop-blur-[2px]">
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
