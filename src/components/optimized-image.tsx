import Image from "next/image";
import { isOptimizableImage } from "@/lib/image";

/**
 * Fills a positioned (relative) parent with the image, cropped via object-cover.
 * Known hosts (Supabase storage / Apple mzstatic) go through next/image
 * optimization; any other host falls back to a plain <img> so an unconfigured
 * remote URL never 400s through the optimizer.
 *
 * The parent element must be `position: relative` with a defined size.
 */
export function OptimizedImage({
  src,
  alt = "",
  sizes,
  className = "object-cover",
}: {
  src: string;
  alt?: string;
  /** Rendered width hint so the optimizer picks a small file. */
  sizes: string;
  className?: string;
}) {
  if (isOptimizableImage(src)) {
    return <Image src={src} alt={alt} fill sizes={sizes} className={className} />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={`absolute inset-0 h-full w-full ${className}`}
    />
  );
}
