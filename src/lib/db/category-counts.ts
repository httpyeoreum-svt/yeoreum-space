import { cache } from "react";
import type { Category } from "@/lib/types";
import { getAllItems } from "./items";

export type CategoryCounts = {
  all: number;
  music: number;
  books: number;
  films: number;
  perfume: number;
  games: number;
};

export const getCategoryCounts = cache(async (): Promise<CategoryCounts> => {
  const items = await getAllItems();
  const count = (cat: Category) =>
    items.filter((i) => i.category === cat).length;
  return {
    all: items.length,
    music: count("music"),
    books: count("books"),
    films: count("films"),
    perfume: count("perfume"),
    games: count("games"),
  };
});
