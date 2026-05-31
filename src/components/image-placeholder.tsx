import type { Category } from "@/lib/types";
import { CATEGORY_META } from "@/lib/types";
import { OptimizedImage } from "./optimized-image";

/**
 * Renders the item's uploaded image when `imageUrl` is present,
 * otherwise falls back to a category-tinted gradient stand-in.
 *
 * `sizes` should describe the rendered width at each breakpoint so next/image
 * picks an appropriately small file (defaults to a card-sized hint).
 */
export function ImagePlaceholder({
  category,
  id,
  imageUrl,
  className = "",
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 240px",
}: {
  category: Category;
  id: string;
  imageUrl?: string | null;
  className?: string;
  sizes?: string;
}) {
  if (imageUrl) {
    return (
      <div
        className={`relative w-full h-full overflow-hidden bg-[color:var(--color-cream-deep)] ${className}`}
      >
        <OptimizedImage src={imageUrl} sizes={sizes} />
      </div>
    );
  }

  const accent = CATEGORY_META[category].accentVar;
  return (
    <div
      className={`relative w-full h-full overflow-hidden bg-[color:var(--color-ink)] ${className}`}
    >
      <div
        className="absolute inset-0 opacity-90"
        style={{
          backgroundImage: `radial-gradient(at 30% 25%, ${accent} 0%, transparent 55%), radial-gradient(at 75% 80%, rgba(255,255,255,0.18) 0%, transparent 50%), linear-gradient(135deg, ${accent}66 0%, #1a1714 90%)`,
        }}
      />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent" />
      <div className="absolute top-3 left-3 text-[9px] tracking-[0.25em] text-white/40 uppercase">
        {id}
      </div>
    </div>
  );
}
