import type { Category } from "@/lib/types";
import { CATEGORY_META } from "@/lib/types";

export function CategoryLabel({
  category,
  className = "",
}: {
  category: Category;
  className?: string;
}) {
  const meta = CATEGORY_META[category];
  return (
    <span
      className={`text-[10px] tracking-[0.25em] font-medium ${className}`}
      style={{ color: meta.accentVar }}
    >
      {meta.label}
    </span>
  );
}
