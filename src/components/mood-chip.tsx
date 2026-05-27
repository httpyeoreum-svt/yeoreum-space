import Link from "next/link";
import type { Mood } from "@/lib/types";

export function MoodChip({
  mood,
  active = false,
  size = "md",
  href,
}: {
  mood: Mood;
  active?: boolean;
  size?: "sm" | "md";
  href?: string;
}) {
  const text = mood.tone === "dark" ? "text-white" : "text-[color:var(--color-ink)]";
  const padding = size === "sm" ? "px-3 py-1 text-[11px]" : "px-4 py-1.5 text-xs";
  const className = `inline-flex items-center rounded-full ${padding} ${text} transition ${
    active ? "ring-1 ring-[color:var(--color-ink)]/40" : ""
  } ${href ? "hover:opacity-90 hover:ring-1 hover:ring-[color:var(--color-ink)]/30" : ""}`;
  const style = { backgroundColor: mood.bg };

  if (href) {
    return (
      <Link href={href} className={className} style={style}>
        {mood.label}
      </Link>
    );
  }
  return (
    <span className={className} style={style}>
      {mood.label}
    </span>
  );
}
