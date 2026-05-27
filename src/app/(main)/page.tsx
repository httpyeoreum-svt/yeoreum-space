import { RecentlyAdded } from "@/components/recently-added";
import { MoodBar } from "@/components/mood-bar";
import { CategoryGrid } from "@/components/category-grid";
import { getRecentItems, getGridItems } from "@/lib/db/items";
import { getCategoryCounts } from "@/lib/db/category-counts";
import { isAgeVerified } from "@/lib/age-verify";

export default async function Home() {
  const [recent, grid, counts, ageVerified] = await Promise.all([
    getRecentItems(6),
    getGridItems(6, 6),
    getCategoryCounts(),
    isAgeVerified(),
  ]);
  return (
    <>
      <RecentlyAdded items={recent} />
      <MoodBar />
      <CategoryGrid items={grid} counts={counts} ageVerified={ageVerified} />
    </>
  );
}
