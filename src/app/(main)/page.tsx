import { RecentlyAdded } from "@/components/recently-added";
import { MoodBar } from "@/components/mood-bar";
import { CategoryGrid } from "@/components/category-grid";
import { getRecentItems, getGridItems } from "@/lib/db/items";
import { getCategoryCounts } from "@/lib/db/category-counts";
import { isAgeVerified } from "@/lib/age-verify";

export default async function Home() {
  const [recent, grid, counts, ageVerified] = await Promise.all([
    getRecentItems(13),
    getGridItems(6, 8),
    getCategoryCounts(),
    isAgeVerified(),
  ]);
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/home-bg.png"
        alt=""
        aria-hidden
        className="fixed bottom-0 left-0 lg:left-[260px] z-0 pointer-events-none h-lvh w-auto select-none will-change-transform opacity-60"
      />
      <div className="relative z-10">
        <RecentlyAdded items={recent} />
        <MoodBar />
        <CategoryGrid items={grid} counts={counts} ageVerified={ageVerified} />
      </div>
    </>
  );
}
