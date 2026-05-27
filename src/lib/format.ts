/** Format an ISO date as "MAY 31, 2024" — used in card meta lines. */
export function formatCardDate(iso: string): string {
  const d = new Date(iso);
  return d
    .toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    })
    .toUpperCase();
}

/** Format an ISO date as "06 / 01 / 2024" — used in sidebar owner card. */
export function formatSlashDate(iso: string): string {
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm} / ${dd} / ${d.getFullYear()}`;
}

/** Format a date like "SAT 01 JUN 2024" — used in sidebar date card. */
export function formatLongDate(date: Date): string {
  return date
    .toLocaleDateString("en-US", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .toUpperCase()
    .replace(/,/g, "");
}
