import { youtubeVideoId } from "@/lib/youtube";
import { withAlpha } from "@/lib/color";

/**
 * A YouTube embed. Renders nothing for non-YouTube URLs.
 * Pass `tintColor` (a "#rrggbb" hex) to wrap the player in a tinted, padded
 * frame — used by the music MV; teaser/trailer embeds omit it.
 */
export function YouTubeEmbed({
  url,
  title,
  tintColor,
}: {
  url?: string;
  title: string;
  tintColor?: string;
}) {
  const id = youtubeVideoId(url);
  if (!id) return null;
  const tint = tintColor ? withAlpha(tintColor, 0.35) : null;
  return (
    <div
      className="w-full overflow-hidden border border-[color:var(--color-paper-edge)]"
      style={tint ? { backgroundColor: tint, padding: "10px" } : undefined}
    >
      <div className="aspect-video w-full bg-black overflow-hidden">
        <iframe
          src={`https://www.youtube.com/embed/${id}?rel=0&playsinline=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="w-full h-full"
        />
      </div>
    </div>
  );
}
