/**
 * Curated palette for the per-song COLOR field.
 *
 * Kept in sync with the admin repo. Used to render swatch labels and the
 * upcoming /palette page.
 */

export type MusicColor = {
  slug: string;
  label: string;
  hex: string;
};

export const MUSIC_COLOR_PALETTE: MusicColor[] = [
  { slug: "slate-blue",  label: "Slate Blue",  hex: "#4a5d6e" },
  { slug: "dusk",        label: "Dusk",        hex: "#6b7d8f" },
  { slug: "powder-blue", label: "Powder Blue", hex: "#8fa3b3" },
  { slug: "ink-navy",    label: "Ink Navy",    hex: "#2f3a4a" },

  { slug: "forest",      label: "Forest",      hex: "#4a5c47" },
  { slug: "sage",        label: "Sage",        hex: "#7a8c75" },
  { slug: "olive",       label: "Olive",       hex: "#8a8654" },

  { slug: "brick",       label: "Brick",       hex: "#8c4a3e" },
  { slug: "terracotta",  label: "Terracotta",  hex: "#a86553" },
  { slug: "peach",       label: "Peach",       hex: "#d4a190" },
  { slug: "ochre",       label: "Ochre",       hex: "#b88a3e" },
  { slug: "amber",       label: "Amber",       hex: "#c9985a" },
  { slug: "butter",      label: "Butter",      hex: "#d4b88a" },

  { slug: "plum",        label: "Plum",        hex: "#5d4a5d" },
  { slug: "mauve",       label: "Mauve",       hex: "#7a5d6e" },
  { slug: "lavender",    label: "Lavender",    hex: "#9a8aa3" },

  { slug: "rose",        label: "Rose",        hex: "#b07684" },
  { slug: "dusty-pink",  label: "Dusty Pink",  hex: "#c89fa5" },

  { slug: "charcoal",    label: "Charcoal",    hex: "#3e3e3e" },
  { slug: "stone",       label: "Stone",       hex: "#6e6e6e" },
  { slug: "mist",        label: "Mist",        hex: "#a8a8a8" },
  { slug: "taupe",       label: "Taupe",       hex: "#8a7e72" },
];

export function findPaletteEntryByHex(hex: string): MusicColor | null {
  const target = hex.trim().toLowerCase();
  return MUSIC_COLOR_PALETTE.find((c) => c.hex.toLowerCase() === target) ?? null;
}
