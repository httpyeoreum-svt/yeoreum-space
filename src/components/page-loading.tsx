/**
 * Shared route loading indicator. Used by the (main) loading.tsx and the
 * item detail loading.tsx so navigation (including NEXT / BEFORE between
 * songs) always shows a "something is happening" cue.
 */
export function PageLoading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[color:var(--color-cream)]/70 backdrop-blur-[2px]">
      <div className="h-10 w-10 rounded-full border-2 border-[color:var(--color-line)] border-t-[color:var(--color-ink)] animate-spin" />
    </div>
  );
}
