import { OptimizedImage } from "./optimized-image";

type Size = "sm" | "md" | "lg";

const RING: Record<Size, string> = {
  sm: "w-10 h-10",
  md: "w-14 h-14",
  lg: "w-20 h-20",
};
const IMG: Record<Size, string> = { sm: "40px", md: "56px", lg: "80px" };
const TEXT: Record<Size, string> = {
  sm: "text-[12px]",
  md: "text-[13px]",
  lg: "text-[16px]",
};

/**
 * Circular member avatar — image when available, otherwise the name's initials.
 * Used by liked-by grids, the cover credit row, and the novel members list.
 * Callers wrap it with their own name/layout.
 */
export function AvatarCircle({
  name,
  avatarUrl,
  size = "md",
}: {
  name: string;
  avatarUrl?: string;
  size?: Size;
}) {
  const initials = name.slice(0, 2).toUpperCase();
  return (
    <div
      className={`relative ${RING[size]} rounded-full bg-[color:var(--color-cream-deep)] border border-[color:var(--color-line)] flex items-center justify-center overflow-hidden`}
    >
      {avatarUrl ? (
        <OptimizedImage src={avatarUrl} sizes={IMG[size]} />
      ) : (
        <span
          className={`font-serif ${TEXT[size]} tracking-wide text-[color:var(--color-ink-muted)]`}
        >
          {initials}
        </span>
      )}
    </div>
  );
}
