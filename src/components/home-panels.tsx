import Link from "next/link";

/**
 * 2x2 banner panels below the mood bar: music / books on top, game / camera
 * below. Each panel shows a header image (public/<key>.svg) with its label
 * overlaid; missing images fall back to a cream block so nothing breaks.
 */
const PANELS = [
  { key: "music", label: "MUSIC", href: "/collection" },
  { key: "books", label: "BOOKS", href: "/collection" },
  { key: "game", label: "GAME", href: "/collection" },
  { key: "camera", label: "CAMERA", href: "/collection" },
] as const;

export function HomePanels() {
  return (
    <section className="px-6 py-4 shrink-0">
      <div className="grid grid-cols-2 gap-0">
        {PANELS.map((p) => (
          <Link
            key={p.key}
            href={p.href}
            aria-label={p.label}
            className="group relative aspect-[3/4] overflow-hidden bg-[color:var(--color-cream-deep)]"
          >
            <div
              className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105"
              style={{ backgroundImage: `url(/${p.key}.svg)` }}
            />
          </Link>
        ))}
      </div>
    </section>
  );
}
