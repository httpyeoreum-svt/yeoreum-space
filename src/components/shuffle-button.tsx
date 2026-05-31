"use client";

import { useRouter } from "next/navigation";
import { Shuffle } from "lucide-react";

/**
 * Shuffle icon next to the item id in the detail header. Tapping it jumps to a
 * random *other* item in the same category. Uses router.push so the route
 * loading.tsx spinner shows during navigation.
 */
export function ShuffleButton({
  currentId,
  ids,
}: {
  currentId: string;
  ids: string[];
}) {
  const router = useRouter();
  const others = ids.filter((id) => id !== currentId);
  if (others.length === 0) return null;

  const go = () => {
    const pick = others[Math.floor(Math.random() * others.length)];
    router.push(`/items/${pick}`);
  };

  return (
    <button
      type="button"
      onClick={go}
      aria-label="Shuffle to a random item"
      className="ml-2 inline-flex items-center align-middle text-[color:var(--color-ink-soft)] hover:text-[color:var(--color-ink)] transition"
    >
      <Shuffle size={12} strokeWidth={1.5} />
    </button>
  );
}
